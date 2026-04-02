import axios from "axios"
import { GeneratedInvoice } from "../../src/types.js";
// test for no token
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe("test get all invoices + filtering", () => {
  let token: string;
  let invoice1Id: string;
  let invoice2Id: string;

  beforeAll(async () => {
    const randomString = Math.random().toString(36).substring(2,10)
    const email = `test_${randomString}@gmail.com`
    const password = "password1"
    const registerRes = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password
    })
    expect(registerRes.status).toBe(200)

    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
      email,
      password
    })
    expect(loginRes.status).toBe(200);
    token = loginRes.data.token

    const invoice1 = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
      issueDate: "2026-03-15",
      invoicePeriod: {invoiceStartDate: "2026-03-01", invoiceEndDate: "2026-03-20"},
      dueDate: "2026-03-30",
      paymentTerms: "Payment due within 30 days",
      buyer: "buyer_test1",
      seller: "seller_test1",
      currency: "AUD",
      orderLines: [{lineId: "1", itemName: "item1", quantity: 100, unitPrice: 10}]
    }, {
      headers: {Authorization: `Bearer ${token}`}
    })
    invoice1Id = invoice1.data.result.invoiceId;

    const invoice2 = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
      issueDate: "2026-03-15",
      invoicePeriod: {invoiceStartDate: "2026-03-01", invoiceEndDate: "2026-03-20"},
      dueDate: "2026-03-30",
      paymentTerms: "Payment due within 30 days",
      buyer: "buyer_test2",
      seller: "seller_test2",
      currency: "AUD",
      orderLines: [{lineId: "1", itemName: "item1", quantity: 100, unitPrice: 10}]
    }, {
      headers: {Authorization: `Bearer ${token}`}
    })
    invoice2Id = invoice2.data.result.invoiceId;
  })

  test("no filters returns all invoices", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice1Id)
    expect(ids).toContain(invoice2Id)
  })

  test("filter by buyer name", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { buyerName: "buyer_test1" }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice1Id)
    expect(ids).not.toContain(invoice2Id)
  })

  test("filter by seller name", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { sellerName: "seller_test2" }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice2Id)
    expect(ids).not.toContain(invoice1Id)
  })

  test("filter by status", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { status: "draft" }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice1Id)
    expect(ids).toContain(invoice2Id)
  })

  test("filter by issue date range", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { issueDateFrom: "2026-03-01", issueDateTo: "2026-03-31" }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice1Id)
    expect(ids).toContain(invoice2Id)
  })

  test("filter by due date range", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { dueDateFrom: "2026-03-01", dueDateTo: "2026-03-31" }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice1Id)
    expect(ids).toContain(invoice2Id)
  })

  test("filter by both buyer and status", async () => {
    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { buyerName: "buyer_test1", status: "draft" }
    })
    expect(res.status).toBe(200)
    const ids = (res.data.invoices as GeneratedInvoice[]).map(i => i.invoiceId)
    expect(ids).toContain(invoice1Id)
    expect(ids).not.toContain(invoice2Id)
  })

  afterAll(async () => {
    const res1 = await axios.delete(`${SERVER_URL}/v1/invoices/${invoice1Id}`, {
      headers: {Authorization: `Bearer ${token}`}
    })
    expect(res1.status).toBe(200);

    const res2 = await axios.delete(`${SERVER_URL}/v1/invoices/${invoice2Id}`, {
      headers: {Authorization: `Bearer ${token}`}
    })
    expect(res2.status).toBe(200);
  })

  test("tests for empty array if no invoices", async () => {
    await axios.post(`${SERVER_URL}/v1/admin/logout`, {}, {
      headers: {Authorization: `Bearer ${token}`}
    })

    const randomString = Math.random().toString(36).substring(2,10)
    const emptyEmail = `test_${randomString}@gmail.com`
    const emptyPassword = "password1"
    const registerRes = await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
      email: emptyEmail,
      businessName: 'I Love Cats',
      abn: '12345678901',
      password: emptyPassword
    })
    expect(registerRes.status).toBe(200)

    const emptyLogin = await axios.post(`${SERVER_URL}/v1/admin/login`, {
      email: emptyEmail,
      password: emptyPassword
    })
    expect(emptyLogin.status).toBe(200);
    const emptyToken = emptyLogin.data.token

    const res = await axios.get(`${SERVER_URL}/v2/admin/invoices`, {
      headers: {
        Authorization: `Bearer ${emptyToken}`
      },
    })

    expect(res.status).toBe(200);
    expect(res.data.invoices).toEqual([]);
  })
})
