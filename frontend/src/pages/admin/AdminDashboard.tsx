import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    api.adminStats().then(setStats).catch(() => {})
  }, [isAdmin])

  if (!stats) return <p className="text-center py-12 text-gray-500">Loading...</p>

  const cards = [
    { label: 'Total Orders', value: stats.total_orders, color: 'bg-blue-50 text-blue-700' },
    { label: 'Revenue', value: `$${stats.total_revenue.toFixed(2)}`, color: 'bg-green-50 text-green-700' },
    { label: 'Paid (Pending)', value: stats.paid_orders, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Processing', value: stats.processing_orders, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Shipped', value: stats.shipped_orders, color: 'bg-purple-50 text-purple-700' },
    { label: 'Delivered', value: stats.delivered_orders, color: 'bg-green-50 text-green-700' },
    { label: 'Active Products', value: stats.total_products, color: 'bg-gray-50 text-gray-700' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/admin/products" className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-50 font-medium">
            Manage Products
          </Link>
          <Link to="/admin/orders" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-medium">
            Manage Orders
          </Link>
          <Link to="/admin/shipments" className="bg-[#0B1628] text-white px-4 py-2 rounded text-sm hover:bg-[#0B1628]/90 font-medium">
            Shipments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`rounded-lg p-4 ${c.color}`}>
            <p className="text-sm opacity-75">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
