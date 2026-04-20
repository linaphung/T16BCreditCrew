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

export interface UserUpdate {
  email?: string;
  password?: string;
  businessName?: string;
  abn: string
  phoneNumber?: string
  address?: string
  includeAbn?: boolean
  includeEmail?: boolean
  includePhoneNumber?: boolean
  includeAddress?: boolean
}

export interface UserDetails {
  email: string
  businessName: string
  abn: string
  phoneNumber?: string
  address?: string
  includeAbn?: boolean
  includeEmail?: boolean
  includePhoneNumber?: boolean
  includeAddress?: boolean
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
  invoicePeriod?: InvoicePeriod
  dueDate: string,
  notes?: string,
  paymentTerms: string,
  buyer: string,
  seller: string,
  currency: string,
  orderLines: OrderLine[],
  isDraft?: boolean
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
  startDate: string,
  endDate: string,
}

export interface InvoiceData {
  issueDate: string,
  dueDate: string,
  paymentTerms: string,
  notes?: string,
  invoicePeriod?: InvoicePeriod,
  buyer: {
    name: string
  }
  seller: {
    name: string
  }
  lineItems: OrderLine[]
  payableAmount: {
    currency: string,
    amount: number
  }
}

export interface InvoiceFilters {
  status?: string
  buyerName?: string
  sellerName?: string
  issueDate?: {
    from?: string;
    to?: string
  }
  dueDate?: {
    from?: string;
    to?: string
  }
  invoicePeriod?: {
    startDate?: string;
    endDate?: string
  }
}

export interface GeneratedInvoice {
  invoiceId: string;
  invoiceStatus: 'draft' | 'invalid' | 'finalised' | 'overdue' | 'paid';
  invoiceData: InvoiceData;
  invoiceXML: string;
  isOverdue: boolean;
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
