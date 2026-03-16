import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test invoice draft generation', () => {
  let token: string;
  let invoiceId: string;
  beforeEach(async () => {
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

  test('successfully finalise a valid invoice', async () => {
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res.status).toBe(200)
    expect(res.data.invoiceId).toBe(invoiceId)
  })

  test('error when trying to finalise a invoice that is already finalised', async () => {
    const res1 = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })  
    expect(res1.status).toBe(200)     
    expect(res1.data.invoiceId).toBe(invoiceId)
    
    const res2 = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res2.status).toBe(400)
    expect(res2.data).toEqual({
      error: 'INVOICE_BAD_REQUEST',
      message: 'Invoice is already finalised'
    });
  })

  test('error when trying to finalise a invoice that is already finalised after validation', async () => {
    const res = await axios.post(`${SERVER_URL}/v1/invoices/${invoiceId}/validate`, {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res.status).toBe(200);
    expect(res.data.valid).toBe(true);
    expect(res.data.errors.length).toBe(0);
    
    const res2 = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res2.status).toBe(400)
    expect(res2.data).toEqual({
      error: 'INVOICE_BAD_REQUEST',
      message: 'Invoice is already finalised'
    });
  })

  test ('invalid invoice - missing issue data and invoicePeriod', async () => {
    const invalidInvoiceRequest = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
      issueDate: '',
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
    expect(invalidInvoiceRequest.status).toBe(200);
    invoiceId = invalidInvoiceRequest.data.result.invoiceId
    
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`,
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res.status).toEqual(400)
    expect(res.data).toEqual({
      error: 'INVOICE_BAD_REQUEST',
      message: 'Invoice is not valid'
    });
  })

  test ('invalid or missing token', async () => {
    const invalid_token = ''
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invoiceId}`, 
    {}, 
    {
      headers: {
        Authorization: `Bearer ${invalid_token}`
      },
      validateStatus: () => true
    })       
    expect(res.data).toEqual({
      error: 'INVALID_TOKEN',
      message: 'Token is invalid or empty'
    });
  })

  test('missing or invalid invoiceId', async () => {
    const invalid_invoiceId = 'invalidInvoiceId'
    const res = await axios.put(`${SERVER_URL}/v1/admin/invoice/finalise/${invalid_invoiceId}`, {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res.status).toBe(404);
    expect(res.data).toEqual({
      error: 'INVOICE_NOT_FOUND',
      message: 'Invoice does not exist'
    });
  })
})