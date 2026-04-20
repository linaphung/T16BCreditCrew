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
import { LayoutDashboard, FilePlus, LogOut, Building2 } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

interface AppSideBarProps {
  url: string
  setToken: (token: string | null) => void
}
 
export function AppSidebar({setToken}: AppSideBarProps) {
  const navigate = useNavigate()
  const sideBarItems = [
    {label: "Dashboard", icon: <LayoutDashboard></LayoutDashboard>, navigateTo: '/dashboard'},
    {label: "Business Profile", icon: <Building2 />, navigateTo: "/dashboard/business-profile"},
    {label: "Create Invoice", icon: <FilePlus></FilePlus> ,navigateTo: '/dashboard/create'},
  ]
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem("token")
    setToken(null)
    navigate("/")
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
              <SidebarMenuItem key={i.navigateTo} className={`py-1 ${location.pathname === i.navigateTo ? "bg-blue-50 text-blue-900" : " "}` }>
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