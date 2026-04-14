import { AppSidebar } from "@/components/custom/AppSidebar"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"

interface DashboardProps {
  url: string
  setToken: (token: string | null) => void
}

export default function DashboardPage({ url, setToken }: DashboardProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  // edit later - connect to mongo  
  const invoices: any[] = []

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate])

  let tableContent;
  if (invoices.length === 0) {
    tableContent = (
      <tr>
        <td colSpan={7} className="px-6 py-16 text-center text-lg text-gray-500">
          No invoices yet.
        </td>
      </tr>
    )
  } else {
    tableContent = invoices.map((invoice, index) => (
      <tr key={index} className="border-t">
        <td className="px-6 py-4">{index + 1}</td>
        <td className="px-6 py-4">{invoice.buyerName}</td>
        <td className="px-6 py-4">{invoice.sellerName}</td>
        <td className="px-6 py-4">{invoice.status}</td>
        <td className="px-6 py-4">{invoice.dueDate}</td>
        <td className="px-6 py-4">
          {invoice.startDate} - {invoice.endDate}
        </td>
        <td className="px-6 py-4">${invoice.totalAmount}</td>
      </tr>
    ))
  }

  return (
    <SidebarProvider>
      <AppSidebar url={url} setToken={setToken} />

      <main className="min-h-screen w-full bg-[#f7f7f8]">
        <div className="border-b bg-[#dfeaf7] px-6 py-5">
          <h1 className="text-4xl font-bold uppercase tracking-wide text-[#1560b7]">
            Dashboard
          </h1>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-semibold text-[#1f1f1f]">Invoices</h2>
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

          <div className="mb-6 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search with Invoice ID"
              className="w-[260px] rounded-md border bg-white px-4 py-3 text-sm outline-none"
            />

            <button className="rounded-md border bg-white px-4 py-3 text-sm font-medium text-gray-700">
              FILTER
            </button>

            <button className="rounded-md border bg-white px-4 py-3 text-sm text-gray-600">
              Buyer
            </button>

            <button className="rounded-md border bg-white px-4 py-3 text-sm text-gray-600">
              Seller
            </button>

            <button className="rounded-md border bg-white px-4 py-3 text-sm text-gray-600">
              Status
            </button>

            <button className="rounded-md border bg-white px-4 py-3 text-sm text-gray-600">
              Due Date
            </button>

            <button className="rounded-md border bg-white px-4 py-3 text-sm text-gray-600">
              Start
            </button>

            <button className="rounded-md border bg-white px-4 py-3 text-sm text-gray-600">
              End
            </button>
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

              <tbody>
                {tableContent}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}