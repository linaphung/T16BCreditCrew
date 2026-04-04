import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test mark invoice as paid', () => {
  let token: string
  let email: string
  const password = 'meowmeow123'
  const businessName = 'I Love Cats'
  const abn = '12345678901'
  let invoiceId: string;

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

    const res = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
      issueDate: '2026-03-15',
      invoicePeriod: {
          invoiceStartDate: '2026-03-01',
          invoiceEndDate: '2026-03-20',
      },
      dueDate: '2026-03-30',
      paymentTerms: 'Payment due within 30 days',
      buyer: 'ABC test',
      seller: 'test business',
      currency: 'AUD',
      orderLines: [
        {
          lineId: '1',
          itemName: 'brick',
          quantity: 100,
          unitPrice: 10,
        }
      ],
    }, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.status).toBe(200);
    invoiceId = res.data.result.invoiceId
  })

  afterEach( async () => {
    if (invoiceId) {
      await axios.delete(`${SERVER_URL}/v1/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    }
  })

  test('Marks finalised invoice as paid', async() => {
    await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })  
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/${invoiceId}/mark-as-paid`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )
    expect(res.status).toBe(200);
    expect(res.data.invoiceId).toBe(invoiceId)
  })


  test('Rejects request to mark draft invoice as paid', async() => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/${invoiceId}/mark-as-paid`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )
    expect(res.status).toBe(400);
    expect(res.data.message).toBe('Invoice is still draft state')
  })

  test('invalid or missing token', async () => {
    const invalid_token = ''
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/${invoiceId}/mark-as-paid`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${invalid_token}`
        },
        validateStatus: () => true
      }
    )
    expect(res.data).toEqual({
      error: 'INVALID_TOKEN',
      message: 'Token is invalid or empty'
    });
  })

  test('missing or invalid invoiceId', async () => {
    const invalid_invoiceId = 'invalidInvoiceId'
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/${invalid_invoiceId}/mark-as-paid`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )
    expect(res.data).toEqual({
      error: 'INVOICE_NOT_FOUND',
      message: 'Invoice does not exist'
    });
  })
})