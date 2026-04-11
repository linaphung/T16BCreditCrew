
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useState} from 'react'
import { Checkbox } from "@/components/ui/checkbox"

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


export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [abn, setAbn] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const handleRegisterSubmit = async() => {
    console.log(email, abn, password, confirmPassword)
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
        <Card className="px-4 py-8 w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-blue-900">Credit Crew</CardTitle>
            <CardDescription className="text-sm text-gray-500">Start invoicing today, Register now!</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label>ABN</Label>
                  </div>
                  <Input id="abn" type="text" required onChange={(e) => setAbn(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input id="password" type={showPassword ? "text" : "password"} required onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Confirm Password</Label>
                  </div>
                  <Input id="confirm-password" type={showPassword ? "text" : "password"} required onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>
              </div>
              <div className="flex mt-4 justify-center items-center gap-2">
                <Checkbox onCheckedChange={(checked) => setShowPassword(checked === true)}>Show Password</Checkbox>
                <Label htmlFor="showPassword" className="text-sm text-gray-500 font-normal cursor-pointer">
                  Show password
                </Label>
              </div>
            </form>
            <div className="mt-4 text-center">
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
