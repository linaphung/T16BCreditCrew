import axios from 'axios'
// test for no token
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test invoice draft generation', () => {
  let token: string;
  beforeEach(async () => {
    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
        email: 'leahe@gmail.com',
        password: 'leah1234'
    });
    expect(loginRes.status).toBe(200);
    token = loginRes.data.token
  })

  test('succesfully create draft invoice', async () => {
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
    expect(res.data.result.invoiceStatus).toBe('draft')
    expect(res.data.result.invoiceId).toStrictEqual(expect.any(String))
  })

  test('missing or invalid token prevent draft invoice generation', async () => {
    const invalid_token = ''
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
        Authorization: `Bearer ${invalid_token}`
      },
      validateStatus: () => true
    })       
    expect(res.status).toBe(400);
    expect(res.data).toEqual({
      error: 'INVALID_TOKEN',
      message: 'Token is invalid or empty'
    });


  })
})