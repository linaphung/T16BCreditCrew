import Invoice from './models/Invoice.js'
import {InvoiceData} from './types.js'
import {generateXMLString} from './helper.js'
import {InvoiceNotFoundError } from './errors.js'
import path from 'path'
import libxml from 'libxmljs2'
import fs from 'fs'

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
      xmlDoc.validationErrors.map(e => e.message.trim())
  }
}

export const validateInvoice = async(invoiceId: string, userId: string) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })
  if (!invoice) {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
  const invoiceData = invoice.invoiceData as InvoiceData
  // update invoice xml 
  const xmlString = generateXMLString(invoiceData, invoiceId)
  const res = validateInvoiceHelper(xmlString)
  // finalise xml here it self
  return res;
}
