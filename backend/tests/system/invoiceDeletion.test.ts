import axios from 'axios'
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

describe('test invoice deletion', () => {
  let token: string;
  let invoiceId: string;

  beforeEach(async () => {
    //register an account
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
        email: 'masonmasonmason@gmail.com',
        businessName: 'Mason Corp',
        abn: '12345678901',
        password: 'masonmasonmason1234'
    }, { validateStatus: () => true });
  
    //login to user account
    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
        email: 'masonmasonmason@gmail.com',
        password: 'masonmasonmason1234'
    });
    token = loginRes.data.token;

    //create an invoice to delete
    const createRes = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
      issueDate: '2026-03-15',
      invoicePeriod: { invoiceStartDate: '2026-03-01', invoiceEndDate: '2026-03-20' },
      dueDate: '2026-03-30',
      paymentTerms: 'Payment due within 30 days',
      buyer: 'ABC test',
      seller: 'test business',
      currency: 'AUD',
      orderLines: [{ lineId: '1', itemName: 'brick', quantity: 100, unitPrice: 10 }],
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    invoiceId = createRes.data.result.invoiceId;
  });

  test('successfully delete invoice', async () => {
    const res = await axios.delete(`${SERVER_URL}/v1/invoices/${invoiceId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    //expect to return an empty object and a status code 200
    expect(res.status).toBe(200);
    expect(res.data).toEqual({});
  });

  test('returns 400 when deleting a non-existent invoice', async () => {
    const fakeInvoiceId = '000000000000000000000000';
  
    const res = await axios.delete(`${SERVER_URL}/v1/invoices/${fakeInvoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true 
    });
    
    expect(res.status).toBe(400);
    expect(res.data.error).toBe('INVOICE_NOT_FOUND');
  });

  test('Test when a user attempts to delete someone elses invoice', async () => {
    // generate a uniqe email using date
    const randomEmail = `hacker_${Date.now()}@gmail.com`;

    // register a new user
    await axios.post(`${SERVER_URL}/v1/admin/auth/register`, {
        email: randomEmail,
        businessName: 'Hackers Crew',
        abn: '98765432109',
        password: 'password123'
    });

    // Login with the random user
    const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
        email: randomEmail,
        password: 'password123'
    });
    
    const randomPersonToken = loginRes.data.token;

    // attempt to delete another users email 
    const res = await axios.delete(`${SERVER_URL}/v1/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${randomPersonToken}` },
      validateStatus: () => true 
    });
    
    expect(res.status).toBe(400);
    expect(res.data.error).toBe('INVOICE_NOT_FOUND');
  });
});