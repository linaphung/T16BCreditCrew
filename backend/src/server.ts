import express from 'express'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { adminAuthLogin, adminRegisterUser, adminUserDetails } from './auth.js'
import {generateInvoiceDraft, getAllInvoices, getInvoice, updateInvoice,deleteInvoice, finaliseInvoice, exportInvoice} from './invoiceGeneration.js'
import { authenticate } from '../middleware/authenticate.js'
import { UserLogin, UserRegister} from './types.js'
import { extractBearerToken } from './helper.js'

dotenv.config()
const app = express()
app.use(express.json())

const MONGODB_URI = process.env.MONGODB_URI

console.log('URI exists?', Boolean(MONGODB_URI))

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is undefined')
}

await mongoose.connect(MONGODB_URI)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Credit Crew')
})

// tests the health of the server and database
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})
// server route for adminRegisterUser
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

// logs a registered user in
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

// logs out user
app.post('/v1/admin/logout', authenticate, async (req: Request, res: Response) => {
  return res.status(200).json({})
})


// update user details
app.put('/v1/admin/user/details', async () => {

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


// uploads and parses a order document (combines parse and upload)
app.post('/v1/admin/order/parse-order', async () => {

})

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

// update status to finalised 
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
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// get a particular invoice
app.get('/v1/invoices/:invoiceId', authenticate, async (req, res) => {
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
    const invoice = await getInvoice(invoiceId as string, userId)

    res.status(200).json(invoice)
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
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
  } catch (error) {
    const err = error as Error
    return res.status(400).json({
      error: err.name,
      message: err.message
    })
  }
})

// validate a invoice
app.post('/v1/invoices/:invoiceId/validate', async () => {

})

export default app