import express from 'express'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { adminAuthLogin, adminRegisterUser, adminUserDetails, adminUserDetailsUpdate } from './auth.js'
import {generateInvoiceDraft, getAllInvoices, getInvoice, updateInvoice,deleteInvoice, finaliseInvoice, exportInvoice, uploadOrderDocument, parseOrderDocument, markAsPaid, checkForOverdue} from './invoiceGeneration.js'
import { authenticate } from '../middleware/authenticate.js'
import { InvoiceFilters, UserLogin, UserRegister} from './types.js'
import { extractBearerToken } from './helper.js'
import { InvoiceNotFoundError } from './errors.js'
import { validateInvoice } from './invoiceValidation.js'
import { emailInvoice } from './emailservice.js'
import {changeInvoiceCurrency} from './currencyService.js'
import { exportInvoicePDF } from './pdfExport.js'
import multer from 'multer'
import swaggerUi from 'swagger-ui-express'
import jsyaml from 'js-yaml'
import fs from 'fs'
import sgMail from '@sendgrid/mail';
import cors from 'cors'


dotenv.config()
const app = express()
app.use(express.json())
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://t16bcreditcrew-86oh.onrender.com'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }))
app.use(cors())

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
const upload = multer({ storage: multer.memoryStorage() })
const swaggerDocument = jsyaml.load(fs.readFileSync('./swagger.yaml', 'utf-8'))

console.log('URI exists?', Boolean(MONGODB_URI))

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Credit Crew')
})

// Basic liveness check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

if (!MONGODB_URI) {
  console.error('MONGODB_URI is undefined')
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB')
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error)
    })
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
app.post('/v1/admin/auth/register', async (req: Request<{}, {}, UserRegister>, res: Response) => {
  try {
    const {email, businessName, abn, password} = req.body
    const result = await adminRegisterUser(email, businessName, abn, password)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
app.post('/v1/admin/login', async (req: Request<{}, {}, UserLogin>, res: Response) => {
  try {
    const {email, password} = req.body
    const result = await adminAuthLogin(email, password)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// Token is invalidated by the authenticate middleware — nothing extra needed here
app.post('/v1/admin/logout', authenticate, async (req: Request, res: Response) => {
  return res.status(200).json({})
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument as object))

// ─── User ─────────────────────────────────────────────────────────────────────

// update user details
app.put('/v1/admin/user/details', authenticate, async (req: Request, res: Response) => {
  try {
    const token = extractBearerToken(req)!
    const {
      email,
      businessName,
      password,
      abn,
      phoneNumber,
      address,
      includeAbn,
      includeEmail,
      includePhoneNumber,
      includeAddress
    } = req.body

    const result = await adminUserDetailsUpdate(token, {
      email,
      businessName,
      password,
      abn,
      phoneNumber,
      address,
      includeAbn,
      includeEmail,
      includePhoneNumber,
      includeAddress
    })

    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// get user details
app.get('/v1/admin/user/details', authenticate, async (req: Request, res: Response) => {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      return res.status(401).json({
        error: 'InvalidTokenError',
        message: 'Token is invalid'
      })
    }

    const result = await adminUserDetails(token)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// ─── Order upload ──────────────────────────────────────────────────────────────

// Validates and returns raw file contents — does not create an invoice
app.post('/v1/admin/order/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'MISSING_FILE', message: 'No file uploaded' })
    }
    const result = uploadOrderDocument(req.file.buffer, req.file.mimetype)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({ error: err.name, message: err.message })
  }
})

// Parses an order document (XML or JSON) and creates a draft invoice
app.post('/v1/admin/order/parse', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'MISSING_FILE',
        message: 'No file uploaded'
      })
    }
    const result = await parseOrderDocument(req.file.buffer)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// ─── Invoices ─────────────────────────────────────────────────────────────────

// generates a draft invoice
app.post('/v1/admin/invoice', authenticate, async (req: Request, res: Response) => {
  try {
    const draftinput = req.body
    const user = req.user
    const userId = user!.adminId
    const result = await generateInvoiceDraft(draftinput, userId)
    return res.status(200).json({result})
  } catch (error) {

    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    const message = err.message || 'Server Error'
    return res.status(statusCode).json({
      error: err.name,
      message: message,
    })
  }
})

// Locks the invoice and generates its UBL XML — cannot be edited after this
app.put('/v1/admin/invoice/finalise/:invoiceId', authenticate, async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId as string
    const user = req.user
    const userId = user!.adminId
    const result = await finaliseInvoice(invoiceId, userId)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    const message = err.message || 'Server Error'
    return res.status(statusCode).json({
      error: err.name,
      message: message,
    })
  }
})

// Returns the finalised invoice as a downloadable UBL XML file
app.get('/v1/admin/invoice/:invoiceId/xml', authenticate, async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId as string
    const user = req.user
    const userId = user!.adminId
    const xmlString= await exportInvoice(invoiceId, userId)
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.xml`)
    return res.status(200).send(xmlString)
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    const message = err.message || 'Server Error'
    return res.status(statusCode).json({
      error: err.name,
      message: message,
    })
  }
})

// get all invoices (v1)
app.get('/v1/admin/invoices', authenticate, async (req, res) => {
  try {
    const user = req.user
    const userId = user!.adminId
    const invoices = await getAllInvoices(userId)

    res.status(200).json({invoices})
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        error: err.name,
        message: "Internal error (unexpected failure)."
      })
    }
  }
})

// get all invoices + filtering (v2)
app.get('/v2/admin/invoices', authenticate, async (req, res) => {
  try {
    const user = req.user
    const userId = user!.adminId

    const filters: InvoiceFilters = {
      ...(req.query.status && { status: req.query.status as string }),
      ...(req.query.buyerName && { buyerName: req.query.buyerName as string }),
      ...(req.query.sellerName && { sellerName: req.query.sellerName as string }),
      ...((req.query.issueDateFrom || req.query.issueDateTo) && {
        issueDate: {
          ...(req.query.issueDateFrom && { from: req.query.issueDateFrom as string }),
          ...(req.query.issueDateTo && { to: req.query.issueDateTo as string })
        }
      }),
      ...((req.query.dueDateFrom || req.query.dueDateTo) && {
        dueDate: {
          ...(req.query.dueDateFrom && { from: req.query.dueDateFrom as string }),
          ...(req.query.dueDateTo && { to: req.query.dueDateTo as string })
        }
      }),
      ...((req.query.periodFrom || req.query.periodTo) && {
        invoicePeriod: {
          ...(req.query.periodFrom && { startDate: req.query.periodFrom as string }),
          ...(req.query.periodTo && { endDate: req.query.periodTo as string })
        }
      })
    }

    const invoices = await getAllInvoices(userId, filters)
    res.status(200).json({invoices})
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        error: err.name,
        message: "Internal error (unexpected failure)."
      })
    }
  }
})

// get a particular invoice
app.get('/v1/invoices/:invoiceId', authenticate, async (req, res) => {
  try {
    const {invoiceId} = req.params
    if (!invoiceId) {
      return res.status(404).json({
        error: "invoiceId is invalid or empty",
        message: "invoiceId is invalid or empty"
      })
    }

    const user = req.user
    const userId = user!.adminId
    const invoice = await getInvoice(invoiceId as string, userId)

    res.status(200).json(invoice)
  } catch (err: unknown) {
    if (err instanceof InvoiceNotFoundError) {
      return res.status(404).json({
        error: err.name,
        message: err.message
      })
    }
    if (err instanceof Error && err.name === 'CastError') {
      return res.status(404).json({
        error: "invoiceId is invalid or empty",
        message: "invoiceId is invalid or empty"
      })
    }
    if (err instanceof Error) {
      return res.status(500).json({
        error: err.name,
        message: "Internal error (unexpected failure)."
      })
    }
  }
})

// delete a particular invoice
app.delete('/v1/invoices/:invoiceId', authenticate, async (req, res) => {
  try {
    const {invoiceId} = req.params
    if (!invoiceId) {
      return res.status(401).json({
        error: "invoiceId is invalid or empty",
        message: "invoiceId is invalid or empty"
      })
    }

    const user = req.user
    const userId = user!.adminId

    await deleteInvoice(invoiceId as string, userId)

    res.status(200).json({})
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// edit a particular invoice
app.put('/v1/invoices/:invoiceId', authenticate, async (req, res) => {
  try {
    const {invoiceId} = req.params
    if (!invoiceId) {
      return res.status(401).json({
        error: "invoiceId is invalid or empty",
        message: "invoiceId is invalid or empty"
      })
    }

    const user = req.user
    const userId = user!.adminId
    const updatedFields = req.body

    const invoice = await updateInvoice(invoiceId as string, userId, updatedFields)

    res.status(200).json(invoice)
  } catch (err: unknown) {
    if (err instanceof InvoiceNotFoundError) {
      return res.status(404).json({
        error: err.name,
        message: err.message
      })
    }
    if (err instanceof Error && err.name === 'CastError') {
      return res.status(404).json({
        error: "invoiceId is invalid or empty",
        message: "invoiceId is invalid or empty"
      })
    }
    if (err instanceof Error) {
      return res.status(500).json({
        error: err.name,
        message: "Internal error (unexpected failure)."
      })
    }
  }
})

// Validates the invoice against the UBL 2.1 XSD schema and updates its status
app.post('/v1/invoices/:invoiceId/validate',authenticate,  async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId as string
    const user = req.user
    const userId = user!.adminId
    const result = await validateInvoice(invoiceId, userId)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    const message = err.message || 'Server Error'
    return res.status(statusCode).json({
      error: err.name,
      message: message,
    })
  }
})

app.post('/v1/invoices/send-email/:invoiceId', authenticate, async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId as string
    const {email} = req.body
    const user = req.user
    const userId = user!.adminId
    const result = await emailInvoice(invoiceId, userId, email)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    const message = err.message || 'Server Error'
    return res.status(statusCode).json({
      error: err.name,
      message: message,
    })

  }
})

app.put('/v1/invoices/convert-currency/:invoiceId', authenticate, async(req: Request, res: Response) => {
  try {
    const {to} = req.body;
    const invoiceId = req.params.invoiceId as string;
    const user = req.user
    const userId = user!.adminId
    const result = await changeInvoiceCurrency(invoiceId, userId, to)
    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    const message = err.message || 'Server Error'
    return res.status(statusCode).json({
      error: err.name,
      message: message,
    })
  }
})

// Returns the finalised invoice as a downloadable PDF
app.get('/v1/admin/invoice/:invoiceId/pdf', authenticate, async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId as string
    const userId = req.user!.adminId
    const doc = await exportInvoicePDF(invoiceId, userId)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`)
    doc.pipe(res)
    doc.end()
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
      error: err.name,
      message: err.message,
    })
  }
})

app.put('/v1/admin/invoice/:invoiceId/mark-as-paid', authenticate, async(req: Request, res: Response) => {
    try {
      const invoiceId = req.params.invoiceId as string;
      const user = req.user
      const userId = user!.adminId
      const result = await markAsPaid(invoiceId, userId)
      return res.status(200).json(result)
    } catch (error) {
      const err = error as Error & { statusCode?: number }
      const statusCode = err.statusCode || 500
      const message = err.message || 'Server Error'
      return res.status(statusCode).json({
        error: err.name,
        message: message,
      })
    }
})

app.put('/v1/admin/invoice/mark-overdue', authenticate, async(req: Request, res: Response) => {
    try {
      const user = req.user
      const userId = user!.adminId
      const result = await checkForOverdue(userId)
      return res.status(200).json(result)
    } catch (error) {
      const err = error as Error & { statusCode?: number }
      const statusCode = err.statusCode || 500
      const message = err.message || 'Server Error'
      return res.status(statusCode).json({
        error: err.name,
        message: message,
      })
    }
})

export default app