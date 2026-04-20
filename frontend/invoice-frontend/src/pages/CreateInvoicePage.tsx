import { AppSidebar } from "@/components/custom/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import type { CreateInvoicePageProps, Item, ItemError, ParsedOrderLine } from "@/types"

export default function CreateInvoicePage({ url, setToken }: CreateInvoicePageProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [buyerName, setBuyerName] = useState("")
  const [sellerName, setSellerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<Item[]>([
    { itemName: "", quantity: "", unitPrice: "" }
  ])
  const [itemErrors, setItemErrors] = useState<ItemError[]>([
    { quantity: "", unitPrice: "" }
  ])

  const [dueDateError, setDueDateError] = useState("")
  const [startDateError, setStartDateError] = useState("")
  const [endDateError, setEndDateError] = useState("")
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState("AUD")

  useEffect(() => {
    if (!token) 
      navigate("/")
  }, [token, navigate])
  
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

  function openFilePicker() {
    if (fileInputRef.current) 
      fileInputRef.current.click()
  }

  function addNewItem() {
    const newItem = { itemName: "", quantity: "", unitPrice: "" }
    setItems([...items, newItem])
    setItemErrors([...itemErrors, { quantity: "", unitPrice: "" }])
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      setItems([{ itemName: "", quantity: "", unitPrice: "" }])
      setItemErrors([{ quantity: "", unitPrice: "" }])
      return
    }

    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)

    const newErrors = [...itemErrors]
    newErrors.splice(index, 1)
    setItemErrors(newErrors)
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  function updateQuantity(index: number, value: string) {
    if (!/^\d*$/.test(value)) 
      return
    
    const newItems = [...items]
    newItems[index].quantity = value
    setItems(newItems)
    const newErrors = [...itemErrors]
    if (value === "")
      newErrors[index].quantity = "Quantity is required"
    else
      newErrors[index].quantity = ""
    setItemErrors(newErrors)
  }

  function updatePrice(index: number, value: string) {
    if (!/^\d*\.?\d*$/.test(value)) 
      return

    const newItems = [...items]
    newItems[index].unitPrice = value
    setItems(newItems)

    const newErrors = [...itemErrors]
    if (value === "") 
      newErrors[index].unitPrice = "Price is required"
    else 
      newErrors[index].unitPrice = ""
    setItemErrors(newErrors)
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

  function getTotal() {
    let total = 0
    for (const item of items) {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      total += quantity * unitPrice
    }
    return total.toFixed(2)
  }

  function hasErrors() {
    if (dueDateError || startDateError || endDateError) 
      return true
    for (const error of itemErrors) {
      if (error.quantity || error.unitPrice) 
        return true
    }
    return false
  }

  function makeInvoiceBody() {
    return {
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: toISODate(dueDate),
      currency,
      paymentTerms,
      notes,
      buyer: buyerName,
      seller: sellerName,
      invoicePeriod: {
        startDate: toISODate(startDate),
        endDate: toISODate(endDate)
      },
      orderLines: items.map((item, index) => ({
        lineId: String(index + 1),
        itemName: item.itemName,
        quantity: item.quantity === "" ? 0 : Number(item.quantity),
        unitPrice: item.unitPrice === "" ? 0 : Number(item.unitPrice)
      }))
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file || !token) return

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)

    try {
      const res = await fetch(`${url}/v1/admin/order/parse`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) {
        alert(data.message || "Failed to parse order file")
        setLoading(false)
        return
      }

      setBuyerName(typeof data.buyerName === "string" ? data.buyerName : "")
      setSellerName(typeof data.sellerName === "string" ? data.sellerName : "")
      setPaymentTerms(typeof data.paymentTerms === "string" ? data.paymentTerms : "")
      setNotes(typeof data.notes === "string" ? data.notes : "")

      if (typeof data.dueDate === "string" && data.dueDate) {
        setDueDate(fromISODate(data.dueDate))
        setDueDateError("")
      } else {
        setDueDate("")
      }

      if (typeof data.invoicePeriod?.startDate === "string" && data.invoicePeriod.startDate) {
        setStartDate(fromISODate(data.invoicePeriod.startDate))
        setStartDateError("")
      } else if (typeof data.issueDate === "string" && data.issueDate) {
        setStartDate(fromISODate(data.issueDate))
        setStartDateError("")
      } else {
        setStartDate("")
      }

      if (typeof data.invoicePeriod?.endDate === "string" && data.invoicePeriod.endDate) {
        setEndDate(fromISODate(data.invoicePeriod.endDate))
        setEndDateError("")
      } else if (typeof data.dueDate === "string" && data.dueDate) {
        setEndDate(fromISODate(data.dueDate))
        setEndDateError("")
      } else {
        setEndDate("")
      }

      if (data.orderLines && data.orderLines.length > 0) {
        setItems(
          data.orderLines.map((line: ParsedOrderLine) => ({
            itemName: line.itemName || "",
            quantity: String(line.quantity || ""),
            unitPrice: String(line.unitPrice || "")
          }))
        )

        setItemErrors(
          data.orderLines.map(() => ({
            quantity: "",
            unitPrice: ""
          }))
        )
      } else {
        setItems([{ itemName: "", quantity: "", unitPrice: "" }])
        setItemErrors([{ quantity: "", unitPrice: "" }])
      }
    } catch (err) {
      console.log(err)
    }

    setLoading(false)
  }

  async function handleSaveDraft() {
    if (!token)
      return

    setLoading(true)

    try {
      const response = await fetch(`${url}/v1/admin/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...makeInvoiceBody(),
          isDraft: true
        }),
      })

      const data = await response.json()
      console.log(data)

      if (response.ok) {
        navigate("/dashboard")
      } else {
        alert(data.message || "Failed to save draft")
      }
      } catch (error) {
        console.log(error)
      }

    setLoading(false)
  }

  async function handleCreateInvoice() {
    if (!token) 
      return
  
    if (hasErrors()) {
      alert("Please fix the input errors first")
      return
    }
    setLoading(true)

    try {
      const createResponse = await fetch(`${url}/v1/admin/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...makeInvoiceBody(),
          isDraft: false
        })
      })

      const createData = await createResponse.json()
      console.log(createData)

      if (!createResponse.ok) {
        setLoading(false)
        return
      }

      const invoiceId = createData.result.invoiceId

      const finaliseResponse = await fetch(`${url}/v1/admin/invoice/finalise/${invoiceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const finaliseData = await finaliseResponse.json()
      console.log(finaliseData)

      if (!finaliseResponse.ok) {
        setLoading(false)
        return
      }

      navigate(`/dashboard/${invoiceId}`)
    } catch (error) {
      console.log(error)
    }

    setLoading(false)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar url={url} setToken={setToken} />

        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1 bg-[#f7f7f8]">
            <div className="border-b bg-[#dfeaf7] px-6 py-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-2xl font-semibold text-[#1560b7]"
                >
                  ←
                </button>

                <h1 className="text-4xl font-bold uppercase tracking-wide text-[#1560b7]">
                  Create Invoice
                </h1>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-[320px_260px_1fr] gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Buyer Name
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Enter buyer"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Seller Name
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Enter seller"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
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

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Due Date [DD/MM/YYYY]
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
                      Start Date [DD/MM/YYYY]
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
                      End Date [DD/MM/YYYY]
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
                      Payment Terms
                    </label>
                    <textarea
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Enter payment terms"
                      className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter notes"
                      className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
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
                            className="text-sm text-red-500"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mb-3">
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateItem(index, "itemName", e.target.value)}
                            placeholder="Enter name"
                            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Quantity
                          </label>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, e.target.value)}
                            placeholder="Enter quantity"
                            className={`w-full rounded-md border px-4 py-3 text-sm outline-none ${
                              itemErrors[index]?.quantity
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                          {itemErrors[index]?.quantity && (
                            <p className="mt-1 text-sm text-red-500">
                              {itemErrors[index].quantity}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Price
                          </label>
                          <input
                            type="text"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(index, e.target.value)}
                            placeholder="Enter price"
                            className={`w-full rounded-md border px-4 py-3 text-sm outline-none ${
                              itemErrors[index]?.unitPrice
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                          {itemErrors[index]?.unitPrice && (
                            <p className="mt-1 text-sm text-red-500">
                              {itemErrors[index].unitPrice}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addNewItem}
                      className="text-sm font-semibold text-[#1560b7]"
                    >
                      + Add New Item
                    </button>
                  </div>
                </div>

                <div>
                  <div className="min-h-[560px] rounded-md border-2 border-gray-400 bg-white p-6">
                    <div className="mb-6 text-center">
                      <h2 className="text-3xl font-bold tracking-wide text-gray-700">
                        INVOICE
                      </h2>
                    </div>

                    <div className="mb-6 flex justify-between text-sm text-gray-700">
                      <div>
                        <p className="font-semibold">Seller</p>
                        <p>{sellerName || "Seller name"}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">Buyer</p>
                        <p>{buyerName || "Buyer name"}</p>
                      </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="font-semibold">Due Date</p>
                        <p>{dueDate || "-"}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Invoice Period</p>
                        <p>
                          {startDate || "-"} to {endDate || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-2 text-sm font-semibold text-gray-700">Payment Terms</p>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {paymentTerms || "No payment terms added."}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-2 text-sm font-semibold text-gray-700">Notes</p>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {notes || "No notes added."}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 text-sm font-semibold text-gray-700">Items</p>

                      <div className="space-y-3">
                        {items.map((item, index) => {
                          const quantity = Number(item.quantity) || 0
                          const unitPrice = Number(item.unitPrice) || 0
                          const lineTotal = quantity * unitPrice

                          return (
                            <div
                              key={index}
                              className="rounded-md border border-gray-200 px-4 py-3 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800">
                                  {item.itemName || `Item ${index + 1}`}
                                </span>
                                <span className="text-gray-600">
                                  {formatMoney(lineTotal)}
                                </span>
                              </div>

                              <div className="mt-1 text-gray-500">
                                Qty: {item.quantity || 0} × {currency} {Number(item.unitPrice || 0).toFixed(2)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="border-t pt-4 text-right">
                      <p className="text-sm font-semibold text-gray-700">Total</p>
                      <p className="text-2xl font-bold text-[#1560b7]">
                        {currency} {getTotal()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,.json,text/xml,application/xml,application/json,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="rounded-md bg-[#1560b7] px-5 py-3 font-medium text-white shadow"
                >
                  Upload Order
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-md border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-md bg-[#4c86cb] px-5 py-3 font-medium text-white shadow"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  className="rounded-md bg-[#1560b7] px-5 py-3 font-medium text-white shadow"
                >
                  Create Invoice
                </button>

                {loading && (
                  <span className="text-sm text-gray-500">
                    Processing...
                  </span>
                )}
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