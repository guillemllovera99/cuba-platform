import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store'
import { api } from '../../api'
import { useI18n, translate } from '../../i18n'

interface Overview {
  total_orders: number
  total_revenue: number
  total_customers: number
  avg_order_value: number
  orders_by_status: Record<string, number>
}

interface TopProduct {
  product_id: string
  product_name: string
  total_sold: number
  total_revenue: number
}

interface RevenueDay {
  date: string
  orders: number
  revenue: number
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [revenueData, setRevenueData] = useState<RevenueDay[]>([])
  const [accountTypes, setAccountTypes] = useState<Record<string, number>>({})
  const isAdmin = useAuth(s => s.isAdmin())
  const navigate = useNavigate()
  const lang = useI18n(s => s.lang)
  const t = (key: string) => translate(lang, key)

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    api.analyticsOverview().then(setOverview).catch(() => {})
    api.analyticsTopProducts(10).then(setTopProducts).catch(() => {})
    api.analyticsRevenueOverTime(30).then(setRevenueData).catch(() => {})
    api.analyticsAccountTypes().then(setAccountTypes).catch(() => {})
  }, [isAdmin])

  if (!overview) return <p className="text-center py-12 text-gray-500">Loading analytics...</p>

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1)
  const statusColors: Record<string, string> = {
    pending_payment: 'bg-yellow-400',
    paid: 'bg-blue-400',
    processing: 'bg-indigo-400',
    shipped: 'bg-purple-400',
    delivered: 'bg-green-400',
    cancelled: 'bg-red-400',
  }

  const totalStatusOrders = Object.values(overview.orders_by_status).reduce((a, b) => a + b, 0) || 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0B1628]">{t('admin.analytics')}</h1>
        <Link to="/admin" className="text-sm text-gray-500 hover:text-[#0B1628]">&larr; Dashboard</Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600/70">Total Orders</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{overview.total_orders}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600/70">Revenue</p>
          <p className="text-2xl font-bold text-green-700 mt-1">${overview.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600/70">{t('admin.totalCustomers')}</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{overview.total_customers}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm text-amber-600/70">{t('admin.avgOrderValue')}</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">${overview.avg_order_value.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Revenue over time (bar chart) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0B1628] mb-4">{t('admin.revenueOverTime')}</h2>
          {revenueData.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No data yet</p>
          ) : (
            <div className="space-y-1">
              {revenueData.slice(-14).map(d => (
                <div key={d.date} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-gray-500 shrink-0">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-gray-600 font-medium">${d.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0B1628] mb-4">{t('admin.ordersByStatus')}</h2>
          <div className="space-y-3">
            {Object.entries(overview.orders_by_status).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{t(`status.${status}`) || status}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                    style={{ width: `${(count / totalStatusOrders) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="font-semibold text-[#0B1628] mb-4">{t('admin.topProducts')}</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No sales data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Units Sold</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product_id} className="border-b last:border-0">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-800">{p.product_name}</td>
                    <td className="py-2 text-right text-gray-600">{p.total_sold}</td>
                    <td className="py-2 text-right font-semibold text-[#0B1628]">${p.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account types breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-[#0B1628] mb-4">User Account Types</h2>
        <div className="flex gap-4">
          {Object.entries(accountTypes).map(([type, count]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-3 text-center flex-1">
              <p className="text-2xl font-bold text-[#0B1628]">{count}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
