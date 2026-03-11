import Invoice from '../models/Invoice.js'
import { GeneratedInvoice, InvoiceData, DraftInvoiceInput, DeleteInvoiceResponse } from './types.js'
import { calculateLineExtension, getUserAbn, generateXMLString} from './helper.js'
import {InvoiceBadRequest, InvoiceNotFoundError } from './errors.js'
import {validateInvoiceHelper} from './invoiceValidation.js'

export const generateInvoiceDraft = async (
  input: DraftInvoiceInput,
  userId: string,
): Promise<GeneratedInvoice> => {
  // calculate payable amount for orderlines
  const payableAmount = calculateLineExtension(input.orderLines)
  // get user abn and name from database
  const abn = await getUserAbn(userId)
  // create invoiceData
  const invoiceData: InvoiceData = {
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    paymentTerms: input.paymentTerms,
    invoicePeriod: {
      invoiceStartDate: input.invoicePeriod.invoiceStartDate,
      invoiceEndDate: input.invoicePeriod.invoiceEndDate,
    },
    buyer: {
      name: input.buyer
    },
    seller: {
      name: input.seller
    },
    lineItems: input.orderLines,
    payableAmount: {
      currency: input.currency,
      amount: payableAmount
    }
  }

  // add to database
  const invoice = await Invoice.create({
    userId: userId,
    status: 'draft',
    invoiceData: invoiceData,
    // build string only when finalised
    invoiceXMLString: ""
  })
  // store invoice in data base
  return {
    invoiceId: invoice._id.toString(),
    invoiceData: invoiceData,
    invoiceStatus: 'draft',
    // build XML string when draft is validated and finalised 
    invoiceXML: ""
  }

}

// finalises a valid invoice - cannot be editted
export const finaliseInvoice = async(invoiceId: string, userId: string) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })
  if (!invoice) {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
  if (invoice.status === 'finalised') {
    throw new InvoiceBadRequest('Invoice is already finalised')
  }

  const invoiceData = invoice.invoiceData as InvoiceData

  // update invoice xml 
  const xmlString = generateXMLString(invoiceData, invoiceId)
  // check if valid - after validation implemented
  if (!validateInvoiceHelper(xmlString).valid) {
    throw new InvoiceBadRequest('Invoice is not valid')
  }
  invoice.invoiceXMLString = xmlString
  invoice.status = 'finalised'
  await invoice.save()

  return {invoiceId}

}

// exports invoice as xml document
export const exportInvoice = async(invoiceId: string, userId: string) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })
  if (!invoice) {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  if (invoice.status !== 'finalised' || !invoice.invoiceXMLString) {
    throw new InvoiceBadRequest('Invoice has not been successfully finalised')
  }

  const invoiceXMLString = invoice.invoiceXMLString
  // update invoice xml 
  return invoiceXMLString

}

export const getInvoice = async (invoiceId: string, userId: string): Promise<GeneratedInvoice> => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  return {
    invoiceId: invoice._id.toString(),
    invoiceStatus: invoice.status,
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceXML: invoice.invoiceXMLString!
  }
}

export const getAllInvoices = async (userId: string): Promise<GeneratedInvoice[]> => {
  const invoices = await Invoice.find({userId})

  return invoices.map(invoice => {
    return {
      invoiceId: invoice._id.toString(),
      invoiceStatus: invoice.status,
      invoiceData: invoice.invoiceData as InvoiceData,
      invoiceXML: invoice.invoiceXMLString || ""
    }
  })
}

export const updateInvoice = async (invoiceId: string, userId: string, updatedFields: Partial<InvoiceData>): Promise<GeneratedInvoice> => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  invoice.invoiceData = Object.assign({}, invoice.invoiceData, updatedFields);
  await invoice.save()

  return {
    invoiceId: invoice._id.toString(),
    invoiceStatus: invoice.status,
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceXML: invoice.invoiceXMLString!
  }
}

//!                          invoiceDelete
/* 
  Deletes an invoice
 * @param {string} invoiceId - The ID of thje invoice
 * @param {string} userId - For authentication 
*/
export const deleteInvoice = async (
  invoiceId: string, 
  userId: string
): Promise<DeleteInvoiceResponse> => {
  
  const result = await Invoice.deleteOne({ _id: invoiceId, userId });
  
  if (result.deletedCount === 0) {
    throw new InvoiceNotFoundError("Invoice not found");
  }
  
  return {};
};