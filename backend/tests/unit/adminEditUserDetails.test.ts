import { userDetailsUpdate } from './wrappers.js'
import { validateEmail, validatePassword, getUserFromToken } from '../../src/helper.js'
import bcrypt from 'bcrypt'

jest.mock('../../src/helper.js')
jest.mock('bcrypt')

const testUser = {
  email: 'test@gmail.com',
  businessName: 'I Love Cats',
  abn: '12345678901',
  phoneNumber: '',
  address: '',
  includeAbn: true,
  includeEmail: true,
  includePhoneNumber: true,
  includeAddress: true,
  password: 'hashedPassword',
  save: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
  testUser.email = 'test@gmail.com'
  testUser.businessName = 'I Love Cats'
  testUser.abn = '12345678901'
  testUser.phoneNumber = ''
  testUser.address = ''
  testUser.includeAbn = true
  testUser.includeEmail = true
  testUser.includePhoneNumber = true
  testUser.includeAddress = true
  testUser.password = 'hashedPassword'
})

describe('adminEditUserDetails', () => {
  test('successfully updates email', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    ;(validateEmail as jest.Mock).mockResolvedValue(undefined)
    const result = await userDetailsUpdate('mock-token', { email: 'new@gmail.com' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.email).toBe('new@gmail.com')
  })

  test('successfully updates businessName', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { businessName: 'I Love Dogs' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.businessName).toBe('I Love Dogs')
  })

  test('successfully updates abn', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { abn: '10987654321' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.abn).toBe('10987654321')
  })

  test('successfully updates phoneNumber', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { phoneNumber: '0412345678' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.phoneNumber).toBe('0412345678')
  })

  test('successfully updates address', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { address: '123 George St, Sydney' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.address).toBe('123 George St, Sydney')
  })

  test('successfully updates includeAbn', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { includeAbn: false })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.includeAbn).toBe(false)
  })

  test('successfully updates includeEmail', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { includeEmail: false })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.includeEmail).toBe(false)
  })

  test('successfully updates includePhoneNumber', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { includePhoneNumber: false })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.includePhoneNumber).toBe(false)
  })

  test('successfully updates includeAddress', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { includeAddress: false })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.includeAddress).toBe(false)
  })

  test('successfully updates password', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    ;(validatePassword as jest.Mock).mockReturnValue(undefined)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword')
    const result = await userDetailsUpdate('mock-token', { password: 'newpassword1' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(testUser.password).toBe('newHashedPassword')
  })

  test('USER_DOES_NOT_EXIST, user does not exist', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(null)
    const result = await userDetailsUpdate('mock-token', { businessName: 'I Love Dogs' })
    expect(result.statusCode).toStrictEqual(404)
    expect(result.body).toStrictEqual({
      error: 'USER_DOES_NOT_EXIST',
      message: expect.any(String)
    })
  })

  test('INVALID_BUSINESS_NAME, business name is empty', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { businessName: '   ' })
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({
      error: 'INVALID_BUSINESS_NAME',
      message: expect.any(String)
    })
  })

  test('does not update email if same as current', async () => {
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetailsUpdate('mock-token', { email: 'test@gmail.com' })
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({})
    expect(validateEmail as jest.Mock).not.toHaveBeenCalled()
  })
})