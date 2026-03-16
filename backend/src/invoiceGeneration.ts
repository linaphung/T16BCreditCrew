import Invoice from '../models/Invoice.js'
import { GeneratedInvoice, InvoiceData, DraftInvoiceInput, DeleteInvoiceResponse, InvoicePeriod } from './types.js'
import { calculateLineExtension, generateXMLString} from './helper.js'
import {InvoiceBadRequest, InvoiceNotFoundError, InvalidFileError } from './errors.js'
import {validateInvoiceHelper} from './invoiceValidation.js' 
import { XMLParser } from 'fast-xml-parser'


//!                          uploadOrderDocument
/*
  Validates an uploaded order document
 * @param {Buffer} fileBuffer - the uploaded file buffer
 * @param {string} mimeType - the mime type of the file
 * @returns {string} - the raw file content as a string
*/
export const uploadOrderDocument = (
  fileBuffer: Buffer,
  mimeType: string
): { file: string } => {
  if (
    mimeType !== 'application/json' &&
    mimeType !== 'text/plain' &&
    mimeType !== 'application/xml' &&
    mimeType !== 'text/xml'
  ) 
    throw new InvalidFileError('Invalid file format. Must be XML or JSON')
  
  return { file: fileBuffer.toString() }
}

//!                          parseOrderDocument
/*
  Parses an uploaded UBL order document and creates a draft invoice
 * @param {Buffer} fileBuffer - the uploaded file buffer
 * @param {string} mimeType - the mime type of the file
 * @param {string} userId - the user's id
 * @param {string} issueDate - the issue date of the invoice
 * @param {string} dueDate - the due date of the invoice
 * @param {string} currency - the currency of the invoice
 * @param {InvoicePeriod} invoicePeriod - optional invoice period
 * @returns {GeneratedInvoice} - the created draft invoice
*/
export const parseOrderDocument = async (
  fileBuffer: Buffer,
  mimeType: string,
  userId: string,
  issueDate: string,
  dueDate: string,
  currency: string,
  invoicePeriod?: InvoicePeriod
): Promise<GeneratedInvoice> => {
  let parsed: any

  if (mimeType === 'application/json' || mimeType === 'text/plain') {
    try {
      parsed = JSON.parse(fileBuffer.toString())
    } catch {
      throw new InvalidFileError('Invalid JSON file')
    }
  } else if (mimeType === 'application/xml' || mimeType === 'text/xml') {
    try {
      const parser = new XMLParser({ ignoreAttributes: false })
      parsed = parser.parse(fileBuffer.toString())
    } catch {
      throw new InvalidFileError('Invalid XML file')
    }
  } else {
    throw new InvalidFileError('Invalid file format. Must be XML or JSON')
  }

  const order = parsed?.Order ?? parsed

  const buyer = order?.BuyerCustomerParty?.Party?.PartyName?.Name ?? order?.buyer
  const seller = order?.SellerSupplierParty?.Party?.PartyName?.Name ?? order?.seller
  const paymentTerms = order?.PaymentTerms?.Note ?? order?.paymentTerms

  const rawLines = order?.OrderLine ?? order?.orderLines
  const orderLines = (Array.isArray(rawLines) ? rawLines : [rawLines]).map((line: any) => ({
    lineId: line?.LineItem?.ID ?? line?.lineId,
    itemName: line?.LineItem?.Item?.Name ?? line?.itemName,
    quantity: Number(line?.LineItem?.Quantity ?? line?.quantity),
    unitPrice: Number(line?.LineItem?.Price?.PriceAmount ?? line?.unitPrice),
  }))

  if (!buyer || !seller || !paymentTerms || !orderLines.length) {
    throw new InvalidFileError('Missing required fields in order document')
  }

  if (!issueDate || !dueDate || !currency) {
    throw new InvalidFileError('Missing required fields: issueDate, dueDate, currency')
  }

  return generateInvoiceDraft({
    issueDate,
    dueDate,
    currency,
    invoicePeriod,
    paymentTerms,
    buyer,
    seller,
    orderLines
  }, userId)
}


export const generateInvoiceDraft = async (
  input: DraftInvoiceInput,
  userId: string,
): Promise<GeneratedInvoice> => {
  // calculate payable amount for orderlines
  const payableAmount = calculateLineExtension(input.orderLines)
  // create invoiceData
  const invoiceData: InvoiceData = {
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    paymentTerms: input.paymentTerms,
    invoicePeriod: input.invoicePeriod ? {
      invoiceStartDate: input.invoicePeriod.invoiceStartDate,
      invoiceEndDate: input.invoicePeriod.invoiceEndDate,
    }: undefined,
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
  let invoice;
  try {
      invoice = await Invoice.findOne({ _id: invoiceId, userId })
    } catch {
      throw new InvoiceNotFoundError('Invoice does not exist')
    }
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
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
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
    throw new InvoiceNotFoundError("Invoice not found")
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
    throw new InvoiceNotFoundError("Invoice not found")
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