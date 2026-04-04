import { checkOverdue } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const mockInvoice = (dueDate: string, isOverdue = false) => ({
  _id: { toString: () => '123' },
  status: 'sent',
  isOverdue,
  invoiceData: { dueDate },
  invoiceXMLString: '',
  save: jest.fn()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('checkForOverdue', () => {
  test('marks overdue invoices and returns updated count', async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([mockInvoice('2026-01-01')])
    ;(Invoice.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 })

    const result = await checkOverdue('user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ updated: 1 })
    expect(Invoice.updateMany).toHaveBeenCalled()
  })

  test('returns 0 when no invoices are overdue', async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([mockInvoice('2099-01-01')])
    const result = await checkOverdue('user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ updated: 0 })
    expect(Invoice.updateMany).not.toHaveBeenCalled()
  })

  test('returns 0 when user has no eligible invoices', async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([])

    const result = await checkOverdue('user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ updated: 0 })
    expect(Invoice.updateMany).not.toHaveBeenCalled()
  })

  test('skips invoices already marked as overdue', async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([mockInvoice('2026-01-01', true)])
    ;(Invoice.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 })

    const result = await checkOverdue('user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ updated: 0 })
  })
})