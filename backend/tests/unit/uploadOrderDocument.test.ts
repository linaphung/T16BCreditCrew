import { uploadOrder } from './wrappers.js'

describe('uploadOrderDocument', () => {
  test('successfully uploads a JSON file', () => {
    const fileBuffer = Buffer.from('{"buyer": "test buyer"}')
    const result = uploadOrder(fileBuffer, 'application/json')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ file: expect.any(String) })
  })

  test('successfully uploads an XML file', () => {
    const fileBuffer = Buffer.from('<Order><buyer>test buyer</buyer></Order>')
    const result = uploadOrder(fileBuffer, 'application/xml')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ file: expect.any(String) })
  })

  test('INVALID_FILE, unsupported file format', () => {
    const fileBuffer = Buffer.from('some content')
    const result = uploadOrder(fileBuffer, 'application/pdf')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_FILE', message: expect.any(String) })
  })
})