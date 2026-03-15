// import axios from 'axios'
// // test for no token
// const PORT = process.env.PORT || 3000;
// const SERVER_URL = `http://localhost:${PORT}`;

// describe('test invoice draft generation', () => {
//   let token: string;
//   let invoiceId: string;
//   beforeEach(async () => {
//     const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
//         email: 'leahe@gmail.com',
//         password: 'leah1234'
//     });
//     expect(loginRes.status).toBe(200);
//     token = loginRes.data.token
//     const res = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
//       issueDate: '2026-03-15',
//       invoicePeriod: {
//           invoiceStartDate: '2026-03-01',
//           invoiceEndDate: '2026-03-20',
//       },
//       dueDate: '2026-03-30',
//       paymentTerms: 'Payment due within 30 days',
//       buyer: 'ABC test',
//       seller: 'test business',
//       currency: 'AUD',
//       orderLines: [
//         {
//           lineId: '1',
//           itemName: 'brick',
//           quantity: 100,
//           unitPrice: 10,
//         }
//       ],
//     }, 
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//     expect(res.status).toBe(200);
//     invoiceId = res.data.result.invoiceId
//   })

//   test.skip('valid invoice returns no errors', async () => {
//     const res = await axios.post(`${SERVER_URL}/v1/invoices/${invoiceId}/validate`, {}, 
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       },
//       validateStatus: () => true
//     })       
//     expect(res.status).toBe(200);
//     expect(res.data.valid).toBe(true);
//     expect(res.data.errors.length).toBe(0);
//   })

//   test.skip('invalid invoice - missing issue data and invoicePeriod', async () => {
//     const invalidInvoiceRequest = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
//       issueDate: '',
//       dueDate: '2026-03-30',
//       paymentTerms: 'Payment due within 30 days',
//       buyer: 'ABC test',
//       seller: 'test business',
//       currency: 'AUD',
//       orderLines: [
//         {
//           lineId: '1',
//           itemName: 'brick',
//           quantity: 100,
//           unitPrice: 10,
//         }
//       ],
//     }, 
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//     expect(invalidInvoiceRequest.status).toBe(200);
//     invoiceId = invalidInvoiceRequest.data.result.invoiceId
    
//     const res = await axios.post(`${SERVER_URL}/v1/invoices/${invoiceId}/validate`, {}, 
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       },
//       validateStatus: () => true
//     })       
//     expect(res.status).toBe(200);
//     expect(res.data.valid).toBe(false);
//     expect(res.data.errors.length).toBe(3);
//   })

//   test.skip('invalid or missing token', async () => {
//     const invalid_token = ''
//     const res = await axios.post(`${SERVER_URL}/v1/invoices/${invoiceId}/validate`, 
//     {}, 
//     {
//       headers: {
//         Authorization: `Bearer ${invalid_token}`
//       },
//       validateStatus: () => true
//     })       
//     expect(res.data).toEqual({
//       error: 'INVALID_TOKEN',
//       message: 'Token is invalid or empty'
//     });
//   })

//   test.skip('missing or invalid invoiceId', async () => {
//     const invalid_invoiceId = 'invalidInvoiceId'
//     const res = await axios.post(`${SERVER_URL}/v1/invoices/${invalid_invoiceId}/validate`, {}, 
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       },
//       validateStatus: () => true
//     })       
//     expect(res.status).toBe(404);
//     expect(res.data).toEqual({
//       error: 'INVOICE_NOT_FOUND',
//       message: 'Invoice does not exist'
//     });
//   })
// })