import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 3000
const SERVER_URL = `http://localhost:${PORT}`

const registerAndLogin = async () => {
  const email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
  const password = 'password1'
  await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
    email,
    businessName: 'I Love Cats',
    abn: '12345678901',
    password
  })

  const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
    email,
    password
  })

  return loginRes.data.token
}

const createForm = (filename: string) => {
  const form = new FormData()
  form.append('file', fs.createReadStream(path.join('tests/fixtures', filename)))
  return form
}

describe('test parse order document', () => {
  let token: string

  beforeEach(async () => {
    token = await registerAndLogin()
  })

  test('INVALID_TOKEN, no token provided', async () => {
    const form = createForm('order.json')

    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders() },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })

  test('MISSING_FILE, no file uploaded', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('MISSING_FILE')
  })

  test('INVALID_FILE, missing required fields in order document', async () => {
    const form = createForm('invalid_order.json')

    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_FILE')
  })

  test('successfully parses a JSON order document', async () => {
    const form = createForm('order.json')

    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data.buyerName).toBe('test buyer')
    expect(res.data.sellerName).toBe('test business')
    expect(res.data.paymentTerms).toBe('payment due within 5 days')
    expect(res.data.issueDate).toBe('')
    expect(res.data.dueDate).toBe('')
    expect(res.data.currency).toBe('AUD')
    expect(res.data.invoicePeriod).toStrictEqual({
      startDate: '',
      endDate: ''
    })
    expect(res.data.orderLines).toStrictEqual([
      { lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }
    ])
  })

  test('successfully parses an XML order document', async () => {
    const form = createForm('order.xml')
    
    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data.buyerName).toBe('test buyer')
    expect(res.data.sellerName).toBe('test business')
    expect(res.data.paymentTerms).toBe('payment due within 5 days')
    expect(res.data.issueDate).toBe('')
    expect(res.data.dueDate).toBe('')
    expect(res.data.currency).toBe('AUD')
    expect(res.data.invoicePeriod).toStrictEqual({
      startDate: '',
      endDate: ''
    })
    expect(res.data.orderLines).toStrictEqual([
      { lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }
    ])
  })
})