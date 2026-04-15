import { adminRegisterUser, adminAuthLogin, adminAuthLogout, adminUserDetails, adminUserDetailsUpdate } from '../../src/auth.js'
import { generateInvoiceDraft, uploadOrderDocument, parseOrderDocument, finaliseInvoice, exportInvoice, getInvoice, getAllInvoices, updateInvoice, deleteInvoice, checkForOverdue, markAsPaid } from '../../src/invoiceGeneration.js'
import { validateInvoiceHelper, validateInvoice } from '../../src/invoiceValidation.js'
import { UserUpdate, DraftInvoiceInput, InvoiceData, InvoicePeriod } from '../../src/types.js'

export const register = async (email: string, businessName: string, abn: string, password: string) => {
  try {
    const body = await adminRegisterUser(email, businessName, abn, password)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const login = async (email: string, password: string) => {
  try {
    const body = await adminAuthLogin(email, password)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const logout = async (token: string) => {
  try {
    const body = await adminAuthLogout(token)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const userDetails = async (token: string) => {
  try {
    const body = await adminUserDetails(token)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const userDetailsUpdate = async (token: string, updates: UserUpdate) => {
  try {
    const body = await adminUserDetailsUpdate(token, updates)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const uploadOrder = (fileBuffer: Buffer, mimeType: string) => {
  try {
    const body = uploadOrderDocument(fileBuffer, mimeType)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const parseOrder = async (fileBuffer: Buffer) => {
  try {
    const body = await parseOrderDocument(fileBuffer)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const createInvoiceDraft = async (input: DraftInvoiceInput, userId: string) => {
  try {
    const body = await generateInvoiceDraft(input, userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const finalise = async (invoiceId: string, userId: string) => {
  try {
    const body = await finaliseInvoice(invoiceId, userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const exportInv = async (invoiceId: string, userId: string) => {
  try {
    const body = await exportInvoice(invoiceId, userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const getInv = async (invoiceId: string, userId: string) => {
  try {
    const body = await getInvoice(invoiceId, userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const getAllInv = async (userId: string) => {
  try {
    const body = await getAllInvoices(userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const updateInv = async (invoiceId: string, userId: string, updatedFields: Partial<InvoiceData>) => {
  try {
    const body = await updateInvoice(invoiceId, userId, updatedFields)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const deleteInv = async (invoiceId: string, userId: string) => {
  try {
    const body = await deleteInvoice(invoiceId, userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const validateInvHelper = (xmlString: string) => {
  try {
    const body = validateInvoiceHelper(xmlString)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const validateInv = async (invoiceId: string, userId: string) => {
  try {
    const body = await validateInvoice(invoiceId, userId)
    return { body, statusCode: 200 }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const checkOverdue = async (userId: string) => {
  try {
    const result = await checkForOverdue(userId)
    return { statusCode: 200, body: result }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}

export const markPaid = async (userId: string, invoiceId: string) => {
  try {
    const result = await markAsPaid(invoiceId, userId)
    return { statusCode: 200, body: result }
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    return { body: { error: err.name, message: err.message }, statusCode: err.statusCode || 400 }
  }
}