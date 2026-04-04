import { getInv } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const testInvoice = {
  _id: { toString: () => '123' },
  status: 'draft',
  invoiceData: { buyer: { name: 'test buyer' } },
  invoiceXMLString: '',
  isOverdue: false
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getInvoice', () => {
  test('successfully gets an invoice', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(testInvoice)
    const result = await getInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      invoiceId: '123',
      invoiceStatus: 'draft',
      invoiceData: expect.any(Object),
      invoiceXML: '', 
      isOverdue: expect.any(Boolean)
    })
  })

  test('INVOICE_NOT_FOUND, invoice does not exist', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(null)
    const result = await getInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(404)
    expect(result.body).toStrictEqual({ error: 'INVOICE_NOT_FOUND', message: expect.any(String) })
  })
})