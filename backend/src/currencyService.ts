import { InvoiceNotFoundError, InvoiceBadRequest } from "./errors.js"
import { InvoiceData, OrderLine } from './types.js'
import Invoice from '../models/Invoice.js'
import {calculateLineExtension} from './helper.js'

const convertCurrency = async (lineItems: OrderLine[], from: string, to: string) => {
  if (from === to) {
    return lineItems.map(item => ({
      ...item
    }))
  }

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

  if (!invoice) {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  const invoiceData = invoice.invoiceData as InvoiceData

  const originalCurrency =
    invoiceData.originalCurrency ?? invoiceData.payableAmount.currency

  const originalLineItems =
    invoiceData.originalLineItems?.map(item => ({
      lineId: item.lineId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })) ??
    invoiceData.lineItems.map(item => ({
      lineId: item.lineId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))

  const convertedLineItems = await convertCurrency(originalLineItems, originalCurrency, to)

  invoice.set('invoiceData.originalCurrency', originalCurrency)
  invoice.set('invoiceData.originalLineItems', originalLineItems)
  invoice.set('invoiceData.lineItems', convertedLineItems)
  invoice.set('invoiceData.payableAmount', {
    currency: to,
    amount: calculateLineExtension(convertedLineItems)
  })
  invoice.markModified('invoiceData')

  await invoice.save()

  return {
    invoiceId: invoice._id.toString(),
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceStatus: invoice.status
  }
}

