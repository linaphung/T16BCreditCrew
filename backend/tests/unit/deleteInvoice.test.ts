import { deleteInv } from './wrappers.js'
import Invoice from '../../models/Invoice.js'

jest.mock('../../models/Invoice')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('deleteInvoice', () => {
  test('successfully deletes an invoice', async () => {
    (Invoice.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 })
    const result = await deleteInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
  })

  test('INVOICE_NOT_FOUND, invoice does not exist', async () => {
    (Invoice.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 })
    const result = await deleteInv('123', 'user123')
    expect(result.statusCode).toStrictEqual(404)
    expect(result.body).toStrictEqual({ error: 'INVOICE_NOT_FOUND', message: expect.any(String) })
  })
})