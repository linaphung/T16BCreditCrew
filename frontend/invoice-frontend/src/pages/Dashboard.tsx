import { AppSidebar } from "@/components/custom/AppSidebar"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { DashboardProps, Invoice } from "@/types"

export default function DashboardPage({ url, setToken }: DashboardProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [buyerFilter, setBuyerFilter] = useState("")
  const [sellerFilter, setSellerFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate("/")
      return
    }
    getInvoices()
  }, [token, navigate])

  async function getInvoices() {
    if (!token) return
    setLoading(true)

    const params = new URLSearchParams()
    if (buyerFilter) params.append("buyerName", buyerFilter)
    if (sellerFilter) params.append("sellerName", sellerFilter)
    if (statusFilter) params.append("status", statusFilter)

    try {
      const response = await fetch(`${url}/v2/admin/invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setBuyerFilter("")
    setSellerFilter("")
    setStatusFilter("")
  }

  const hasActiveFilters = buyerFilter || sellerFilter || statusFilter

  let tableContent
  if (loading) {
    tableContent = (
      <tr>
        <td colSpan={7} className="px-6 py-14 text-center text-gray-400">
          Loading...
        </td>
      </tr>
    )
  } else if (invoices.length === 0) {
    tableContent = (
      <tr>
        <td colSpan={7} className="px-6 py-14 text-center text-gray-400">
          {hasActiveFilters ? "No invoices match your filters." : "No invoices yet."}
        </td>
      </tr>
    )
  } else {
    tableContent = invoices.map((invoice, index) => (
      <tr
        key={invoice.invoiceId}
        className="cursor-pointer border-t hover:bg-gray-50 transition-colors"
        onClick={() => navigate(`/dashboard/${invoice.invoiceId}`)}
      >
        <td className="px-6 py-4 text-gray-400 text-sm">{index + 1}</td>
        <td className="px-6 py-4 font-medium">{invoice.invoiceData.buyer.name}</td>
        <td className="px-6 py-4 text-gray-700">{invoice.invoiceData.seller.name}</td>
        <td className="px-6 py-4">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 capitalize">
            {invoice.invoiceStatus}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-700">{invoice.invoiceData.dueDate || "—"}</td>
        <td className="px-6 py-4 text-gray-600 text-sm">
          {invoice.invoiceData.invoicePeriod?.startDate || "—"} → {invoice.invoiceData.invoicePeriod?.endDate || "—"}
        </td>
        <td className="px-6 py-4 font-semibold">
          ${invoice.invoiceData.payableAmount.amount}
        </td>
      </tr>
    ))
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar url={url} setToken={setToken} />

        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1 bg-[#f7f7f8]">
            <div className="border-b bg-[#dfeaf7] px-6 py-5">
              <h1 className="text-4xl font-bold uppercase tracking-wide text-[#1560b7]">
                Dashboard
              </h1>
            </div>

            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-3xl font-semibold text-[#1f1f1f]">Invoices</h2>
                  <span className="rounded-full bg-[#dbe7fb] px-3 py-0.5 text-base font-medium text-[#4a6fae]">
                    {invoices.length}
                  </span>
                </div>

                <button
                  onClick={() => navigate("/dashboard/create")}
                  className="rounded-lg bg-[#1560b7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f4e98] transition-colors"
                >
                  + New Invoice
                </button>
              </div>

              {/* Filters */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by buyer name..."
                  value={buyerFilter}
                  onChange={(e) => setBuyerFilter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && getInvoices()}
                  className="w-56 rounded-md border bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-[#1560b7]"
                />

                <input
                  type="text"
                  placeholder="Search by seller name..."
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && getInvoices()}
                  className="w-56 rounded-md border bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-[#1560b7]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1560b7]"
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>

                <button
                  onClick={getInvoices}
                  className="rounded-md bg-[#1560b7] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f4e98] transition-colors"
                >
                  Filter
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={() => { clearFilters(); getInvoices() }}
                    className="text-sm text-gray-500 underline hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border bg-white">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#f3f6fb] text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Buyer</th>
                      <th className="px-6 py-3">Seller</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Period</th>
                      <th className="px-6 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>{tableContent}</tbody>
                </table>
              </div>
            </div>
          </main>

          <footer className="flex w-full items-center justify-between border-t bg-[#dfeaf7] px-6 py-4 text-sm text-gray-600">
            <span className="font-semibold text-[#1560b7]">Credit Crew</span>
            <span>
              Support:{" "}
              <a href="mailto:creditcrew.support@gmail.com" className="underline hover:text-[#1560b7]">
                creditcrew.support@gmail.com
              </a>
            </span>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
