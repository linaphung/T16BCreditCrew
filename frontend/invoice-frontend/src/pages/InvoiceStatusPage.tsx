import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/custom/AppSidebar"

type InvoiceStatus = "draft" | "finalised" | "sent" | "paid"

interface InvoiceStatusPageProps {
  url: string
  setToken: (token: string | null) => void
  status: InvoiceStatus
}

interface Invoice {
  _id?: string
  invoiceId?: string | number
  buyerName?: string
  sellerName?: string
  totalAmount?: number
  status: string
}

export default function InvoiceStatusPage({
  url,
  setToken,
  status,
}: InvoiceStatusPageProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      navigate("/")
      return
    }

    async function fetchInvoices() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`${url}/v2/admin/invoices?status=${status}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch invoices")
        }

        setInvoices(data.invoices || [])
      } catch (err) {
        const error = err as Error
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [token, navigate, url, status])

  const titleMap = {
    draft: "Draft Invoices",
    finalised: "Finalised Invoices",
    sent: "Sent Invoices",
    paid: "Paid Invoices",
  }

  return (
    <SidebarProvider>
      <AppSidebar url={url} setToken={setToken} />
      <main className="p-6 w-full">
        <h1 className="text-2xl font-bold mb-6">{titleMap[status]}</h1>

        {loading && <p>Loading invoices...</p>}

        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && invoices.length === 0 && (
          <p>No {status} invoices found.</p>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="space-y-4">
            {invoices.map((invoice, index) => (
              <div
                key={invoice._id || invoice.invoiceId || index}
                className="border rounded-lg p-4 shadow-sm"
              >
                <p><strong>Invoice ID:</strong> {invoice.invoiceId || invoice._id}</p>
                <p><strong>Buyer:</strong> {invoice.buyerName || "N/A"}</p>
                <p><strong>Seller:</strong> {invoice.sellerName || "N/A"}</p>
                <p><strong>Status:</strong> {invoice.status}</p>
                <p><strong>Total:</strong> ${invoice.totalAmount ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </SidebarProvider>
  )
}