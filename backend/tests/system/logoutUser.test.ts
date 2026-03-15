import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('POST /v1/admin/logout', () => {
  let token: string

  beforeEach(async () => {
    const email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    const password = 'meowmeow123'
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password
    })
    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, { email, password })
    token = loginRes.data.token
  })


  test('successfully logs out a user', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })


  test('INVALID_TOKEN, no token provided', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/logout`, {}, {
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })

  
  test('INVALID_TOKEN, token is invalid', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/logout`, {}, {
      headers: { Authorization: 'Bearer invalidtoken' },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })
})