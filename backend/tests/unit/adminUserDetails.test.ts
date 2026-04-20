import { userDetails } from './wrappers.js'
import { validateToken, getUserFromToken } from '../../src/helper.js'

jest.mock('../../src/helper.js')

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
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('adminUserDetails', () => {
  test('valid get user details', async () => {
    ;(validateToken as jest.Mock).mockReturnValue(true)
    ;(getUserFromToken as jest.Mock).mockResolvedValue(testUser)
    const result = await userDetails('mock-token')
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      email: 'test@gmail.com',
      businessName: 'I Love Cats',
      abn: '12345678901',
      phoneNumber: '',
      address: '',
      includeAbn: true,
      includeEmail: true,
      includePhoneNumber: true,
      includeAddress: true
    })
  })

  test('INVALID_TOKEN, token is missing', async () => {
    const result = await userDetails('')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({
      error: 'INVALID_TOKEN',
      message: expect.any(String)
    })
  })

  test('INVALID_TOKEN, token is invalid', async () => {
    ;(validateToken as jest.Mock).mockReturnValue(false)
    const result = await userDetails('invalid-token')
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({
      error: 'INVALID_TOKEN',
      message: expect.any(String)
    })
  })
})