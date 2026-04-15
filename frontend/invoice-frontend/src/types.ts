export interface DashboardProps {
  url: string
  setToken: (token: string | null) => void
}

export interface CreateInvoicePageProps {
  url: string
  setToken: (token: string | null) => void
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