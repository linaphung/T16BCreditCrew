import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test user register', () => {
  let email: string

  beforeEach(() => {
    email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
  })

  test('successfully registers a new user', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'meowmeow123'
    })
    expect(res.status).toBe(200)
    expect(res.data.userId).toBeDefined()
  })


  test('MISSING_FIELD, email is missing', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'meowmeow123'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FIELD')
  })


  test('MISSING_FIELD, businessName is missing', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      abn: '12345678901',
      password: 'meowmeow123'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FIELD')
  })


  test('MISSING_FIELD, abn is missing', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      password: 'meowmeow123'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FIELD')
  })


  test('MISSING_FIELD, password is missing', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FIELD')
  })


  test('INVALID_EMAIL, email format is invalid', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email: 'notanemail',
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'meowmeow123'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_EMAIL')
  })


  test('EMAIL_EXISTS, email is already in use', async () => {
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'meowmeow123'
    })

    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'meowmeow123'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('EMAIL_EXISTS')
  })


  test('INVALID_PASSWORD, password is less than 8 characters', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'cat1'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD')
  })


  test('INVALID_PASSWORD, password has no number', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: 'meowmeowmeow'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD')
  })

  
  test('INVALID_PASSWORD, password has no letter', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: '12345678'
    }, { validateStatus: () => true })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD')
  })
})