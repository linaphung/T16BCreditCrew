import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test mark invoice as overdue', () => {
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
  test('Invalid or missing token', async() => {
    const invalid_token = ''
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/mark-overdue`, 
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
  test('0 overdue finalisedinvoice', async() => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/mark-overdue`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )
    expect(res.status).toBe(200)
    expect(res.data.updated).toBe(0)
  })

  test('1 overdue finalisedinvoice', async() => {
    await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })  
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/mark-overdue`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )
    expect(res.status).toBe(200)
    expect(res.data.updated).toBe(1)
  })

})