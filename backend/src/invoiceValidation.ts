import Invoice from '../models/Invoice.js'
import { InvoiceData } from './types.js'
import { generateXMLString } from './helper.js'
import { InvoiceNotFoundError } from './errors.js'
import path from 'path'
import libxml from 'libxmljs2'
import fs from 'fs'

/**
 * Strips verbose UBL namespace URIs from validation error messages,
 * replacing them with their cbc:/cac: shorthand equivalents.
 */
const formatValidationError = (message: string) => {
  return message
    .replaceAll(
      '{urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2}',
      'cbc:'
    )
    .replaceAll(
      '{urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2}',
      'cac:'
    )
    .replaceAll(
      '{urn:oasis:names:specification:ubl:schema:xsd:Invoice-2}',
      ''
    )
}

/**
 * Validates a UBL XML string against the local UBL 2.1 Invoice XSD schema.
 * The XSD is read from disk on each call — validation is done entirely locally.
 *
 * @returns `{ valid: true, errors: [] }` on success, or a list of formatted
 *          schema validation errors on failure.
 */
export const validateInvoiceHelper = (xmlString: string) => {
  const xsdPath = path.resolve('schemas/maindoc/UBL-Invoice-2.1.xsd')
  const xsdString = fs.readFileSync(xsdPath, 'utf8')

  const xmlDoc = libxml.parseXmlString(xmlString)
  const xsdDoc = libxml.parseXmlString(xsdString, {
    baseUrl: `file://${xsdPath}`
  })

  const isValid = xmlDoc.validate(xsdDoc)
  return {
    valid: isValid,
    errors: isValid
      ? []
      : xmlDoc.validationErrors.map(e => formatValidationError(e.message.trim()))
  }
}

/**
 * Generates and validates the XML for an existing invoice.
 * Updates the invoice status to 'finalised' or 'invalid' depending on the result.
 *
 * @throws {InvoiceNotFoundError} If the invoice doesn't exist or belong to the user.
 */
export const validateInvoice = async (invoiceId: string, userId: string) => {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  if (!invoice)
    throw new InvoiceNotFoundError('Invoice does not exist')

  const invoiceData = invoice.invoiceData as InvoiceData
  const xmlString = generateXMLString(invoiceData, invoiceId)
  const res = validateInvoiceHelper(xmlString)

  invoice.invoiceXMLString = res.valid ? xmlString : ''
  invoice.status = res.valid ? 'finalised' : 'invalid'
  await invoice.save()

  return res
}