
import Invoice from '../models/Invoice.js'
import { InvoiceBadRequest, InvoiceNotFoundError} from './errors.js'
import sgMail from '@sendgrid/mail';
import validator from 'email-validator'

export const emailInvoice = async(invoiceId: string, userId: string, email: string) => {
  if (!validator.validate(email)) {
    throw new InvoiceBadRequest('Invalid Email Address')
  }
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
  if (!invoice) {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  if (invoice.status !== 'finalised') {
    throw new InvoiceBadRequest('Invoice has not been successfully finalised')
  }
  const xmlString = invoice.invoiceXMLString
  if (!xmlString) {
    throw new InvoiceBadRequest('Invoice has not been successfully finalised')
  }
 
  try {
    await sgMail.send({
      from: process.env.SENDER_EMAIL!,
      to: email,
      subject: `Invoice ${invoiceId}`,
      html: '<p>Please find your invoice attached.</p>',
      attachments: [{
        filename: `invoice-${invoiceId}.xml`,
        content: Buffer.from(xmlString).toString('base64'),
        type: 'application/xml',
        disposition: 'attachment'
      }]
    })
    invoice.status = 'sent'
    await invoice.save()
  } catch (error){
    console.error('SendGrid error:', error)
    throw new InvoiceBadRequest('Failed to send email')
  }

  return {message: `Invoice sent to ${email}`}
}