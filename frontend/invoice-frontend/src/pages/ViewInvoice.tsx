import { AppSidebar } from "@/components/custom/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { ViewInvoiceProps, InvoiceResponse } from "@/types"

export default function ViewInvoice({ url, setToken }: ViewInvoiceProps) {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate("/")
      return
    }
    getInvoice()
  }, [token, navigate, invoiceId])

  async function getInvoice() {
    if (!token || !invoiceId) return

    setLoading(true)

    try {
      const res = await fetch(`${url}/v1/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        console.log("failed to fetch invoice", res.status)
        setInvoice(null)
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log(data)
      setInvoice(data)
    } catch (err) {
      console.log(err)
      setInvoice(null)
    }
    setLoading(false)
  }

  function formatDate(date: string) {
    if (!date) return "-"
    const parts = date.split("-")
    if (parts.length !== 3) return date
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  function getStatusClass(status: string) {
    if (status === "draft") return "bg-[#ecd2f1] text-[#8b57a0]"
    if (status === "finalised") return "bg-[#d9ebf8] text-[#4c86cb]"
    if (status === "sent") return "bg-[#eef2a9] text-[#7f8600]"
    if (status === "paid") return "bg-[#d5e9c3] text-[#5a8838]"
    if (status === "invalid") return "bg-[#f6d7dc] text-[#d15f69]"
    return "bg-gray-200 text-gray-700"
  }

  async function handleFinalise() {
    if (!token || !invoiceId) return

    try {
      const res = await fetch(`${url}/v1/admin/invoice/finalise/${invoiceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) return

      getInvoice()
    } catch (err) {
      console.log(err)
    }
  }

  async function handleMarkPaid() {
    if (!token || !invoiceId) return

    try {
      const res = await fetch(`${url}/v1/admin/invoice/${invoiceId}/mark-as-paid`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) return

      getInvoice()
    } catch (err) {
      console.log(err)
    }
  }

  async function handleSendInvoice() {
    if (!token || !invoiceId) return

    const email = prompt("Enter recipient email")
    if (!email) return

    try {
      const res = await fetch(`${url}/v1/invoices/send-email/${invoiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) return

      getInvoice()
    } catch (err) {
      console.log(err)
    }
  }

  async function handleExportXML() {
    if (!token || !invoiceId) return

    try {
      const res = await fetch(`${url}/v1/admin/invoice/${invoiceId}/xml`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        console.log(data)
        return
      }

      const xmlText = await res.text()
      const blob = new Blob([xmlText], { type: "application/xml" })
      const fileURL = window.URL.createObjectURL(blob)
      window.open(fileURL, "_blank")
    } catch (err) {
      console.log(err)
    }
  }

  async function handleExportPDF() {
    if (!token || !invoiceId) return
  
    try {
      const res = await fetch(`${url}/v1/admin/invoice/${invoiceId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      if (!res.ok) {
        const data = await res.json()
        console.log(data)
        return
      }
  
      const blob = await res.blob()
      const fileURL = window.URL.createObjectURL(blob)
      window.open(fileURL, "_blank")
    } catch (err) {
      console.log(err)
    }
  }

  function handleEdit() {
    if (!invoiceId) return
    navigate(`/invoice/edit/${invoiceId}`)
  }

  async function handleDelete() {
    if (!token || !invoiceId) return

    try {
      const res = await fetch(`${url}/v1/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) return

      navigate("/dashboard")
    } catch (err) {
      console.log(err)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar url={url} setToken={setToken} />
          <div className="flex flex-1 items-center justify-center bg-[#f7f7f8]">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  if (!invoice) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar url={url} setToken={setToken} />
          <div className="flex flex-1 items-center justify-center bg-[#f7f7f8]">
            <p className="text-gray-500">Invoice not found</p>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  const canEdit = invoice.invoiceStatus === "draft"
  const canFinalise = invoice.invoiceStatus === "draft"
  const canSend = invoice.invoiceStatus === "finalised"
  const canExport =
    invoice.invoiceStatus === "finalised" ||
    invoice.invoiceStatus === "pending" ||
    invoice.invoiceStatus === "paid"
  const canMarkPaid =
    invoice.invoiceStatus === "finalised" ||
    invoice.invoiceStatus === "pending"

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar url={url} setToken={setToken} />

        <div className="flex min-h-screen flex-1 flex-col bg-[#f7f7f8]">
          <main className="flex-1 p-6">
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-2xl font-semibold text-[#1560b7]"
              >
                ←
              </button>

              <h1 className="text-4xl font-bold uppercase tracking-wide text-[#1560b7]">
                Invoice Details
              </h1>
            </div>

            <div className="grid grid-cols-[1fr_300px] gap-8">
              <div className="rounded-[28px] border-2 border-[#7da9db] bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="text-4xl font-bold text-black">
                      Invoice {invoice.invoiceId}
                    </h2>

                    <div className="mt-3 flex items-center gap-3">
                      <p className="text-2xl text-gray-800">
                        {invoice.invoiceData.buyer.name}
                      </p>

                      {invoice.isOverdue && (
                        <span className="rounded-full bg-[#f8d8dc] px-5 py-2 text-sm font-semibold uppercase text-[#cf5d68]">
                          overdue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700">
                    {invoice.invoiceData.payableAmount.currency}
                  </div>
                </div>

                <div className="mb-8 grid grid-cols-4 gap-4">
                  <div className="rounded-[22px] bg-[#edf4fb] p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                      Issue Date
                    </p>
                    <p className="text-gray-800">
                      {formatDate(invoice.invoiceData.issueDate)}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-[#edf4fb] p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                      Invoice Period
                    </p>
                    <p className="text-gray-800">
                      {formatDate(invoice.invoiceData.invoicePeriod?.startDate || "")}
                    </p>
                    <p className="text-gray-800">
                      {formatDate(invoice.invoiceData.invoicePeriod?.endDate || "")}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-[#edf4fb] p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                      Due Date
                    </p>
                    <p className="text-gray-800">
                      {formatDate(invoice.invoiceData.dueDate)}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-[#edf4fb] p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                      Total Amount
                    </p>
                    <p className="text-gray-800">
                      ${Number(invoice.invoiceData.payableAmount.amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-8 border-y border-gray-200 py-6">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                      Seller
                    </p>
                    <p className="text-gray-800">
                      {invoice.invoiceData.seller.name}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                      Buyer
                    </p>
                    <p className="text-gray-800">
                      {invoice.invoiceData.buyer.name}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                    Items
                  </p>
                </div>

                <div className="border-b border-gray-300 pb-3 text-sm font-semibold text-gray-700">
                  <div className="grid grid-cols-4">
                    <p>ITEM NAME</p>
                    <p>QUANTITY</p>
                    <p>UNIT PRICE</p>
                    <p>AMOUNT</p>
                  </div>
                </div>

                <div className="mb-6">
                  {invoice.invoiceData.lineItems.map((item) => (
                    <div
                      key={item.lineId}
                      className="grid grid-cols-4 border-b border-gray-200 py-4 text-sm text-gray-700"
                    >
                      <p>{item.itemName}</p>
                      <p>{item.quantity}</p>
                      <p>${Number(item.unitPrice).toFixed(2)}</p>
                      <p>${(item.quantity * item.unitPrice).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-8 text-right">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#4c86cb]">
                    Total Due
                  </p>
                  <p className="text-3xl font-bold text-black">
                    ${Number(invoice.invoiceData.payableAmount.amount).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#edf4fb] px-6 py-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                    Payment Terms
                  </p>
                  <p className="text-gray-800">
                    {invoice.invoiceData.paymentTerms || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[24px] border-2 border-[#7da9db] bg-white p-6 shadow-sm">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                    Status
                  </p>

                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-sm text-gray-700">Status:</span>
                    <span
                      className={`rounded-full px-5 py-2 text-sm font-semibold uppercase ${getStatusClass(
                        invoice.invoiceStatus
                      )}`}
                    >
                      {invoice.invoiceStatus}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700">
                    Created on: {formatDate(invoice.invoiceData.issueDate)}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    Due date: {formatDate(invoice.invoiceData.dueDate)}
                  </p>
                </div>

                <div className="rounded-[24px] border-2 border-[#7da9db] bg-white p-6 shadow-sm">
                  <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-[#4c86cb]">
                    Actions
                  </p>

                  <div className="mb-5">
                    <p className="mb-2 text-sm font-medium text-gray-700">Send</p>
                    <button
                      onClick={handleSendInvoice}
                      disabled={!canSend}
                      className={`w-full rounded-md px-4 py-3 font-medium ${
                        canSend
                          ? "bg-[#1560b7] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      Send Invoice
                    </button>
                  </div>

                  <div className="mb-5">
                    <p className="mb-2 text-sm font-medium text-gray-700">Export</p>
                    <button
                      onClick={handleExportPDF}
                      disabled={!canExport}
                      className={`mb-3 w-full rounded-md px-4 py-3 font-medium ${
                        canExport
                          ? "bg-[#1560b7] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      Export PDF
                    </button>

                    <button
                      onClick={handleExportXML}
                      disabled={!canExport}
                      className={`w-full rounded-md px-4 py-3 font-medium ${
                        canExport
                          ? "bg-[#1560b7] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      Export XML
                    </button>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Manage</p>

                    <button
                      onClick={handleFinalise}
                      disabled={!canFinalise}
                      className={`mb-3 w-full rounded-md px-4 py-3 font-medium ${
                        canFinalise
                          ? "bg-[#1560b7] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      Finalise Invoice
                    </button>

                    <button
                      onClick={handleMarkPaid}
                      disabled={!canMarkPaid}
                      className={`mb-3 w-full rounded-md px-4 py-3 font-medium ${
                        canMarkPaid
                          ? "bg-[#1560b7] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      Mark as Paid
                    </button>

                    <button
                      onClick={handleEdit}
                      disabled={!canEdit}
                      className={`mb-3 w-full rounded-md px-4 py-3 font-medium ${
                        canEdit
                          ? "bg-[#1560b7] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      Edit
                    </button>

                    <button
                      onClick={handleDelete}
                      className="w-full rounded-md bg-[#d9534f] px-4 py-3 font-medium text-white"
                    >
                      Delete Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}