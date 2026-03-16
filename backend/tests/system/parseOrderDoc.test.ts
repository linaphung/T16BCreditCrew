 import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

const registerAndLogin = async () => {
  const email = `test_${Math.random().toString(36).substring(2, 10)}@gmail.com`
  const password = 'password1'
  await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
    email,
    businessName: 'I Love Cats',
    abn: '12345678901',
    password
  })
  const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, { email, password })
  return loginRes.data.token
}

const createForm = (filename: string, extraFields?: Record<string, string>) => {
  const form = new FormData()
  form.append('file', fs.createReadStream(path.join('tests/fixtures', filename)))
  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => form.append(key, value))
  }
  return form
}

const parseFields = {
  issueDate: '2026-03-15',
  dueDate: '2026-03-30',
  currency: 'AUD'
}

describe('test parse order document', () => {
  let token: string

  beforeEach(async () => {
    token = await registerAndLogin()
  })

  test('INVALID_TOKEN, no token provided', async () => {
    const form = createForm('order.json', parseFields)
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
    const form = createForm('invalid_order.json', parseFields)
    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_FILE')
  })

  test('INVALID_FILE, missing issueDate, dueDate or currency', async () => {
    const form = createForm('order.json')
    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      validateStatus: () => true
    })
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_FILE')
  })

  test('successfully parses a JSON order and creates a draft invoice', async () => {
    const form = createForm('order.json', parseFields)
    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data.invoiceId).toBeDefined()
    expect(res.data.invoiceStatus).toBe('draft')
    expect(res.data.invoiceData.buyer.name).toBe('test buyer')
    expect(res.data.invoiceData.seller.name).toBe('test business')
    expect(res.data.invoiceData.paymentTerms).toBe('payment due within 5 days')
  })

  test('successfully parses an XML order and creates a draft invoice', async () => {
    const form = createForm('order.xml', parseFields)
    const res = await axios.post(`${SERVER_URL}/v1/admin/order/parse`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    expect(res.data.invoiceId).toBeDefined()
    expect(res.data.invoiceStatus).toBe('draft')
    expect(res.data.invoiceData.buyer.name).toBe('test buyer')
    expect(res.data.invoiceData.seller.name).toBe('test business')
    expect(res.data.invoiceData.paymentTerms).toBe('payment due within 5 days')
  })
})