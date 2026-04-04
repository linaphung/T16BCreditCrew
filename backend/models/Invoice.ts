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
})

const invoiceDataSchema = new mongoose.Schema({
  issueDate: String,

  dueDate: String,

  paymentTerms: String,

  invoicePeriod: {
    invoiceStartDate: String,
    invoiceEndDate: String
  },

  buyer: {
    name: String
  },

  seller: {
    name: String,
    abn: String
  },

  lineItems: [lineItemSchema],

  payableAmount: {
    currency: String,
    amount: Number
  }
})

// this is how we define data we will insert into the database
const invoiceSchema = new mongoose.Schema({
  userId : {
    type: String,
    required: true
  },

  status : {
    type: String,
    enum: ['draft', 'invalid', 'finalised','sent', 'paid'],
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

  // add something that keeps track of user session/token
}, {timestamps: true})
// timestamps keeps track of when it was created or updated

export default mongoose.model('Invoice', invoiceSchema)