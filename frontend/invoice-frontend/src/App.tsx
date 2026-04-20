import './App.css'
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/Dashboard'
import ViewInvoicePage from './pages/ViewInvoice'
import CreateInvoicePage from './pages/CreateInvoicePage'
import EditInvoicePage from './pages/EditInvoicePage'
import UploadOrderPage from './pages/UploadOrderPage'
import BusinessProfilePage from './pages/BusinessProfile'

const url="http://localhost:3000"
// const url="https://t16bcreditcrew-86oh.onrender.com"
function App() {
  const [, setToken] = useState(localStorage.getItem('token'))

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage/>}></Route>
        <Route path='/login' element={<LoginPage url={url} setToken={setToken}/>}></Route>
        <Route path='/register' element={<RegisterPage url={url} setToken={setToken}/>}></Route>
        <Route path='/dashboard' element={<DashboardPage url={url} setToken={setToken}/>}></Route>
        <Route path="/dashboard/business-profile" element={<BusinessProfilePage url={url} setToken={setToken} />}/>
        <Route path='/dashboard/:invoiceId' element={<ViewInvoicePage url={url} setToken={setToken}/>}></Route>
        <Route path='/dashboard/create' element={<CreateInvoicePage url={url} setToken={setToken}/>}></Route>
        <Route path='/dashboard/upload-order' element={<UploadOrderPage url={url} setToken={setToken}/>}></Route>
        <Route path='/dashboard/:invoiceId/edit' element={<EditInvoicePage url={url} setToken={setToken}/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
