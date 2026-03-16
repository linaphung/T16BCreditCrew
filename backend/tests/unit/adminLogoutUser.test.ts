import { logout } from './wrappers.js'
import { validateToken } from '../../src/helper.js'

jest.mock('../../src/helper.js')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('adminAuthLogout', () => {
  test('valid logout', async () => {
    (validateToken as jest.Mock).mockReturnValue(true)
    const result = await logout('mock-token')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ code: 200 })
  })

  test('INVALID_TOKEN, token is missing', async () => {
    const result = await logout('')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_TOKEN', message: expect.any(String) })
  })

  test('INVALID_TOKEN, token is invalid', async () => {
    (validateToken as jest.Mock).mockReturnValue(false)
    const result = await logout('invalid-token')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_TOKEN', message: expect.any(String) })
  })
})