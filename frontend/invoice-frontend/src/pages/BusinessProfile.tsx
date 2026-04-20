import { AppSidebar } from "@/components/custom/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { CreateInvoicePageProps } from "@/types"

export default function BusinessProfilePage({ url, setToken }: CreateInvoicePageProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [abn, setAbn] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")

  const [includeAbn, setIncludeAbn] = useState(true)
  const [includeEmail, setIncludeEmail] = useState(true)
  const [includePhoneNumber, setIncludePhoneNumber] = useState(true)
  const [includeAddress, setIncludeAddress] = useState(true)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate("/")
      return
    }
    loadBusinessProfile()
  }, [token, navigate])

  async function loadBusinessProfile() {
    if (!token) return

    setLoading(true)

    try {
      const response = await fetch(`${url}/v1/admin/user/details`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      console.log(data)

      if (!response.ok) {
        setLoading(false)
        return
      }

      setBusinessName(data.businessName || "")
      setEmail(data.email || "")
      setAbn(data.abn || "")

      setPhoneNumber(data.phoneNumber || "")
      setAddress(data.address || "")
      setIncludeAbn(data.includeAbn ?? true)
      setIncludeEmail(data.includeEmail ?? true)
      setIncludePhoneNumber(data.includePhoneNumber ?? true)
      setIncludeAddress(data.includeAddress ?? true)
    } catch (error) {
      console.log(error)
    }

    setLoading(false)
  }

  async function handleSaveProfile() {
    if (!token) return

    setLoading(true)

    try {
      const response = await fetch(`${url}/v1/admin/user/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName,
          email,
          abn,
          phoneNumber,
          address,
          includeAbn,
          includeEmail,
          includePhoneNumber,
          includeAddress
        })
      })

      const data = await response.json()
      console.log(data)

      if (response.ok) {
        alert("Business profile updated")
      } else {
        alert(data.message || "Failed to update business profile")
      }
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
                  Business Profile
                </h1>
              </div>
            </div>

            <div className="p-6">
              <div className="mx-auto max-w-3xl rounded-md border border-gray-300 bg-white p-6">
                <div className="grid gap-5">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      ABN
                    </label>
                    <input
                      type="text"
                      value={abn}
                      onChange={(e) => setAbn(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Business Number
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Business Address
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="mt-8 border-t pt-6">
                  <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Invoice Display Settings
                  </h2>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={includeAbn}
                        onChange={(e) => setIncludeAbn(e.target.checked)}
                      />
                      Include ABN on invoices
                    </label>

                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={includeEmail}
                        onChange={(e) => setIncludeEmail(e.target.checked)}
                      />
                      Include email on invoices
                    </label>

                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={includePhoneNumber}
                        onChange={(e) => setIncludePhoneNumber(e.target.checked)}
                      />
                      Include business number on invoices
                    </label>

                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={includeAddress}
                        onChange={(e) => setIncludeAddress(e.target.checked)}
                      />
                      Include business address on invoices
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="rounded-md border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 shadow-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="rounded-md bg-[#1560b7] px-5 py-3 font-medium text-white shadow"
                  >
                    Save Changes
                  </button>

                  {loading && (
                    <span className="text-sm text-gray-500">
                      Processing...
                    </span>
                  )}
                </div>
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