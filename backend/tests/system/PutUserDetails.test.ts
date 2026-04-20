import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test update user details', () => {
  let token: string
  let email: string
  const password = 'meowmeow123'

  beforeEach(async () => {
    email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password
    })
    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, { email, password })
    token = loginRes.data.token
  })

  test('successfully updates email', async () => {
    const newEmail = `updated_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      email: newEmail
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates businessName', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      businessName: 'I Love Dogs'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates abn', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      abn: '10987654321'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates phoneNumber', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      phoneNumber: '0412345678'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates address', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      address: '123 George St, Sydney'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates includeAbn', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      includeAbn: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates includeEmail', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      includeEmail: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates includePhoneNumber', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      includePhoneNumber: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates includeAddress', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      includeAddress: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates password', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      password: 'newpassword123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('successfully updates all fields', async () => {
    const newEmail = `updated_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      email: newEmail,
      businessName: 'I Love Dogs',
      abn: '10987654321',
      phoneNumber: '0412345678',
      address: '123 George St, Sydney',
      includeAbn: false,
      includeEmail: false,
      includePhoneNumber: false,
      includeAddress: false,
      password: 'newpassword123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({})
  })

  test('INVALID_EMAIL, email format is invalid', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      email: 'notanemail'
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_EMAIL')
  })

  test('EMAIL_EXISTS, email is already in use', async () => {
    const otherEmail = `other_${Math.random().toString(36).substring(2, 10)}@gmail.com`
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email: otherEmail,
      businessName: 'Other Business',
      abn: '12345678901',
      password
    })

    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      email: otherEmail
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('EMAIL_EXISTS')
  })

  test('INVALID_BUSINESS_NAME, business name is empty', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      businessName: '   '
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_BUSINESS_NAME')
  })

  test('INVALID_PASSWORD, password is too short', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      password: 'cat1'
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD')
  })

  test('INVALID_PASSWORD, password has no number', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      password: 'meowmeowmeow'
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD')
  })

  test('INVALID_PASSWORD, password has no letter', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      password: '12345678'
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_PASSWORD')
  })

  test('INVALID_TOKEN, no token provided', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      businessName: 'I Love Dogs'
    }, {
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })

  test('INVALID_TOKEN, token is invalid', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/user/details`, {
      businessName: 'I Love Dogs'
    }, {
      headers: { Authorization: 'Bearer invalidtoken' },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })
})