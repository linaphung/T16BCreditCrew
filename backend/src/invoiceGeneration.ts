import Invoice from '../models/Invoice.js'
import { GeneratedInvoice, InvoiceData, DraftInvoiceInput, DeleteInvoiceResponse, InvoiceFilters } from './types.js'
import { calculateLineExtension, generateXMLString, isOverdue, validateDraftInput, validateCompleteInput } from './helper.js'
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
export const parseOrderDocument = async (fileBuffer: Buffer) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  const fileContent = fileBuffer.toString().trim()

  if (!fileContent) 
    throw new InvalidFileError('Uploaded file is empty')

  if (fileContent.startsWith('{') || fileContent.startsWith('[')) {
    try {
      parsed = JSON.parse(fileContent)
    } catch {
      throw new InvalidFileError('Invalid JSON file')
    }
  } else if (fileContent.startsWith('<')) {
    try {
      const parser = new XMLParser({ ignoreAttributes: false })
      parsed = parser.parse(fileContent)
    } catch {
      throw new InvalidFileError('Invalid XML file')
    }
  } else {
    throw new InvalidFileError('Invalid file format. Must be XML or JSON')
  }

  const order = parsed?.Order ?? parsed

  const rawBuyer =
    order?.BuyerCustomerParty?.Party?.PartyName?.Name ??
    order?.buyerName ??
    order?.buyer?.businessName ??
    order?.buyer ??
    order?.Buyer?.BusinessName ??
    order?.Buyer?.Name ??
    order?.Buyer

  const buyerName =
    typeof rawBuyer === 'string'
      ? rawBuyer
      : rawBuyer?.businessName ?? rawBuyer?.name ?? rawBuyer?.Name ?? ''

  const rawSeller =
    order?.SellerSupplierParty?.Party?.PartyName?.Name ??
    order?.sellerName ??
    order?.seller?.businessName ??
    order?.seller ??
    order?.Seller?.BusinessName ??
    order?.Seller?.Name ??
    order?.Seller

  const sellerName =
    typeof rawSeller === 'string'
      ? rawSeller
      : rawSeller?.businessName ?? rawSeller?.name ?? rawSeller?.Name ?? ''

  const rawPaymentTerms =
    order?.PaymentTerms?.Note ??
    order?.paymentTerms ??
    order?.PaymentTerms

  const paymentTerms =
    typeof rawPaymentTerms === 'string'
      ? rawPaymentTerms
      : rawPaymentTerms?.note ?? rawPaymentTerms?.Note ?? ''

  const rawNotes =
    order?.notes ??
    order?.Notes ??
    order?.Note

  const notes =
    typeof rawNotes === 'string'
      ? rawNotes
      : rawNotes?.text ?? ''

  const issueDate =
    order?.IssueDate ??
    order?.issueDate ??
    ''

  const dueDate =
    order?.DueDate ??
    order?.dueDate ??
    order?.deliveryDate ??
    ''

  const currency =
    order?.DocumentCurrencyCode ??
    order?.currency ??
    'AUD'

  const invoicePeriod = {
    startDate:
      order?.InvoicePeriod?.StartDate ??
      order?.invoicePeriod?.startDate ??
      '',
    endDate:
      order?.InvoicePeriod?.EndDate ??
      order?.invoicePeriod?.endDate ??
      ''
  }

  const rawLines =
    order?.OrderLine ??
    order?.orderLines ??
    order?.OrderLines?.OrderLine ??
    order?.items ??
    order?.Items?.Item ??
    []

  const lineArray = Array.isArray(rawLines) ? rawLines : [rawLines]

  const orderLines = lineArray
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((line: any) => ({
      lineId: String(
        line?.LineItem?.ID ??
        line?.lineId ??
        line?.lineNumber ??
        line?.LineId ??
        line?.LineNumber ??
        ''
      ),
      itemName:
        line?.LineItem?.Item?.Name ??
        line?.itemName ??
        line?.description ??
        line?.Description ??
        line?.ItemName ??
        '',
      quantity: Number(
        line?.LineItem?.Quantity ??
        line?.quantity ??
        line?.Quantity ??
        0
      ),
      unitPrice: Number(
        line?.LineItem?.Price?.PriceAmount ??
        line?.unitPrice ??
        line?.UnitPrice ??
        0
      ),
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((line: any) => line.itemName)

  if (!buyerName || !sellerName || !orderLines.length) 
    throw new InvalidFileError('Missing required fields in order document')

  return {
    buyerName,
    sellerName,
    paymentTerms,
    notes,
    issueDate,
    dueDate,
    currency,
    invoicePeriod,
    orderLines
  }
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

  if (input.isDraft) {
    validateDraftInput(input)
  } else {
    validateCompleteInput(input)
  }

  const baseLineItems = (input.orderLines || []).map(item => ({
    lineId: item.lineId,
    itemName: item.itemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice
  }))

  const baseCurrency = input.currency || 'AUD'
  const payableAmount = calculateLineExtension(baseLineItems)

  const invoiceData: InvoiceData = {
    issueDate: input.issueDate || '',
    dueDate: input.dueDate || '',
    paymentTerms: input.paymentTerms || '',
    notes: input.notes || '',
    invoicePeriod: input.invoicePeriod ? {
      startDate: input.invoicePeriod.startDate || '',
      endDate: input.invoicePeriod.endDate || '',
    } : undefined,
    buyer: { name: input.buyer || '' },
    seller: { name: input.seller || '' },
    lineItems: baseLineItems,
    originalLineItems: baseLineItems,
    originalCurrency: baseCurrency,
    payableAmount: {
      currency: baseCurrency,
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

  if (invoice.status === 'finalised' || invoice.status === 'paid')
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
  if (invoice.status === 'paid') {
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

  const current = invoice.invoiceData as InvoiceData

  const originalLineItems = (current.originalLineItems ?? current.lineItems).map(item => ({
    lineId: item.lineId,
    itemName: item.itemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice
  }))

  invoice.set('invoiceData.originalCurrency', current.originalCurrency ?? current.payableAmount.currency)
  invoice.set('invoiceData.originalLineItems', originalLineItems)

  Object.entries(updatedFields).forEach(([key, value]) => {
    invoice.set(`invoiceData.${key}`, value)
  })

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
    status: {$in : ['finalised']},
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