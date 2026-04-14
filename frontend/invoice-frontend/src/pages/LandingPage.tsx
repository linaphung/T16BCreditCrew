import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { FileText, CheckCircle, Mail, Download } from 'lucide-react'
 
export default function LandingPage() {
  const navigate = useNavigate()
 
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="flex justify-between items-center px-10 py-4 border-b border-blue-100">
        <div className="hover:bg-blue-50 px-1">
          <span className="text-base text-blue-900 font-semibold italic ">Ezy Invoicing</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={"outline"} 
            className="px-4"
            onClick={() => navigate('/login')}>
              Login
            </Button>
          <Button 
            className="bg-blue-900 hover:bg-blue-800 text-white px-4" 
            onClick={() => navigate('/register')}>
              Register
            </Button>
        </div>
      </nav>
      <section className="text-center px-10 py-16" style={{
        background: 'linear-gradient(180deg, #ddeeff 0%, #ffffff 100%)',
      }}>
        <div className="inline-block border border-blue-800 px-4 py-1 rounded-lg mb-2 hover:bg-gray-200">
          <p className="text-base text-blue-900">• UBL 2.1 compliant invoicing</p>
        </div>
        <h1 className="text-6xl font-semibold text-blue-900 mb-4">Invoicing made simple</h1>
        <p className="text-base text-grey-600 mb-4 mx-auto">
          Create, validate, manage and send invoices — everything your business needs, in one place.
        </p>
        <Button 
          className="bg-blue-900 hover:bg-blue-800 text-white px-4"
          onClick={() => navigate('/register')}>
          Get Started for free
        </Button>
      </section>
      <section className="px-10 py-4 mb-4">
        <h2 className="text-lg font-medium text-blue-900 uppercase tracking-widest mb-6">features</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-300 rounded-xl p-5 hover:border-blue-900 hover:shadow-lg transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 mb-4 flex items-center justify-center">
              <FileText></FileText>
            </div>
            <h3 className="text-md font-medium text-blue-900 mb-2">
              Invoice Generation
            </h3>
            <p>
              Create UBL 2.1 XML invoices from JSON or XML order documents in seconds.
            </p>
          </div>
          <div className="bg-white border border-gray-300 rounded-xl p-5 hover:border-blue-900 hover:shadow-lg transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 mb-4 flex items-center justify-center">
              <CheckCircle></CheckCircle>
            </div>
            <h3 className="text-md font-medium text-blue-900 mb-2">
              Validation & management
            </h3>
            <p>
              Validate invoices against the UBL 2.1 XSD schema and manage their full lifecycle.
            </p>
          </div>
          <div className="bg-white border border-gray-300 rounded-xl p-5 hover:border-blue-900 hover:shadow-lg transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 mb-4 flex items-center justify-center">
              <Mail></Mail>
            </div>
            <h3 className="text-md font-medium text-blue-900 mb-2">
              Email Delivery
            </h3>
            <p>
              Send finalised invoices directly to clients as XML attachments with one click.
            </p>
          </div>
          <div className="bg-white border border-gray-300 rounded-xl p-5 hover:border-blue-900 hover:shadow-lg transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 mb-4 flex items-center justify-center">
              <Download></Download>
            </div>
            <h3 className="text-md font-medium text-blue-900 mb-2">
              Export
            </h3>
            <p>
              Download your finalised invoices as UBL XML files, ready for any accounting system.
            </p>
          </div>
        </div>
      </section>
      <section className="px-10 bg-blue-50 py-4">
        <h2 className="text-lg font-medium text-blue-900 uppercase tracking-widest mb-6">HOW TO GET STARTED</h2>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4 flex items-center justify-center">
            <h2 className="text-md font-medium">1</h2>
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-900 mb-1">Register your business</h3>
            <p>Sign up with your business name and ABN. Free to get started.</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4 flex items-center justify-center">
            <h2 className="text-md font-medium">2</h2>
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-900 mb-1">Create and finalise invoices</h3>
            <p>Add your order details and generate a valid UBL XML invoice.</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4 flex items-center justify-center">
            <h2 className="text-md font-medium">3</h2>
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-900 mb-1">Send and track</h3>
            <p>Email invoices to clients and get automatically notified of overdue payments.</p>
          </div>
        </div>
      </section>
      <footer  className="flex justify-center items-center px-10 py-4 border-t border-gray-100">
        <p> Support & Enquiries: creditcrew.support@gmail.com</p>
      </footer>
    </div>
  )
}