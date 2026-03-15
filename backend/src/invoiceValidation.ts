import Invoice from '../models/Invoice.js'
import {InvoiceData} from './types.js'
import {generateXMLString} from './helper.js'
import {InvoiceNotFoundError } from './errors.js'
import path from 'path'
import libxml from 'libxmljs2'
import fs from 'fs'

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

export const validateInvoiceHelper = (xmlString: string) => {
  const xsdPath = path.resolve('schemas/maindoc/UBL-Invoice-2.1.xsd')
  const xsdString = fs.readFileSync(xsdPath, 'utf8')
  // const xmlDoc = libxml.parseXml(xmlString)
  // const xsdDoc = libxml.parseXml(xsdString)
  const xmlDoc = libxml.parseXmlString(xmlString)
  const xsdDoc = libxml.parseXmlString(xsdString, {
    baseUrl: `file://${xsdPath}` 
  })
  const isValid = xmlDoc.validate(xsdDoc)
  return {
    valid: isValid,
    errors: isValid ? 
      []
      :
      xmlDoc.validationErrors.map(e => formatValidationError(e.message.trim()))
  }
}

export const validateInvoice = async(invoiceId: string, userId: string) => {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
  if (!invoice) {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
  const invoiceData = invoice.invoiceData as InvoiceData
  // update invoice xml 
  const xmlString = generateXMLString(invoiceData, invoiceId)
  const res = validateInvoiceHelper(xmlString)
  invoice.invoiceXMLString = res.valid ? xmlString : ''
  invoice.status = res.valid ? 'finalised' : 'invalid'
  await invoice.save()
  // finalise xml here it self
  return res;
}
