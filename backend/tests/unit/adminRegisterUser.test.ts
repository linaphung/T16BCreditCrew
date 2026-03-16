import { adminRegisterUser } from '../../src/auth.js'
import { validateEmail, validatePassword } from '../../src/helper.js'
import { MissingFieldError } from '../../src/errors.js'
import bcrypt from 'bcrypt'
import User from '../../models/User.js'

jest.mock('../../src/helper.js')
jest.mock('bcrypt')
jest.mock('../../models/User.js')

const mockUser = {
  _id: { toString: () => '123' },
  email: 'test@gmail.com',
  businessName: 'I Love Cats',
  abn: '12345678901',
  password: 'hashedPassword',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('adminRegisterUser', () => {
  test('successfully registers a user and returns userId', async () => {
    (validateEmail as jest.Mock).mockResolvedValue(undefined)
    ;(validatePassword as jest.Mock).mockReturnValue(undefined)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const result = await adminRegisterUser('test@gmail.com', 'I Love Cats', '12345678901', 'password1')
    expect(result).toStrictEqual({ code: 200, userId: '123' })
  })

  test('MISSING_FIELD, email is missing', async () => {
    await expect(adminRegisterUser('', 'I Love Cats', '12345678901', 'password1')).rejects.toThrow(MissingFieldError)
  })

  test('MISSING_FIELD, businessName is missing', async () => {
    await expect(adminRegisterUser('test@gmail.com', '', '12345678901', 'password1')).rejects.toThrow(MissingFieldError)
  })

  test('MISSING_FIELD, abn is missing', async () => {
    await expect(adminRegisterUser('test@gmail.com', 'I Love Cats', '', 'password1')).rejects.toThrow(MissingFieldError)
  })

  test('MISSING_FIELD, password is missing', async () => {
    await expect(adminRegisterUser('test@gmail.com', 'I Love Cats', '12345678901', '')).rejects.toThrow(MissingFieldError)
  })

  test('calls validateEmail with correct email', async () => {
    (validateEmail as jest.Mock).mockResolvedValue(undefined)
    ;(validatePassword as jest.Mock).mockReturnValue(undefined)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    await adminRegisterUser('test@gmail.com', 'I Love Cats', '12345678901', 'password1')
    expect(validateEmail as jest.Mock).toHaveBeenCalledWith('test@gmail.com')
  })

  test('calls validatePassword with correct password', async () => {
    (validateEmail as jest.Mock).mockResolvedValue(undefined)
    ;(validatePassword as jest.Mock).mockReturnValue(undefined)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    await adminRegisterUser('test@gmail.com', 'I Love Cats', '12345678901', 'password1')
    expect(validatePassword as jest.Mock).toHaveBeenCalledWith('password1')
  })
})