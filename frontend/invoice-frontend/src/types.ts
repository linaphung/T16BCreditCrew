export type DashboardProps = {
  url: string
  setToken: React.Dispatch<React.SetStateAction<string | null>>
}

export type CreateInvoicePageProps = {
  url: string
  setToken: React.Dispatch<React.SetStateAction<string | null>>
}

export type ViewInvoiceProps = {
  url: string
  setToken: React.Dispatch<React.SetStateAction<string | null>>
}

export interface LoginPageProps {
  url: string
  setToken: React.Dispatch<React.SetStateAction<string | null>>
}

export interface RegisterPageProps {
  url: string
  setToken: React.Dispatch<React.SetStateAction<string | null>>
}

export type EditInvoicePageProps = {
  url: string
}


export interface Invoice {
  invoiceId: string
  invoiceStatus: string
  invoiceData: {
    buyer: {
      name: string
    }
    seller: {
      name: string
    }
    dueDate: string
    invoicePeriod?: {
      startDate?: string
      endDate?: string
    }
    payableAmount: {
      amount: number
      currency: string
    }
  }
  isOverdue: boolean
}

export interface Item {
  itemName: string
  quantity: string
  unitPrice: string
}

export interface ItemError {
  quantity: string
  unitPrice: string
}

export type ParsedOrderLine = {
  itemName?: string
  quantity?: number
  unitPrice?: number
}

export type InvoiceLine = {
  lineId: string
  itemName: string
  quantity: number
  unitPrice: number
}

export type InvoiceData = {
  issueDate: string
  dueDate: string
  paymentTerms: string
  invoicePeriod?: {
    startDate?: string
    endDate?: string
  }
  buyer: {
    name: string
  }
  seller: {
    name: string
  }
  lineItems: InvoiceLine[]
  payableAmount: {
    currency: string
    amount: number
  }
  notes: string
}

export type InvoiceResponse = {
  invoiceId: string
  invoiceStatus: "draft" | "finalised" | "pending" | "paid" | "invalid"
  invoiceData: InvoiceData
  invoiceXML: string
  isOverdue: boolean
}

export type EditableItem = {
  lineId: string
  itemName: string
  quantity: string
  unitPrice: string
}