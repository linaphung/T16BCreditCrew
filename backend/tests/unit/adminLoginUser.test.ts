import { login } from './wrappers.js'
import { getUser } from '../../src/helper.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

jest.mock('../../src/helper.js')
jest.mock('bcrypt')
jest.mock('jsonwebtoken')

const mockUser = {
  _id: { toString: () => '123' },
  email: 'test@gmail.com',
  password: 'hashedPassword',
  tokens: [] as string[],
  save: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

describe('adminAuthLogin', () => {
  test('valid login', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('mock-token')

    const result = await login('test@gmail.com', 'password1')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({ code: 200, adminId: expect.any(String), token: expect.any(String) })
  })

  test('MISSING_FIELD, email is missing', async () => {
    const result = await login('', 'password1')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'MISSING_FIELD', message: expect.any(String) })
  })

  test('MISSING_FIELD, password is missing', async () => {
    const result = await login('test@gmail.com', '')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'MISSING_FIELD', message: expect.any(String) })
  })

  test('INVALID_PASSWORD_OR_EMAIL, user not found', async () => {
    (getUser as jest.Mock).mockResolvedValue(null)
    const result = await login('test@gmail.com', 'password1')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_PASSWORD_OR_EMAIL', message: expect.any(String) })
  })

  test('INVALID_PASSWORD_OR_EMAIL, password is wrong', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
    const result = await login('test@gmail.com', 'wrongpassword')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_PASSWORD_OR_EMAIL', message: expect.any(String) })
  })
})