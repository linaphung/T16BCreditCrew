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

  test('successfully exports a finalised xml document', async () => {
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
    const res2 = await axios.get(`${SERVER_URL}/v1/admin/invoice/${invoiceId}/xml`, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })   
    expect(res2.status).toBe(200)     
    expect(res2.headers['content-type']).toContain('application/xml')
    expect(res2.headers['content-disposition']).toContain(`invoice-${invoiceId}.xml`)
    expect(res2.data).toContain('<?xml')
  })


  test('prevents exporting an invoice that is not finalised', async () => {
    const res = await axios.get(`${SERVER_URL}/v1/admin/invoice/${invoiceId}/xml`, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })        
    expect(res.status).toBe(400)
    expect(res.data).toEqual({
      error: 'Invoice_Bad_Request',
      message: 'Invoice has not been successfully finalised'
    });
  })


  test('invalid or missing token', async () => {
    const invalid_token = ''
    const res = await axios.get(`${SERVER_URL}/v1/admin/invoice/${invoiceId}/xml`, 
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
    const res = await axios.get(`${SERVER_URL}/v1/admin/invoice/${invalid_invoiceId}/xml`, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    })       
    expect(res.data).toEqual({
      error: 'INVOICE_NOT_FOUND',
      message: 'Invoice does not exist'
    });
  })
})