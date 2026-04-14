import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton
} from "@/components/ui/sidebar"
import { LayoutDashboard, FilePlus, Upload, LogOut } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"

interface AppSideBarProps {
  url: string
  setToken: (token: string | null) => void
}
 
export function AppSidebar({url, setToken}: AppSideBarProps) {
  const navigate = useNavigate()
  const sideBarItems = [
    {label: "Dashboard", icon: <LayoutDashboard></LayoutDashboard>, navigateTo: '/dashboard'},
    {label: "Create Invoice", icon: <FilePlus></FilePlus> ,navigateTo: '/dashboard/create'},
    {label: "Upload Order", icon: <Upload></Upload>, navigateTo: '/dashboard/upload-order'},
  ]
  const location = useLocation()

  const handleLogout = async() => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${url}/v1/admin/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
            
      localStorage.removeItem('token')
      setToken(null)
      navigate('/')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || 'Login failed')
      } else {
        alert('Logout Failed')
      }
      console.log(error)
    }
  }
  return (
    <Sidebar>
      <SidebarHeader className="px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-900 text-white rounded-md p-1.5">
            <FilePlus className="w-4 h-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-blue-900">Ezy Invoicing</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup />
          <SidebarMenu>
            {sideBarItems.map(i => (
              <SidebarMenuItem className={`py-1 ${location.pathname === i.navigateTo ? "bg-blue-50 text-blue-900" : " "}` }>
                <SidebarMenuButton onClick={() => navigate(i.navigateTo)}>
                  {i.icon}
                  {i.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => handleLogout()}>
            <LogOut></LogOut>
            Logout
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}