/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate} from "react-router-dom"
import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/custom/AppSidebar"

interface EditPageProps {
  url: string,
  setToken: (token: string | null) => void
}

export default function UploadOrderPage({url, setToken}: EditPageProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  useEffect(() => {
    if (!token ) {
      console.log(token)
      navigate('/')
    }
  }, [])
  return (
    <SidebarProvider>
      <AppSidebar url={url} setToken={setToken}></AppSidebar>
      <main>edit invoice</main>
    </SidebarProvider>
  )
}
