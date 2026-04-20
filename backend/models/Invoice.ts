import mongoose from 'mongoose'

const lineItemSchema = new mongoose.Schema({
  lineId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  }
}, { _id: false })

const invoiceDataSchema = new mongoose.Schema({
  issueDate: String,
  dueDate: String,
  paymentTerms: String,
  notes: String,
  invoicePeriod: {
    startDate: String,
    endDate: String
  },
  buyer: {
    name: String
  },
  seller: {
    name: String
  },
  lineItems: [lineItemSchema],
  originalCurrency: String,
  originalLineItems: [lineItemSchema],
  payableAmount: {
    currency: String,
    amount: Number
  }
}, { _id: false })

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['draft', 'invalid', 'finalised', 'paid'],
    default: 'draft'
  },

  invoiceData: invoiceDataSchema,

  invoiceXMLString: {
    type: String
  },

  isOverdue: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

export default mongoose.model('Invoice', invoiceSchema)