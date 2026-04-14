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
    let query = ""

    if (buyerFilter !== "") {
      query += `buyerName=${buyerFilter}&`
    }

    if (sellerFilter !== "") {
      query += `sellerName=${sellerFilter}&`
    }

    if (statusFilter !== "") {
      query += `status=${statusFilter}&`
    }

    try {
      const response = await fetch(`${url}/v2/admin/invoices?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.log(error)
      setInvoices([])
    }
    setLoading(false)
  }

  let tableContent
  if (loading) {
    tableContent = (
      <tr>
        <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
          Loading invoices...
        </td>
      </tr>
    )
  } else if (invoices.length === 0) {
    tableContent = (
      <tr>
        <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
          No invoices yet.
        </td>
      </tr>
    )
  } else {
    tableContent = invoices.map((invoice, index) => (
      <tr
        key={invoice.invoiceId}
        className="cursor-pointer border-t hover:bg-gray-50"
        onClick={() => navigate(`/dashboard/${invoice.invoiceId}`)}
      >
        <td className="px-6 py-4">{index + 1}</td>
        <td className="px-6 py-4">{invoice.invoiceData.buyer.name}</td>
        <td className="px-6 py-4">{invoice.invoiceData.seller.name}</td>
        <td className="px-6 py-4">{invoice.invoiceStatus}</td>
        <td className="px-6 py-4">{invoice.invoiceData.dueDate}</td>
        <td className="px-6 py-4">
          {invoice.invoiceData.invoicePeriod?.startDate || "-"} - {invoice.invoiceData.invoicePeriod?.endDate || "-"}
        </td>
        <td className="px-6 py-4">
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
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-semibold text-[#1f1f1f]">
                    Invoices
                  </h2>
                  <span className="rounded-full bg-[#dbe7fb] px-3 py-1 text-lg font-semibold text-[#4a6fae]">
                    {invoices.length}
                  </span>
                </div>

                <button
                  onClick={() => navigate("/dashboard/create")}
                  className="rounded-lg bg-[#1560b7] px-5 py-3 text-lg font-semibold text-white shadow hover:bg-[#0f4e98]"
                >
                  + New Invoice
                </button>
              </div>

              <div className="mb-6 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search with Invoice ID"
                  value={buyerFilter}
                  onChange={(e) => setBuyerFilter(e.target.value)}
                  className="w-[230px] rounded-md border bg-white px-4 py-3 text-sm outline-none placeholder:text-gray-400"
                />

                <div className="flex items-center overflow-hidden rounded-md border bg-white text-sm text-gray-500">
                  <button
                    onClick={getInvoices}
                    className="px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    FILTER
                  </button>

                  <div className="h-5 w-px bg-gray-300"></div>

                  <button
                    onClick={() => setBuyerFilter("")}
                    className="px-4 py-3 hover:bg-gray-50"
                  >
                    Buyer
                  </button>

                  <div className="h-5 w-px bg-gray-300"></div>

                  <button
                    onClick={() => setSellerFilter("")}
                    className="px-4 py-3 hover:bg-gray-50"
                  >
                    Seller
                  </button>

                  <div className="h-5 w-px bg-gray-300"></div>

                  <button
                    onClick={() => setStatusFilter("draft")}
                    className="px-4 py-3 hover:bg-gray-50"
                  >
                    Status
                  </button>

                  <div className="h-5 w-px bg-gray-300"></div>

                  <button className="px-4 py-3 hover:bg-gray-50">
                    Due Date
                  </button>

                  <div className="h-5 w-px bg-gray-300"></div>

                  <button className="px-4 py-3 hover:bg-gray-50">
                    Start
                  </button>

                  <div className="h-5 w-px bg-gray-300"></div>

                  <button className="px-4 py-3 hover:bg-gray-50">
                    End
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border bg-white">
                <table className="w-full border-collapse">
                  <thead className="bg-[#f3f6fb] text-left text-sm uppercase text-gray-600">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Buyer</th>
                      <th className="px-6 py-4">Seller</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Payment Due Date</th>
                      <th className="px-6 py-4">Time Period</th>
                      <th className="px-6 py-4">Cost</th>
                    </tr>
                  </thead>

                  <tbody>{tableContent}</tbody>
                </table>
              </div>
            </div>
          </main>

          <footer className="flex w-full items-center justify-between border-t bg-[#dfeaf7] px-6 py-4 text-sm text-gray-700">
            <span className="font-medium text-[#1560b7]">Credit Crew</span>
            <span>
              Support & Enquiries:{" "}
              <span className="underline">creditcrew.support@gmail.com</span>
            </span>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
