import { parseOrder } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const testInvoice = {
  _id: { toString: () => '123' },
  status: 'draft',
  invoiceData: {
    buyer: { name: 'test buyer' },
    seller: { name: 'test business' },
    paymentTerms: 'payment due within 5 days',
    issueDate: '2026-03-15',
    dueDate: '2026-03-30',
    lineItems: [{ lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }],
    payableAmount: { currency: 'AUD', amount: 1000 }
  },
  invoiceXMLString: '',
  isOverdue: false
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(Invoice.create as jest.Mock).mockResolvedValue(testInvoice)
})

describe('parseOrderDocument', () => {
  test('successfully parses a JSON order document', async () => {
    const fileBuffer = Buffer.from(JSON.stringify({
      buyer: 'test buyer',
      seller: 'test business',
      paymentTerms: 'payment due within 5 days',
      orderLines: [{ lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }]
    }))

    const result = await parseOrder(fileBuffer, 'application/json', 'user123', '2026-03-15', '2026-03-30', 'AUD')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      invoiceId: '123',
      invoiceStatus: 'draft',
      invoiceData: expect.any(Object),
      invoiceXML: '',
      isOverdue: expect.any(Boolean)
    })
  })

  test('successfully parses an XML order document', async () => {
    const fileBuffer = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
      <Order>
        <buyer>test buyer</buyer>
        <seller>test business</seller>
        <paymentTerms>payment due within 5 days</paymentTerms>
        <orderLines>
          <lineId>1</lineId>
          <itemName>cat</itemName>
          <quantity>100</quantity>
          <unitPrice>10</unitPrice>
        </orderLines>
      </Order>`)

    const result = await parseOrder(fileBuffer, 'application/xml', 'user123', '2026-03-15', '2026-03-30', 'AUD')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      invoiceId: '123',
      invoiceStatus: 'draft',
      invoiceData: expect.any(Object),
      invoiceXML: '',
      isOverdue: expect.any(Boolean)
    })
  })

  test('INVALID_FILE, unsupported file format', async () => {
    const fileBuffer = Buffer.from('some content')
    const result = await parseOrder(fileBuffer, 'application/pdf', 'user123', '2026-03-15', '2026-03-30', 'AUD')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_FILE', message: expect.any(String) })
  })

  test('INVALID_FILE, invalid JSON file', async () => {
    const fileBuffer = Buffer.from('not valid json')
    const result = await parseOrder(fileBuffer, 'application/json', 'user123', '2026-03-15', '2026-03-30', 'AUD')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_FILE', message: expect.any(String) })
  })

  test('INVALID_FILE, missing required fields in order document', async () => {
    const fileBuffer = Buffer.from(JSON.stringify({ buyer: 'test buyer' }))
    const result = await parseOrder(fileBuffer, 'application/json', 'user123', '2026-03-15', '2026-03-30', 'AUD')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_FILE', message: expect.any(String) })
  })

  test('INVALID_FILE, missing issueDate, dueDate or currency', async () => {
    const fileBuffer = Buffer.from(JSON.stringify({
      buyer: 'test buyer',
      seller: 'test business',
      paymentTerms: 'payment due within 5 days',
      orderLines: [{ lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }]
    }))
    const result = await parseOrder(fileBuffer, 'application/json', 'user123', '', '', '')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_FILE', message: expect.any(String) })
  })
})