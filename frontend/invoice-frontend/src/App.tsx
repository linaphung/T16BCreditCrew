import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/Dashboard'
import ViewInvoicePage from './pages/ViewInvoice'
import CreateInvoicePage from './pages/CreateInvoicePage'
import EditInvoicePage from './pages/EditInvoicePage'

const url="t16bcreditcrew-86oh.onrender.com"
function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage/>}></Route>
        <Route path='/login' element={<LoginPage/>}></Route>
        <Route path='/register' element={<RegisterPage/>}></Route>
        <Route path='/dashboard' element={<DashboardPage/>}></Route>
        <Route path='/dashboard/:invoiceId' element={<ViewInvoicePage/>}></Route>
        <Route path='/dashboard/create' element={<CreateInvoicePage/>}></Route>
        <Route path='/dashboard/:invoiceId/edit' element={<EditInvoicePage/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
