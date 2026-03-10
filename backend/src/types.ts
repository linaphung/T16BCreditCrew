import jwt from 'jsonwebtoken'

export interface ErrorObject {
  error: string;
  message: string;
}

export interface UserRegister {
  email: string;
  businessName: string;
  abn: string;
  password: string;
}

export interface RegisterResponse {
  code: number;
  userId: string;
}

export interface InvoiceId {
  invoiceId: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  code: number;
  adminId: string; 
  token: string;
}

export interface UserLogout {
  code: number;
}

// scenario: only want to change one label and not all
// does function implementation always have to take in three parameters
// what happens if a parameter is empty? will it throw error even though
// user wanted to only change one label e.g. password 
export interface UserUpdate {
  email: string;
  password: string;
  businessName: string;
}

export interface UserDetails {
  email: string;
  businessName: string;
  abn: string;
}

export interface UploadOrderContract { 
  file: string; 
}

export interface Names {
  name: string;
}

export interface OrderLine {
  lineId: string;
  itemName: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
}
  
export interface ParseOrderContract {
  orderId: string;
  buyer: string;
  seller: string;
  orderLines: OrderLine[];
  paymentTerms: string;
}

export interface DraftInvoiceInput {
  issueDate: string,
  invoicePeriod: InvoicePeriod
  dueDate: string,
  paymentTerms: string,
  buyer: string,
  seller: string,
  currency: string,
  orderLines: OrderLine[],
}
export interface DraftInvoiceRequest {
  parsedData: ParseOrderContract;
}

export interface DraftInvoiceResponse {
  draftInvoice: GeneratedInvoice;
}

export interface InvoiceUserData {
  issueDate: string;
  currency: string;
  invoiceId: string;
  dueDate: string;
  paymentTerms: string;
}

export interface CopyDataIntoInvoice {
  orderText: string;
  userData: InvoiceUserData;
}

export interface InvoicePeriod {
  invoiceStartDate: string,
  invoiceEndDate: string,
}
export interface InvoiceData {
  issueDate: string,
  dueDate: string,
  paymentTerms: string,
  invoicePeriod: InvoicePeriod,
  buyer: {
    name: string
  }
  seller: {
    name: string
    abn: string
  }
  lineItems: OrderLine[]
  payableAmount: {
    currency: string,
    amount: number
  }
}
// swagger schema for invoiceData has to be edited
// interface for invoiceData has to be created
export interface GeneratedInvoice {
  invoiceId: string;
  invoiceStatus: 'draft' | 'invalid' | 'valid' | 'finalised';
  invoiceData: InvoiceData;
  invoiceXML: string;
}

export interface ValidationCheck {
  businessRulesValid: boolean;
}

export type DeleteInvoiceResponse = Record<string, never>;

export interface AuthUser {
  adminId: string
}

declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

