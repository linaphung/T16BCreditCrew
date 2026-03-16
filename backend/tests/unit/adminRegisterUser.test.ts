import { register } from './wrappers.js'
import { validateEmail, validatePassword } from '../../src/helper.js'
import bcrypt from 'bcrypt'
import User from '../../models/User.js'

jest.mock('../../src/helper.js')
jest.mock('bcrypt')
jest.mock('../../models/User.js')

const testUser = {
  _id: { toString: () => '123' },
  email: 'test@gmail.com',
  businessName: 'I Love Cats',
  abn: '12345678901',
  password: 'hashedPassword',
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(validateEmail as jest.Mock).mockResolvedValue(undefined)
  ;(validatePassword as jest.Mock).mockReturnValue(undefined)
  ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
  ;(User.create as jest.Mock).mockResolvedValue(testUser)
})

describe('adminRegisterUser', () => {
  test('valid register', async () => {
    const result = await register('test@gmail.com', 'I Love Cats', '12345678901', 'password1')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ code: 200, userId: expect.any(String) })
  })

  test('MISSING_FIELD, email is missing', async () => {
    const result = await register('', 'I Love Cats', '12345678901', 'password1')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'MISSING_FIELD', message: expect.any(String) })
  })

  test('MISSING_FIELD, businessName is missing', async () => {
    const result = await register('test@gmail.com', '', '12345678901', 'password1')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'MISSING_FIELD', message: expect.any(String) })
  })

  test('MISSING_FIELD, abn is missing', async () => {
    const result = await register('test@gmail.com', 'I Love Cats', '', 'password1')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'MISSING_FIELD', message: expect.any(String) })
  })

  test('MISSING_FIELD, password is missing', async () => {
    const result = await register('test@gmail.com', 'I Love Cats', '12345678901', '')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'MISSING_FIELD', message: expect.any(String) })
  })
})