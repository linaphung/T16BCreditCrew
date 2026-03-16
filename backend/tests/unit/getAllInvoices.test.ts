import { getAllInv } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const testInvoices = [
  {
    _id: { toString: () => '123' },
    status: 'draft',
    invoiceData: { buyer: { name: 'test buyer' } },
    invoiceXMLString: ''
  },
  {
    _id: { toString: () => '456' },
    status: 'finalised',
    invoiceData: { buyer: { name: 'test buyer 2' } },
    invoiceXMLString: '<xml/>'
  }
]

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllInvoices', () => {
  test('successfully gets all invoices', async () => {
    (Invoice.find as jest.Mock).mockResolvedValue(testInvoices)
    const result = await getAllInv('user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toHaveLength(2)
  })

  test('returns empty array when no invoices exist', async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([])
    const result = await getAllInv('user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual([])
  })
})