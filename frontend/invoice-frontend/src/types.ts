export interface DashboardProps {
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