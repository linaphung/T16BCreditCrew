import { finalise } from './wrappers.js'
import Invoice from '../../models/Invoice.js'
import { generateXMLString } from '../../src/helper.js'
import { validateInvoiceHelper } from '../../src/invoiceValidation.js'

jest.mock('../../models/Invoice')
jest.mock('../../src/helper')
jest.mock('../../src/invoiceValidation')

const testInvoice = {
  _id: { toString: () => '123' },
  status: 'draft',
  invoiceData: { buyer: { name: 'test buyer' } },
  invoiceXMLString: '',
  save: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(generateXMLString as jest.Mock).mockReturnValue('<xml/>')
  ;(validateInvoiceHelper as jest.Mock).mockReturnValue({ valid: true })
})

describe('finaliseInvoice', () => {
  test('successfully finalises an invoice', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(testInvoice)
    const result = await finalise('123', 'user123')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ invoiceId: '123' })
    expect(testInvoice.save).toHaveBeenCalled()
  })

  test('INVOICE_NOT_FOUND, invoice does not exist', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(null)
    const result = await finalise('123', 'user123')
    expect(result.statusCode).toStrictEqual(404)
    expect(result.body).toStrictEqual({ error: 'INVOICE_NOT_FOUND', message: expect.any(String) })
  })

  test('INVOICE_BAD_REQUEST, invoice is already finalised', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue({ ...testInvoice, status: 'finalised' })
    const result = await finalise('123', 'user123')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVOICE_BAD_REQUEST', message: expect.any(String) })
  })

  test('INVOICE_BAD_REQUEST, invoice is not valid', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(testInvoice)
    ;(validateInvoiceHelper as jest.Mock).mockReturnValue({ valid: false })
    const result = await finalise('123', 'user123')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVOICE_BAD_REQUEST', message: expect.any(String) })
  })
})