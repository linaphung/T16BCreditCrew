import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { EditInvoicePageProps, InvoiceLine, InvoiceResponse, EditableItem } from "@/types"

export default function EditInvoicePage({ url }: EditInvoicePageProps) {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)

  const [buyerName, setBuyerName] = useState("")
  const [sellerName, setSellerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [items, setItems] = useState<EditableItem[]>([])

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
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log(data)

      if (data.invoiceStatus !== "draft") {
        alert("Only draft invoices can be edited")
        navigate(`/dashboard/${invoiceId}`)
        setLoading(false)
        return
      }

      setInvoice(data)
      setBuyerName(data.invoiceData.buyer.name || "")
      setSellerName(data.invoiceData.seller.name || "")
      setDueDate(data.invoiceData.dueDate || "")
      setStartDate(data.invoiceData.invoicePeriod?.startDate || "")
      setEndDate(data.invoiceData.invoicePeriod?.endDate || "")
      setPaymentTerms(data.invoiceData.paymentTerms || "")
      setItems(
        data.invoiceData.lineItems.map((item: InvoiceLine) => ({
          lineId: item.lineId,
          itemName: item.itemName,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice)
        }))
      )
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  function updateItem(index: number, field: keyof EditableItem, value: string) {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  function addNewItem() {
    setItems([
      ...items,
      {
        lineId: String(items.length + 1),
        itemName: "",
        quantity: "",
        unitPrice: ""
      }
    ])
  }

  function removeItem(index: number) {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  function getLineTotal(quantity: string, unitPrice: string) {
    return (Number(quantity || 0) * Number(unitPrice || 0)).toFixed(2)
  }

  function getTotal() {
    let total = 0

    for (const item of items) {
      total += Number(item.quantity || 0) * Number(item.unitPrice || 0)
    }

    return total.toFixed(2)
  }

  async function handleSaveChanges() {
    if (!token || !invoiceId) return

    const updatedFields = {
      dueDate,
      paymentTerms,
      buyer: {
        name: buyerName
      },
      seller: {
        name: sellerName
      },
      invoicePeriod: {
        startDate,
        endDate
      },
      lineItems: items.map((item, index) => ({
        lineId: item.lineId || String(index + 1),
        itemName: item.itemName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      })),
      payableAmount: {
        currency: invoice?.invoiceData.payableAmount.currency || "AUD",
        amount: Number(getTotal())
      }
    }

    try {
      const res = await fetch(`${url}/v1/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) return

      navigate(`/dashboard/${invoiceId}`)
    } catch (err) {
      console.log(err)
    }
  }

  async function handleDeleteInvoice() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <div className="border-b bg-[#dfeaf7] px-8 py-5">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(`/dashboard/${invoiceId}`)}
            className="text-2xl font-semibold text-[#1560b7]"
          >
            ←
          </button>

          <h1 className="text-4xl font-bold uppercase tracking-wide text-[#1560b7]">
            Edit Invoice
          </h1>
        </div>
      </div>

      <main className="p-8">
        <div className="mb-6">
          <h2 className="text-5xl font-bold text-black">
            INVOICE [{invoice.invoiceId}]
          </h2>
          <p className="mt-2 text-3xl text-gray-700">
            {invoice.invoiceData.buyer.name}
          </p>
        </div>

        <div className="grid grid-cols-[430px_320px_280px] gap-8">
          <div className="rounded-md border-2 border-gray-400 bg-white p-6">
            <div className="flex min-h-[560px] items-center justify-center">
              <div className="w-full">
                <p className="mb-6 text-center text-5xl font-semibold text-gray-700">
                  EXISTING
                  <br />
                  INVOICE
                  <br />
                  DETAILS
                </p>

                <div className="mt-10 space-y-4 text-sm text-gray-700">
                  <p><span className="font-semibold">Buyer:</span> {invoice.invoiceData.buyer.name}</p>
                  <p><span className="font-semibold">Seller:</span> {invoice.invoiceData.seller.name}</p>
                  <p><span className="font-semibold">Issue Date:</span> {invoice.invoiceData.issueDate}</p>
                  <p><span className="font-semibold">Due Date:</span> {invoice.invoiceData.dueDate}</p>
                  <p>
                    <span className="font-semibold">Invoice Period:</span>{" "}
                    {invoice.invoiceData.invoicePeriod?.startDate || "-"} to{" "}
                    {invoice.invoiceData.invoicePeriod?.endDate || "-"}
                  </p>
                  <p><span className="font-semibold">Payment Terms:</span> {invoice.invoiceData.paymentTerms}</p>

                  <div className="pt-2">
                    <p className="mb-2 font-semibold">Items:</p>
                    {invoice.invoiceData.lineItems.map((item) => (
                      <div key={item.lineId} className="mb-2 rounded border border-gray-200 p-2">
                        <p>{item.itemName}</p>
                        <p>
                          Qty: {item.quantity} × ${item.unitPrice}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="pt-2 text-base font-semibold">
                    Total: ${Number(invoice.invoiceData.payableAmount.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-5 text-sm font-semibold text-gray-700">
              *All fields are optional.
            </p>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Buyer Name
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter new buyer"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Seller Name
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Enter new seller"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Due Date [YYYY-MM-DD]
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Enter new due date"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Start Date [YYYY-MM-DD]
                </label>
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Enter new start date"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit End Date [YYYY-MM-DD]
                </label>
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Enter new end date"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Payment Terms
                </label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Enter new payment terms"
                  className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Item Number
            </p>

            <div className="rounded-md border border-gray-300 bg-white p-4">
              {items.map((item, index) => (
                <div key={index} className="mb-5 rounded-md border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Item {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-sm font-semibold text-gray-700"
                    >
                      - [Remove]
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Edit Name
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, "itemName", e.target.value)}
                      placeholder="Enter new name"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Edit Quantity
                    </label>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      placeholder="Enter new quantity"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Edit Price
                    </label>
                    <input
                      type="text"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      placeholder="Enter new price"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <p className="mt-3 text-right text-sm text-gray-500">
                    Line total: ${getLineTotal(item.quantity, item.unitPrice)}
                  </p>
                </div>
              ))}

              <button
                type="button"
                onClick={addNewItem}
                className="text-sm font-semibold text-gray-700"
              >
                + [Add New Item]
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDeleteInvoice}
            className="rounded-md bg-[#d62020] px-6 py-3 font-medium text-white shadow"
          >
            Delete Invoice
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${invoiceId}`)}
              className="rounded-md border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              className="rounded-md bg-[#1560b7] px-6 py-3 font-medium text-white shadow"
            >
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}