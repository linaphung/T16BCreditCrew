import { createInvoiceDraft } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const testInvoice = {
  _id: { toString: () => '123' },
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

const testInput = {
  issueDate: '2026-03-15',
  dueDate: '2026-03-30',
  paymentTerms: 'payment due within 5 days',
  buyer: 'test buyer',
  seller: 'test business',
  currency: 'AUD',
  orderLines: [{ lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }]
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(Invoice.create as jest.Mock).mockResolvedValue(testInvoice)
})

describe('generateInvoiceDraft', () => {
  test('successfully creates a draft invoice', async () => {
    const result = await createInvoiceDraft(testInput, 'user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      invoiceId: '123',
      invoiceStatus: 'draft',
      invoiceData: expect.any(Object),
      invoiceXML: '',
      isOverdue: expect.any(Boolean)
    })
  })
})