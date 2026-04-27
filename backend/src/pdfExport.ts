import PDFDocument from 'pdfkit'
import Invoice from '../models/Invoice.js'
import User from '../models/User.js'
import { InvoiceNotFoundError } from './errors.js'
import { InvoiceData } from './types.js'

export async function exportInvoicePDF(
  invoiceId: string,
  userId: string
): Promise<PDFKit.PDFDocument> {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })
  if (!invoice) throw new InvoiceNotFoundError('Invoice not found')

  if (
    invoice.status !== 'finalised' &&
    invoice.status !== 'pending' &&
    invoice.status !== 'paid'
  ) {
    const err = new Error('Only finalised invoices can be exported as PDF') as Error & {
      statusCode: number
    }
    err.statusCode = 400
    throw err
  }

  const user = await User.findById(userId)
  if (!user) throw new InvoiceNotFoundError('User not found')

  const data = invoice.invoiceData as InvoiceData
  const doc = new PDFDocument({ margin: 50 })


  const sellerName = data?.seller?.name || user.businessName || ''
  const sellerAbn = user.includeAbn ? user.abn || '' : ''
  const sellerEmail = user.includeEmail ? user.email || '' : ''
  const sellerPhone = user.includePhoneNumber ? user.phoneNumber || '' : ''
  const sellerAddress = user.includeAddress ? user.address || '' : ''

  const currency = data?.payableAmount?.currency || 'AUD'

  // Header
  doc.fontSize(20).text('Tax Invoice', { align: 'center' })
  doc.moveDown()

  // Seller / Buyer
  doc.fontSize(10)
  doc.text(`From: ${sellerName}`)
  if (sellerAbn) doc.text(`ABN: ${sellerAbn}`)
  if (sellerEmail) doc.text(`Email: ${sellerEmail}`)
  if (sellerPhone) doc.text(`Phone: ${sellerPhone}`)
  if (sellerAddress) doc.text(`Address: ${sellerAddress}`)

  doc.moveDown(0.5)
  doc.text(`To: ${data?.buyer?.name || ''}`)
  doc.moveDown()

  // Dates
  doc.text(`Issue Date: ${data?.issueDate || 'N/A'}`)
  doc.text(`Due Date: ${data?.dueDate || 'N/A'}`)
  doc.text(`Payment Terms: ${data?.paymentTerms || 'N/A'}`)
  if (data?.invoicePeriod?.startDate) {
    doc.text(`Period: ${data.invoicePeriod.startDate} - ${data.invoicePeriod.endDate}`)
  }

  if (data?.notes) {
    doc.text(`Notes: ${data.notes}`)
  }

  doc.moveDown()

  // Line items table
  const tableTop = doc.y
  const col = { item: 50, qty: 300, price: 380, total: 460 }

  doc.font('Helvetica-Bold')
  doc.text('Item', col.item, tableTop)
  doc.text('Qty', col.qty, tableTop)
  doc.text('Unit Price', col.price, tableTop)
  doc.text('Total', col.total, tableTop)
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke()

  doc.font('Helvetica')
  let y = tableTop + 25

  for (const item of data?.lineItems || []) {
    const lineTotal = item.quantity * item.unitPrice
    doc.text(item.itemName, col.item, y)
    doc.text(String(item.quantity), col.qty, y)
    doc.text(`${currency} ${item.unitPrice.toFixed(2)}`, col.price, y)
    doc.text(`${currency} ${lineTotal.toFixed(2)}`, col.total, y)
    y += 20
  }

  // Total
  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke()
  doc.font('Helvetica-Bold')
  const amount = data?.payableAmount?.amount?.toFixed(2) || '0.00'
  doc.text(`Total: ${currency} ${amount}`, col.price, y + 15)

  return doc
}