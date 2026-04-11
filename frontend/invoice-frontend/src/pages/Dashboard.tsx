import { useEffect } from "react"
import { useNavigate} from "react-router-dom"

// page that displays all published hostings
export default function DashboardPage() {
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
      dashboard
    </div>
  )
}
