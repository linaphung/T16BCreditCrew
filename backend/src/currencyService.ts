import { InvoiceNotFoundError, InvoiceBadRequest } from "./errors.js"
import { InvoiceData, OrderLine } from './types.js'
import Invoice from '../models/Invoice.js'
import {calculateLineExtension} from './helper.js'

const convertCurrency = async (lineItems: OrderLine[], from: string, to: string) => {
  const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${from}&quotes=${to}`)
  if (!res.ok) {
    throw new InvoiceBadRequest('Invalid Currency')
  }
  const data = await res.json() 
  if (data.length === 0) {
    throw new InvoiceBadRequest('Invalid Currency')
  }
  const rate = data[0].rate as number
  return lineItems.map(i => ({
    ...i,
    unitPrice: Math.round(i.unitPrice * rate * 100) / 100
  }))
}

export const changeInvoiceCurrency = async (invoiceId: string, userId: string, to: string) => {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }
  if (!invoice)
    throw new InvoiceNotFoundError('Invoice does not exist')

  const invoiceData = invoice.invoiceData as InvoiceData

  const from = invoiceData.payableAmount.currency
  const rawLineItems = invoiceData.lineItems.map(i => ({
    lineId: i.lineId,
    itemName: i.itemName,
    quantity: i.quantity,
    unitPrice: i.unitPrice
  }))
  const lineItems = (await convertCurrency(rawLineItems, from, to))
  invoice.set('invoiceData.lineItems', lineItems)
  invoice.set('invoiceData.payableAmount',{currency: to, amount: calculateLineExtension(lineItems)})
  invoice.markModified('invoiceData')

  await invoice.save()

  return {
    invoiceId: invoice._id.toString(),
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceStatus: invoice.status
  }
}

