import { updateInv } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const testInvoice = {
  _id: { toString: () => '123' },
  status: 'draft',
  invoiceData: { buyer: { name: 'test buyer' }, seller: { name: 'test business' } },
  invoiceXMLString: '',
  save: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('updateInvoice', () => {
  test('successfully updates an invoice', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(testInvoice)
    const result = await updateInv('123', 'user123', { buyer: { name: 'updated buyer' } })
    expect(result.statusCode).toStrictEqual(200)
    expect(testInvoice.save).toHaveBeenCalled()
  })

  test('INVOICE_NOT_FOUND, invoice does not exist', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(null)
    const result = await updateInv('123', 'user123', { buyer: { name: 'updated buyer' } })
    expect(result.statusCode).toStrictEqual(404)
    expect(result.body).toStrictEqual({ error: 'INVOICE_NOT_FOUND', message: expect.any(String) })
  })
})