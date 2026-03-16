import { exportInv } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

const testInvoice = {
  _id: { toString: () => '123' },
  status: 'finalised',
  invoiceData: { buyer: { name: 'test buyer' } },
  invoiceXMLString: '<xml/>'
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('exportInvoice', () => {
  test('successfully exports an invoice', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(testInvoice)
    const result = await exportInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual('<xml/>')
  })

  test('INVOICE_NOT_FOUND, invoice does not exist', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(null)
    const result = await exportInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(404)
    expect(result.body).toStrictEqual({ error: 'INVOICE_NOT_FOUND', message: expect.any(String) })
  })

  test('INVOICE_BAD_REQUEST, invoice has not been finalised', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue({ ...testInvoice, status: 'draft', invoiceXMLString: '' })
    const result = await exportInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVOICE_BAD_REQUEST', message: expect.any(String) })
  })
})