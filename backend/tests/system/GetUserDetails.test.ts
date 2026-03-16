import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test get user details', () => {
  let token: string
  let email: string
  const password = 'meowmeow123'
  const businessName = 'I Love Cats'
  const abn = '12345678901'

  beforeEach(async () => {
    email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName,
      abn,
      password
    })
    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, { email, password })
    token = loginRes.data.token
  })


  test('successfully gets user details', async () => {
    const res = await axios.get(`${SERVER_URL}/v1/admin/user/details`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data.email).toBe(email)
    expect(res.data.businessName).toBe(businessName)
    expect(res.data.abn).toBe(abn)
  })


  test('INVALID_TOKEN, no token provided', async () => {
    const res = await axios.get(`${SERVER_URL}/v1/admin/user/details`, {
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })


  test('INVALID_TOKEN, token is invalid', async () => {
    const res = await axios.get(`${SERVER_URL}/v1/admin/user/details`, {
      headers: { Authorization: 'Bearer invalidtoken' },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })
})