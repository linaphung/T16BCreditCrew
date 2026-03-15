import axios from "axios"
import { GeneratedInvoice } from "../src/types.js";
// test for no token
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe("test getInvoice", () => {
  let token: string;
  let invoiceId: string;

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
      buyer: "buyer_test",
      seller: "seller_test",
      currency: "AUD",
      orderLines: [{lineId: "1", itemName: "item1", quantity: 100, unitPrice: 10}]
    }, {
      headers: {Authorization: `Bearer ${token}`}
    })
    invoiceId = invoice1.data.result.invoiceId;
  })

  test("tests updating fields in an invoice", async () => {
    const updatedFields = {
      buyer: {name: "updated_buyer"},
      seller: {name: "updated_seller"},
      paymentTerms: "Payment due within 15 days"
    }

    const res = await axios.put(`${SERVER_URL}/v1/invoices/${invoiceId}`, updatedFields, {
      headers: {Authorization: `Bearer ${token}`},
    })

    expect(res.status).toBe(200);
    const invoice = res.data as GeneratedInvoice;

    expect(invoice.invoiceId).toBe(invoiceId);
    expect(invoice.invoiceData.buyer.name).toBe("updated_buyer");
    expect(invoice.invoiceData.seller.name).toBe("updated_seller");
    expect(invoice.invoiceData.paymentTerms).toBe("Payment due within 15 days");
  })

  afterAll(async () => {
    const res = await axios.delete(`${SERVER_URL}/v1/invoices/${invoiceId}`, {
      headers: {Authorization: `Bearer ${token}`}
    })

    expect(res.status).toBe(200);
  })
})