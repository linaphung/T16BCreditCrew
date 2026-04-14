import { AppSidebar } from "@/components/custom/AppSidebar"
import { useEffect } from "react"
import { useNavigate} from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"

interface DashboardProps {
  url: string
  setToken: (token: string | null) => void
}
// page that displays all published hostings
export default function DashboardPage({url, setToken}: DashboardProps) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  useEffect(() => {
    if (!token ) {
      console.log(token)
      navigate('/')
    }
  }, [])

  return (
    <div>
      <SidebarProvider>
        <AppSidebar url={url} setToken={setToken}></AppSidebar>
        <main>dashboard</main>
      </SidebarProvider>
    </div>
  )
}
