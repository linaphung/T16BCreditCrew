
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useState} from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import axios from 'axios';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RegisterPageProps {
  url: string
  setToken: (token: string | null) => void
}

export default function RegisterPage({url, setToken}: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [abn, setAbn] = useState('')
  const [businessName, setBusinnessName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const handleRegisterSubmit = async() => {
    console.log(email, abn, password, confirmPassword, url)
    if (password !== confirmPassword) {
      setError('Password do not match')
      alert(error)
      return
    }
    const bodyObj = {email, password, businessName, abn}
    try {
      const res = await axios.post(`${url}/v1/admin/auth/register`, bodyObj)
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      navigate('/dashboard')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || 'Registration failed')
      } else {
        alert('Registration failed')
      }
      console.log(error)
    }
  }

  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white font-sans" >
      <nav className="flex justify-between items-center px-10 py-4 border-b border-gray-100">
        <span className="text-base hover:bg-gray-200" onClick={() => navigate('/')}>Credit Crew</span>
        <div className="flex gap-2">
        </div>
      </nav>
      <div className="flex items-center justify-center min-h-[calc(100vh-115px)]" style={{
        background: 'linear-gradient(180deg, #ddeeff 0%, #ffffff 100%)'}}>
        <Card className="px-4 w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-blue-900">Credit Crew</CardTitle>
            <CardDescription className="text-sm text-gray-500">Start invoicing today, Register now!</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center">
                    <Label>ABN</Label>
                  </div>
                  <Input id="abn" type="text" required onChange={(e) => setAbn(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center">
                    <Label>Business Name</Label>
                  </div>
                  <Input id="businessName" type="text" required onChange={(e) => setBusinnessName(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input id="password" type={showPassword ? "text" : "password"} required onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center">
                    <Label htmlFor="password">Confirm Password</Label>
                  </div>
                  <Input id="confirm-password" type={showPassword ? "text" : "password"} required onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>
              </div>
              <div className="flex mt-2 justify-center items-center gap-2">
                <Checkbox onCheckedChange={(checked) => setShowPassword(checked === true)}>Show Password</Checkbox>
                <Label htmlFor="showPassword" className="text-sm text-gray-500 font-normal cursor-pointer">
                  Show password
                </Label>
              </div>
            </form>
            <div className="mt-2 text-center">
              <Link to='/login' className="text-blue-800 hover:underline font-medium">Already have an account? Login</Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleRegisterSubmit()} type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white px-4">
              Register
            </Button>
          </CardFooter>
        </Card>
      </div>
        <footer  className="flex justify-center items-center px-10 py-4 border-t border-gray-100">
          <p> Support & Enquiries: creditcrew.support@gmail.com</p>
        </footer>
    </div>
  )
}
