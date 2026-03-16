import express from 'express'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { adminAuthLogin, adminRegisterUser, adminUserDetails, adminUserDetailsUpdate } from './auth.js'
import {generateInvoiceDraft, getAllInvoices, getInvoice, updateInvoice,deleteInvoice, finaliseInvoice, exportInvoice, uploadOrderDocument, parseOrderDocument} from './invoiceGeneration.js'
import { authenticate } from '../middleware/authenticate.js'
import { UserLogin, UserRegister} from './types.js'
import { extractBearerToken } from './helper.js'
import { InvoiceNotFoundError } from './errors.js'
import { validateInvoice } from './invoiceValidation.js'
import multer from 'multer'

dotenv.config()
const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI
const upload = multer({ storage: multer.memoryStorage() })

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

// ─── User ─────────────────────────────────────────────────────────────────────

// update user details
app.put('/v1/admin/user/details', authenticate, async (req: Request, res: Response) => {
  try {
    const token = extractBearerToken(req)!
    const { email, businessName, password } = req.body
    const result = await adminUserDetailsUpdate(token, { email, businessName, password })
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
      return res.status(400).json({ error: 'MISSING_FILE', message: 'No file uploaded' })
    }
    const { issueDate, dueDate, currency, invoicePeriod } = req.body
    const user = req.user
    const userId = user!.adminId

    const result = await parseOrderDocument(
      req.file.buffer,
      req.file.mimetype,
      userId,
      issueDate,
      dueDate,
      currency,
      invoicePeriod
    )

    return res.status(200).json(result)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({ error: err.name, message: err.message })
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

// get all invoices
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

export default app