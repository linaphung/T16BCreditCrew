import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test user login', () => {
  let email: string
  const password = 'password1234'

  beforeEach(async () => {
    email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password
    }, { validateStatus: () => true })
  })


  test('successfully logs in a registered user', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/login`, { email, password })
    expect(res.status).toBe(200)
    expect(res.data.token).toBeDefined()
    expect(res.data.adminId).toBeDefined()
  })


  test('INVALID_PASSWORD_OR_EMAIL, password is incorrect', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/login`, {
      email,
      password: 'wrongpassword1'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD_OR_EMAIL')
  })


  test('INVALID_PASSWORD_OR_EMAIL, email is not registered', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/login`, {
      email: 'notregistered@gmail.com',
      password
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD_OR_EMAIL')
  })


  test('MISSING_FIELD, email is missing', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/login`, {
      password
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FIELD')
  })


  test('MISSING_FIELD, password is missing', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/login`, {
      email
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FIELD')
  })
})