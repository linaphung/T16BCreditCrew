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
  const [dueDateError, setDueDateError] = useState("")
  const [startDateError, setStartDateError] = useState("")
  const [endDateError, setEndDateError] = useState("")
  const [notes, setNotes] = useState("")
  const [currency, setCurrency] = useState("AUD")

  const [sellerAbn, setSellerAbn] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [sellerPhoneNumber, setSellerPhoneNumber] = useState("")
  const [sellerAddress, setSellerAddress] = useState("")

  const [includeAbn, setIncludeAbn] = useState(true)
  const [includeEmail, setIncludeEmail] = useState(true)
  const [includePhoneNumber, setIncludePhoneNumber] = useState(true)
  const [includeAddress, setIncludeAddress] = useState(true)

  async function loadBusinessProfile() {
    if (!token) return

    try {
      const response = await fetch(`${url}/v1/admin/user/details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) return

      setSellerAbn(data.abn || "")
      setSellerEmail(data.email || "")
      setSellerPhoneNumber(data.phoneNumber || "")
      setSellerAddress(data.address || "")
      setIncludeAbn(data.includeAbn ?? true)
      setIncludeEmail(data.includeEmail ?? true)
      setIncludePhoneNumber(data.includePhoneNumber ?? true)
      setIncludeAddress(data.includeAddress ?? true)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/")
      return
    }
    getInvoice()
    loadBusinessProfile()
  }, [token, navigate, invoiceId])

  function formatDateInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8)

    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  function isRealDate(value: string) {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return false

    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])

    const currentYear = new Date().getFullYear()

    if (month < 1 || month > 12) return false
    if (year < 2000 || year > currentYear + 1) return false

    const testDate = new Date(year, month - 1, day)

    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day
    )
  }

  function getDateError(value: string) {
    if (!value) return "Date is required"
    if (value.length < 10) return "Date must be DD/MM/YYYY"
    if (!isRealDate(value)) return "Enter a valid date"
    return ""
  }

  function toISODate(date: string) {
    if (!date) return ""

    const parts = date.split("/")
    if (parts.length !== 3) return ""

    const [day, month, year] = parts
    return `${year}-${month}-${day}`
  }

  function fromISODate(date: string) {
    if (!date) return ""

    const parts = date.split("-")
    if (parts.length !== 3) return ""

    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }

  function updateDueDate(value: string) {
    const formatted = formatDateInput(value)
    setDueDate(formatted)
    setDueDateError(getDateError(formatted))
  }

  function updateStartDate(value: string) {
    const formatted = formatDateInput(value)
    setStartDate(formatted)
    setStartDateError(getDateError(formatted))
  }

  function updateEndDate(value: string) {
    const formatted = formatDateInput(value)
    setEndDate(formatted)
    setEndDateError(getDateError(formatted))
  }

  function formatMoney(amount: number) {
    return `${currency} ${amount.toFixed(2)}`
  }

  async function handleCurrencyChange(newCurrency: string) {
    if (!token || !invoiceId) return
    if (newCurrency === currency) return

    try {
      const res = await fetch(`${url}/v1/invoices/convert-currency/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ to: newCurrency })
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) {
        alert(data.message || "Failed to convert currency")
        return
      }

      setCurrency(data.invoiceData.payableAmount.currency || newCurrency)
      setItems(
        data.invoiceData.lineItems.map((item: InvoiceLine) => ({
          lineId: item.lineId,
          itemName: item.itemName,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice)
        }))
      )
      setInvoice(data)
    } catch (error) {
      console.log(error)
    }
  }

  async function getInvoice() {
    if (!token || !invoiceId) 
      return

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
      setDueDate(data.invoiceData.dueDate ? fromISODate(data.invoiceData.dueDate) : "")
      setStartDate(
        data.invoiceData.invoicePeriod?.startDate
          ? fromISODate(data.invoiceData.invoicePeriod.startDate)
          : ""
      )
      setEndDate(
        data.invoiceData.invoicePeriod?.endDate
          ? fromISODate(data.invoiceData.invoicePeriod.endDate)
          : ""
      )
      setNotes(data.invoiceData.notes || "")
      setCurrency(data.invoiceData.payableAmount.currency || "AUD")
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
    if (!token || !invoiceId) 
      return

    if (dueDateError || startDateError || endDateError) {
      alert("Please fix the date errors first")
      return
    }

    const updatedFields = {
      dueDate: toISODate(dueDate),
      paymentTerms,
      notes,
      buyer: {
        name: buyerName
      },
      seller: {
        name: sellerName
      },
      invoicePeriod: {
        startDate: toISODate(startDate),
        endDate: toISODate(endDate)
      },
      lineItems: items.map((item, index) => ({
        lineId: item.lineId || String(index + 1),
        itemName: item.itemName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      })),
      payableAmount: {
        currency,
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

      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-6">
          <h2 className="text-5xl font-bold text-black">
            INVOICE [{invoice.invoiceId}]
          </h2>
          <p className="mt-2 text-3xl text-gray-700">
            {invoice.invoiceData.buyer.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(340px,380px)_minmax(380px,1fr)_minmax(380px,1fr)]">
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
                  <div>
                    <p><span className="font-semibold">Buyer:</span> {invoice.invoiceData.buyer.name}</p>
                  </div>

                  <div>
                    <p><span className="font-semibold">Seller:</span> {invoice.invoiceData.seller.name}</p>
                    {includeAbn && sellerAbn && <p>ABN: {sellerAbn}</p>}
                    {includeEmail && sellerEmail && <p>{sellerEmail}</p>}
                    {includePhoneNumber && sellerPhoneNumber && <p>{sellerPhoneNumber}</p>}
                    {includeAddress && sellerAddress && (
                      <p className="whitespace-pre-wrap">{sellerAddress}</p>
                    )}
                  </div>

                  <p><span className="font-semibold">Issue Date:</span> {invoice.invoiceData.issueDate ? fromISODate(invoice.invoiceData.issueDate) : "-"}</p>
                  <p><span className="font-semibold">Due Date:</span> {invoice.invoiceData.dueDate ? fromISODate(invoice.invoiceData.dueDate) : "-"}</p>
                  <p>
                    <span className="font-semibold">Invoice Period:</span>{" "}
                    {invoice.invoiceData.invoicePeriod?.startDate ? fromISODate(invoice.invoiceData.invoicePeriod.startDate) : "-"} to{" "}
                    {invoice.invoiceData.invoicePeriod?.endDate ? fromISODate(invoice.invoiceData.invoicePeriod.endDate) : "-"}
                  </p>
                  <p><span className="font-semibold">Payment Terms:</span> {invoice.invoiceData.paymentTerms || "-"}</p>
                  <p><span className="font-semibold">Notes:</span> {invoice.invoiceData.notes || "-"}</p>

                  <div className="pt-2">
                    <p className="mb-2 font-semibold">Items:</p>
                    {invoice.invoiceData.lineItems.map((item) => (
                      <div key={item.lineId} className="mb-2 rounded border border-gray-200 p-2">
                        <p>{item.itemName}</p>
                        <p>
                          Qty: {item.quantity} × {invoice.invoiceData.payableAmount.currency} {Number(item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="pt-2 text-base font-semibold">
                    Total: {invoice.invoiceData.payableAmount.currency} {Number(invoice.invoiceData.payableAmount.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
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
                  Edit Due Date [DD/MM/YYYY]
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => updateDueDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className={`w-full rounded-md border px-4 py-3 text-sm outline-none ${
                    dueDateError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                  }`}
                />
                {dueDateError && (
                  <p className="mt-1 text-sm text-red-500">{dueDateError}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Start Date [DD/MM/YYYY]
                </label>
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => updateStartDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className={`w-full rounded-md border px-4 py-3 text-sm outline-none ${
                    startDateError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                  }`}
                />
                {startDateError && (
                  <p className="mt-1 text-sm text-red-500">{startDateError}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit End Date [DD/MM/YYYY]
                </label>
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => updateEndDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className={`w-full rounded-md border px-4 py-3 text-sm outline-none ${
                    endDateError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                  }`}
                />
                {endDateError && (
                  <p className="mt-1 text-sm text-red-500">{endDateError}</p>
                )}
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

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter new notes"
                  className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Edit Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NZD">NZD</option>
                  <option value="CAD">CAD</option>
                </select>
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
                    Line total: {formatMoney(Number(getLineTotal(item.quantity, item.unitPrice)))}
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