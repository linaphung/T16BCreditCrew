import { parseOrder } from './wrappers.js'

describe('parseOrderDocument', () => {
  test('successfully parses a JSON order document', async () => {
    const fileBuffer = Buffer.from(JSON.stringify({
      buyer: 'test buyer',
      seller: 'test business',
      paymentTerms: 'payment due within 5 days',
      notes: 'this is a note',
      orderLines: [{ lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }]
    }))

    const result = await parseOrder(fileBuffer)
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      buyerName: 'test buyer',
      sellerName: 'test business',
      paymentTerms: 'payment due within 5 days',
      notes: 'this is a note',
      issueDate: '',
      dueDate: '',
      currency: 'AUD',
      invoicePeriod: {
        startDate: '',
        endDate: ''
      },
      orderLines: [
        { lineId: '1', itemName: 'cat', quantity: 100, unitPrice: 10 }
      ]
    })
  })

  test('successfully parses an XML order document', async () => {
    const fileBuffer = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
      <Order>
        <Buyer>
          <Name>test buyer</Name>
        </Buyer>
        <Seller>
          <Name>test business</Name>
        </Seller>
        <PaymentTerms>payment due within 5 days</PaymentTerms>
        <Notes>this is a note</Notes>
        <InvoicePeriod>
          <StartDate>2026-03-01</StartDate>
          <EndDate>2026-03-10</EndDate>
        </InvoicePeriod>
        <OrderLines>
          <OrderLine>
            <ItemName>cat</ItemName>
            <Quantity>100</Quantity>
            <UnitPrice>10</UnitPrice>
          </OrderLine>
        </OrderLines>
      </Order>`)

    const result = await parseOrder(fileBuffer)
    expect(result.statusCode).toStrictEqual(200)
    expect(result.body).toStrictEqual({
      buyerName: 'test buyer',
      sellerName: 'test business',
      paymentTerms: 'payment due within 5 days',
      notes: 'this is a note',
      issueDate: '',
      dueDate: '',
      currency: 'AUD',
      invoicePeriod: {
        startDate: '2026-03-01',
        endDate: '2026-03-10'
      },
      orderLines: [
        { lineId: '', itemName: 'cat', quantity: 100, unitPrice: 10 }
      ]
    })
  })

  test('INVALID_FILE, unsupported file format', async () => {
    const fileBuffer = Buffer.from('some content')
    const result = await parseOrder(fileBuffer)
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({
      error: 'INVALID_FILE',
      message: expect.any(String)
    })
  })

  test('INVALID_FILE, invalid JSON file', async () => {
    const fileBuffer = Buffer.from('not valid json')
    const result = await parseOrder(fileBuffer)
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({
      error: 'INVALID_FILE',
      message: expect.any(String)
    })
  })

  test('INVALID_FILE, missing required fields in order document', async () => {
    const fileBuffer = Buffer.from(JSON.stringify({ buyer: 'test buyer' }))
    const result = await parseOrder(fileBuffer)
    expect(result.statusCode).toStrictEqual(400)
    expect(result.body).toStrictEqual({
      error: 'INVALID_FILE',
      message: expect.any(String)
    })
  })
})