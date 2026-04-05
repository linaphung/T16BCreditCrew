import Invoice from '../models/Invoice.js'
import { GeneratedInvoice, InvoiceData, DraftInvoiceInput, DeleteInvoiceResponse, InvoicePeriod, InvoiceFilters } from './types.js'
import { calculateLineExtension, generateXMLString, isOverdue } from './helper.js'
import { InvoiceBadRequest, InvoiceNotFoundError, InvalidFileError } from './errors.js'
import { validateInvoiceHelper } from './invoiceValidation.js'
import { XMLParser } from 'fast-xml-parser'

/**
 * Validates the uploaded file is XML or JSON and returns its contents as a string.
 * @throws {InvalidFileError} If the MIME type is not supported.
 */
export const uploadOrderDocument = (
  fileBuffer: Buffer,
  mimeType: string
): { file: string } => {
  if (
    mimeType !== 'application/json' &&
    mimeType !== 'text/plain' &&
    mimeType !== 'application/xml' &&
    mimeType !== 'text/xml'
  )
    throw new InvalidFileError('Invalid file format. Must be XML or JSON')

  return { file: fileBuffer.toString() }
}

/**
 * Parses a UBL order document (JSON or XML) and creates a draft invoice.
 * Extracts buyer, seller, payment terms, and line items from the order,
 * then delegates to `generateInvoiceDraft`.
 *
 * @param fileBuffer    - The uploaded file contents.
 * @param mimeType      - Used to determine how to parse the file.
 * @param userId        - The ID of the user creating the invoice.
 * @param issueDate     - Invoice issue date.
 * @param dueDate       - Invoice due date.
 * @param currency      - Currency code (e.g. 'AUD').
 * @param invoicePeriod - Optional billing period.
 * @throws {InvalidFileError} If the file is malformed or missing required fields.
 */
export const parseOrderDocument = async (
  fileBuffer: Buffer,
  mimeType: string,
  userId: string,
  issueDate: string,
  dueDate: string,
  currency: string,
  invoicePeriod?: InvoicePeriod
): Promise<GeneratedInvoice> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any

  if (mimeType === 'application/json' || mimeType === 'text/plain') {
    try {
      parsed = JSON.parse(fileBuffer.toString())
    } catch {
      throw new InvalidFileError('Invalid JSON file')
    }
  } else if (mimeType === 'application/xml' || mimeType === 'text/xml') {
    try {
      const parser = new XMLParser({ ignoreAttributes: false })
      parsed = parser.parse(fileBuffer.toString())
    } catch {
      throw new InvalidFileError('Invalid XML file')
    }
  } else {
    throw new InvalidFileError('Invalid file format. Must be XML or JSON')
  }

  const order = parsed?.Order ?? parsed

  const buyer = order?.BuyerCustomerParty?.Party?.PartyName?.Name ?? order?.buyer
  const seller = order?.SellerSupplierParty?.Party?.PartyName?.Name ?? order?.seller
  const paymentTerms = order?.PaymentTerms?.Note ?? order?.paymentTerms

  // Handles both single line and array of lines
  const rawLines = order?.OrderLine ?? order?.orderLines
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderLines = (Array.isArray(rawLines) ? rawLines : [rawLines]).map((line: any) => ({
    lineId: line?.LineItem?.ID ?? line?.lineId,
    itemName: line?.LineItem?.Item?.Name ?? line?.itemName,
    quantity: Number(line?.LineItem?.Quantity ?? line?.quantity),
    unitPrice: Number(line?.LineItem?.Price?.PriceAmount ?? line?.unitPrice),
  }))

  if (!buyer || !seller || !paymentTerms || !orderLines.length)
    throw new InvalidFileError('Missing required fields in order document')

  if (!issueDate || !dueDate || !currency)
    throw new InvalidFileError('Missing required fields: issueDate, dueDate, currency')

  return generateInvoiceDraft({
    issueDate,
    dueDate,
    currency,
    invoicePeriod,
    paymentTerms,
    buyer,
    seller,
    orderLines
  }, userId)
}

/**
 * Creates a draft invoice record in the database.
 * Payable amount is calculated from the provided order lines.
 * XML is not generated until the invoice is finalised.
 */
export const generateInvoiceDraft = async (
  input: DraftInvoiceInput,
  userId: string,
): Promise<GeneratedInvoice> => {
  const payableAmount = calculateLineExtension(input.orderLines)

  const invoiceData: InvoiceData = {
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    paymentTerms: input.paymentTerms,
    invoicePeriod: input.invoicePeriod ? {
      startDate: input.invoicePeriod.startDate,
      endDate: input.invoicePeriod.endDate,
    } : undefined,
    buyer: { name: input.buyer },
    seller: { name: input.seller },
    lineItems: input.orderLines,
    payableAmount: {
      currency: input.currency,
      amount: payableAmount
    }
  }
  const invoice = await Invoice.create({
    userId,
    status: 'draft',
    invoiceData,
    invoiceXMLString: ""
  })

  return {
    invoiceId: invoice._id.toString(),
    invoiceData,
    invoiceStatus: 'draft',
    invoiceXML: "",
    isOverdue: invoice.isOverdue
  }
}

/**
 * Finalises a draft invoice — generates and validates the UBL XML, then locks the record.
 * Finalised invoices cannot be edited.
 *
 * @throws {InvoiceNotFoundError} If the invoice doesn't exist or belong to the user.
 * @throws {InvoiceBadRequest}    If already finalised or XML validation fails.
 */
export const finaliseInvoice = async (invoiceId: string, userId: string) => {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  if (!invoice)
    throw new InvoiceNotFoundError('Invoice does not exist')

  if (invoice.status === 'finalised' || invoice.status === 'sent' || invoice.status === 'paid')
    throw new InvoiceBadRequest(`Invoice is already ${invoice.status}`)

  const invoiceData = invoice.invoiceData as InvoiceData
  const xmlString = generateXMLString(invoiceData, invoiceId)

  if (!validateInvoiceHelper(xmlString).valid)
    throw new InvoiceBadRequest('Invoice is not valid')

  invoice.invoiceXMLString = xmlString
  invoice.status = 'finalised'
  await invoice.save()

  return { invoiceId }
}

/**
 * Returns the UBL XML string for a finalised invoice.
 * @throws {InvoiceNotFoundError} If the invoice doesn't exist or belong to the user.
 * @throws {InvoiceBadRequest}    If the invoice hasn't been finalised yet.
 */
export const exportInvoice = async (invoiceId: string, userId: string) => {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  if (!invoice)
    throw new InvoiceNotFoundError('Invoice does not exist')
  if (invoice.status === 'sent' || invoice.status === 'paid') {
    return invoice.invoiceXMLString
  }
  if (invoice.status !== 'finalised' || !invoice.invoiceXMLString)
    throw new InvoiceBadRequest('Invoice has not been successfully finalised')

  return invoice.invoiceXMLString
}

/**
 * Fetches a single invoice by ID, scoped to the requesting user.
 * @throws {InvoiceNotFoundError} If the invoice doesn't exist or belong to the user.
 */
export const getInvoice = async (invoiceId: string, userId: string): Promise<GeneratedInvoice> => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })

  if (!invoice)
    throw new InvoiceNotFoundError('Invoice not found')

  return {
    invoiceId: invoice._id.toString(),
    invoiceStatus: invoice.status,
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceXML: invoice.invoiceXMLString!,
    isOverdue: invoice.isOverdue
  }
}

/**
 * Returns all invoices belonging to the given user.
 * invoice can optionally be filtered using certain parameters
 */
export const getAllInvoices = async (userId: string, filters?: InvoiceFilters): Promise<GeneratedInvoice[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match: Record<string, any> = { userId }

  if (filters) {
    const { status, buyerName, sellerName, issueDate, dueDate, invoicePeriod } = filters

    if (status)
      match.status = status

    if (buyerName)
      match["invoiceData.buyer.name"] = { $regex: buyerName, $options: "i" }

    if (sellerName)
      match["invoiceData.seller.name"] = { $regex: sellerName, $options: "i" }

    if (issueDate?.from || issueDate?.to) {
      match["invoiceData.issueDate"] = {}

      if (issueDate.from)
        match["invoiceData.issueDate"].$gte = issueDate.from

      if (issueDate.to)
        match["invoiceData.issueDate"].$lte = issueDate.to
    }

    if (dueDate?.from || dueDate?.to) {
      match["invoiceData.dueDate"] = {}

      if (dueDate.from)
        match["invoiceData.dueDate"].$gte = dueDate.from

      if (dueDate.to)
        match["invoiceData.dueDate"].$lte = dueDate.to
    }

    if (invoicePeriod?.startDate)
      match["invoiceData.invoicePeriod.startDate"] = { $gte: invoicePeriod.startDate }

    if (invoicePeriod?.endDate)
      match["invoiceData.invoicePeriod.endDate"] = { $lte: invoicePeriod.endDate }
  }

  const invoices = await Invoice.aggregate([{ $match: match }])

  return invoices.map(invoice => ({
    invoiceId: invoice._id.toString(),
    invoiceStatus: invoice.status,
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceXML: invoice.invoiceXMLString || "",
    isOverdue: invoice.isOverdue
  }))
}

/**
 * Merges updated fields into an existing draft invoice and saves it.
 * @throws {InvoiceNotFoundError} If the invoice doesn't exist or belong to the user.
 */
export const updateInvoice = async (
  invoiceId: string,
  userId: string,
  updatedFields: Partial<InvoiceData>
): Promise<GeneratedInvoice> => {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId })

  if (!invoice)
    throw new InvoiceNotFoundError('Invoice not found')

  invoice.invoiceData = Object.assign({}, invoice.invoiceData, updatedFields)
  await invoice.save()

  return {
    invoiceId: invoice._id.toString(),
    invoiceStatus: invoice.status,
    invoiceData: invoice.invoiceData as InvoiceData,
    invoiceXML: invoice.invoiceXMLString!,
    isOverdue: invoice.isOverdue
  }
}

/**
 * Deletes an invoice, scoped to the requesting user.
 * @throws {InvoiceNotFoundError} If no matching invoice is found.
 */
export const deleteInvoice = async (
  invoiceId: string,
  userId: string
): Promise<DeleteInvoiceResponse> => {
  const result = await Invoice.deleteOne({ _id: invoiceId, userId })

  if (result.deletedCount === 0)
    throw new InvoiceNotFoundError('Invoice not found')

  return {}
}

export const markAsPaid = async (invoiceId: string, userId: string) => {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: invoiceId, userId })
  } catch {
    throw new InvoiceNotFoundError('Invoice does not exist')
  }

  if (!invoice)
    throw new InvoiceNotFoundError('Invoice does not exist')

  if (invoice.status === 'draft' || invoice.status === 'invalid') {
    throw new InvoiceBadRequest(`Invoice is still ${invoice.status} state`)
  }

  invoice.status = 'paid'
  await invoice.save()
  return {invoiceId: invoice._id.toString()}
}

export const checkForOverdue = async(userId: string) => {
  const invoices = await Invoice.find({
    userId,
    status: {$in : ['finalised', 'sent']},
    isOverdue: false
  })

  const overdueIds = invoices
    .filter(i =>  isOverdue((i.invoiceData as InvoiceData).dueDate))
    .map(i => i._id.toString())
  // if a users invoice has dueDate marks as overdue if overdue
  if (overdueIds.length === 0) {
    return {updated: 0}
  }
  // updates 
  const result = await Invoice.updateMany(
    { _id: { $in: overdueIds } },
    { $set: { isOverdue: true } }
  )

  return {updated: result.modifiedCount}
}