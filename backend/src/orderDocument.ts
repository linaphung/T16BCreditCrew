import { ParseOrderContract } from "./types.js"
import { InvalidFileError } from "./errors.js"
import { XMLParser } from "fast-xml-parser"

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