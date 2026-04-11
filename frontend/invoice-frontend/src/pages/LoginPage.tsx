import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
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
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import axios from "axios"

interface LoginPageProps {
  url: string
  setToken: (token: string | null) => void
}

export default function LoginPage({url, setToken}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  

  const handleLoginSubmit = async() => {
    console.log(email, password,url)
    const bodyObj = {email, password}
    try {
      const res = await axios.post(`${url}/v1/admin/login`, bodyObj)
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      navigate('/dashboard')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || 'Login failed')
      } else {
        alert('Login Failed')
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
        <Card className="px-4 py-8 w-full max-w-md shadow-lg">
          <CardHeader className="text-center ">
            <CardTitle className="text-2xl font-semibold text-blue-900">Credit Crew</CardTitle>
            <CardDescription className="text-sm text-gray-500">Welcome Back, Login into your account!</CardDescription>
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
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input id="password" type={showPassword ? 'text' : 'password'} required onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
            </form>
            <div className="flex mt-4 justify-center items-center gap-2">
              <Checkbox onCheckedChange={(checked) => setShowPassword(checked === true)}>Show Password</Checkbox>
              <Label htmlFor="showPassword" className="text-sm text-gray-500 font-normal cursor-pointer">
                Show password
              </Label>
            </div>
            <div className="mt-4 text-center">
              <Link to='/register' className="text-blue-800 hover:underline font-medium">Don't have an account? Register now</Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white px-4" onClick={() => handleLoginSubmit()}>
              Login
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
