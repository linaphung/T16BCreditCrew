// import axios from "axios"
// // test for no token
// const PORT = process.env.PORT || 3000;
// const SERVER_URL = `http://localhost:${PORT}`;

// describe("test getInvoice", () => {
//   let token: string;
//   let invoiceId: string;

//   beforeAll(async () => {
//     const loginRes = await axios.post(`${SERVER_URL}/v1/admin/login`, {
//       email: "test_email@gmail.com",
//       password: "password1"
//     })

//     expect(loginRes.status).toBe(200);
//     token = loginRes.data.token

//     const invoice1 = await axios.post(`${SERVER_URL}/v1/admin/invoice`, {
//       issueDate: "2026-03-15",
//       invoicePeriod: {invoiceStartDate: "2026-03-01", invoiceEndDate: "2026-03-20"},
//       dueDate: "2026-03-30",
//       paymentTerms: "Payment due within 30 days",
//       buyer: "buyer_test",
//       seller: "seller_test",
//       currency: "AUD",
//       orderLines: [{lineId: "1", itemName: "item1", quantity: 100, unitPrice: 10}]
//     }, {
//       headers: {Authorization: `Bearer ${token}`}
//     })
//     invoiceId = invoice1.data.result.invoiceId;
//   })

//   test("get invoice by ID", async () => {
//     const res = await axios.get(`${SERVER_URL}/v1/invoices/${invoiceId}`, {
//       headers: {Authorization: `Bearer ${token}`},
//     })

//     expect(res.status).toBe(200);
//     expect(res.data.invoiceId).toBe(invoiceId);
//     expect(res.data.invoiceStatus).toBe("draft");
//     expect(res.data.invoiceData).toBeDefined();
//   })

//   test("test 404 error with invalid invoiceId", async () => {
//     const fakeInvoiceId = "64ae850f4u3e8c3df5e1d5c";

//     await expect(
//       axios.get(`${SERVER_URL}/v1/invoices/${fakeInvoiceId}`, {
//         headers: {Authorization: `Bearer ${token}`}
//       })
//     ).rejects.toMatchObject({
//       response: {
//         status: 404,
//         data: expect.objectContaining({
//           error: "invoiceId is invalid or empty",
//           message: expect.any(String)
//         })
//       }
//     })
//   })

//   afterAll(async () => {
//     const res = await axios.delete(`${SERVER_URL}/v1/invoices/${invoiceId}`, {
//       headers: {Authorization: `Bearer ${token}`}
//     })

//     expect(res.status).toBe(200);
//   })
// })