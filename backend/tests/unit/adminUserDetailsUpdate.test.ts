import { userDetailsUpdate } from './wrappers.js'
import { validateEmail, validatePassword, getUserFromToken } from '../../src/helper.js'
import bcrypt from 'bcrypt'

jest.mock('../../src/helper.js')
jest.mock('bcrypt')

const testUser = {
  email: 'test@gmail.com',
  businessName: 'I Love Cats',
  abn: '12345678901',
  password: 'hashedPassword',
  save: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
  testUser.email = 'test@gmail.com'
  testUser.businessName = 'I Love Cats'
})

describe('adminUserDetailsUpdate', () => {
  test('adminUserDetailsUpdate, successfully updates email', async () => {
    (getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    ;(validateEmail as jest.Mock).mockResolvedValue(undefined)

    const result = await userDetailsUpdate('mock-token', { email: 'new@gmail.com' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.email).toBe('new@gmail.com')
  })

  test('adminUserDetailsUpdate, successfully updates businessName', async () => {
    (getUserFromToken as jest.Mock).mockResolvedValue(testUser)

    const result = await userDetailsUpdate('mock-token', { businessName: 'I Love Dogs' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.businessName).toBe('I Love Dogs')
  })

  test('adminUserDetailsUpdate, successfully updates password', async () => {
    (getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    ;(validatePassword as jest.Mock).mockReturnValue(undefined)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword')

    const result = await userDetailsUpdate('mock-token', { password: 'newpassword1' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
  })

  test('adminUserDetailsUpdate, USER_NOT_FOUND user does not exist', async () => {
    (getUserFromToken as jest.Mock).mockResolvedValue(null)
    const result = await userDetailsUpdate('mock-token', { businessName: 'I Love Dogs' })
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'USER_NOT_FOUND', message: expect.any(String) })
  })

  test('adminUserDetailsUpdate, INVALID_BUSINESS_NAME business name is empty', async () => {
    (getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { businessName: '   ' })
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({ error: 'INVALID_BUSINESS_NAME', message: expect.any(String) })
  })

  test('adminUserDetailsUpdate, does not update email if same as current', async () => {
    (getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { email: 'test@gmail.com' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(validateEmail as jest.Mock).not.toHaveBeenCalled()
  })
})