import { exportInvoicePDF } from '../../src/pdfExport.js'
import Invoice from '../../models/Invoice.js'
import User from '../../models/User.js'

jest.mock('../../models/Invoice.js')
jest.mock('../../models/User.js')

const mockInvoiceData = {
  issueDate: '2026-04-03',
  dueDate: '2026-05-03',
  paymentTerms: 'Net 30',
  invoicePeriod: {
    startDate: '2026-03-01',
    endDate: '2026-03-31'
  },
  buyer: { name: 'Acme Corp' },
  seller: { name: 'Credit Crew' },
  lineItems: [
    { lineId: '1', itemName: 'Web Development', quantity: 10, unitPrice: 150 },
    { lineId: '2', itemName: 'Hosting', quantity: 1, unitPrice: 50 }
  ],
  payableAmount: { currency: 'AUD', amount: 1550 }
}

const mockUser = {
  businessName: 'Credit Crew',
  abn: '12345678901',
  email: 'test@example.com',
  phoneNumber: '0412345678',
  address: 'Sydney',
  includeAbn: true,
  includeEmail: true,
  includePhoneNumber: true,
  includeAddress: true
}

const finalisedInvoice = {
  _id: { toString: () => '123' },
  userId: 'user1',
  status: 'finalised',
  invoiceData: mockInvoiceData
}

const draftInvoice = {
  _id: { toString: () => '456' },
  userId: 'user1',
  status: 'draft',
  invoiceData: mockInvoiceData
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('exportInvoicePDF', () => {
  test('returns a PDF document for a finalised invoice', async () => {
    ;(Invoice.findOne as jest.Mock).mockResolvedValue(finalisedInvoice)
    ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

    const doc = await exportInvoicePDF('123', 'user1')
    expect(doc).toBeDefined()
    expect(typeof doc.pipe).toBe('function')
    expect(typeof doc.end).toBe('function')
    doc.end()
  })

  test('throws error for a draft invoice', async () => {
    ;(Invoice.findOne as jest.Mock).mockResolvedValue(draftInvoice)

    await expect(exportInvoicePDF('456', 'user1'))
      .rejects.toThrow('Only finalised invoices can be exported as PDF')
  })

  test('throws InvoiceNotFoundError when invoice does not exist', async () => {
    ;(Invoice.findOne as jest.Mock).mockResolvedValue(null)

    await expect(exportInvoicePDF('999', 'user1'))
      .rejects.toThrow('Invoice not found')
  })

  test('throws InvoiceNotFoundError for another users invoice', async () => {
    ;(Invoice.findOne as jest.Mock).mockResolvedValue(null)

    await expect(exportInvoicePDF('123', 'differentUser'))
      .rejects.toThrow('Invoice not found')
  })

  test('queries with both invoiceId and userId', async () => {
    ;(Invoice.findOne as jest.Mock).mockResolvedValue(finalisedInvoice)
    ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

    await exportInvoicePDF('123', 'user1')
    expect(Invoice.findOne).toHaveBeenCalledWith({ _id: '123', userId: 'user1' })
  })
})