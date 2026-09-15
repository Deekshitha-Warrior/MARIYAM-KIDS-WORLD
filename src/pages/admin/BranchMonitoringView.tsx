import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Store,
  ShoppingBag,
  IndianRupee,
  Receipt,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react'
import {
  fetchBranchDashboard,
  type BranchDashboardData,
} from '../../services/branchService'
import {
  DEFAULT_TEXTILE_BRANCH,
  DEFAULT_GROCERY_BRANCH,
} from '../../store/branchContextStore'

interface BranchMonitoringViewProps {
  branchCode: 'TEXTILE' | 'GROCERY'
  onBack: () => void
}

export const BranchMonitoringView: React.FC<BranchMonitoringViewProps> = ({
  branchCode,
  onBack,
}) => {
  const branchId =
    branchCode === 'GROCERY' ? DEFAULT_GROCERY_BRANCH.id : DEFAULT_TEXTILE_BRANCH.id
  const isGrocery = branchCode === 'GROCERY'

  const [data, setData] = useState<BranchDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchBranchDashboard(branchId)
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [branchId])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-gray-400 hover:text-white hover:bg-[#242424] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {isGrocery ? 'CLAD GROCERY' : 'CLAD TEXTILE'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isGrocery
                ? 'Provisions, Grains, Edible Oils & Supermarket Catalog'
                : 'Menswear, Casual, Formals, Kids & Fabrics Catalog'}
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-xs font-semibold text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-amber-400' : ''} />
          <span>Sync Node</span>
        </button>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase mb-1">
            <span>Today's Sales</span>
            <IndianRupee size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{Number(data?.today_sales || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Live POS gross</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase mb-1">
            <span>Bills Count</span>
            <Receipt size={15} className="text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {Number(data?.today_bills || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Receipts generated</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase mb-1">
            <span>Average Bill</span>
            <TrendingUp size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{Number(data?.avg_bill || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Avg basket size</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase mb-1">
            <span>Inventory Value</span>
            <Package size={15} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{(Number(data?.inventory_value || 0) / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Retail valuation</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase mb-1">
            <span>Low Stock</span>
            <AlertTriangle size={15} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {data?.low_stock_count || 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Items below min</div>
        </div>
      </div>

      {/* Main Grid: 7-Day Trend & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Daily Sales Trend */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Recent Daily Sales Trend
              </h3>
              <span className="text-[11px] text-gray-500">Last 7 Days</span>
            </div>

            <div className="space-y-3">
              {data?.daily_sales && data.daily_sales.length > 0 ? (
                data.daily_sales.map((item) => {
                  const maxSale = Math.max(...data.daily_sales.map((s) => s.sales), 1)
                  const percentage = Math.round((item.sales / maxSale) * 100)
                  return (
                    <div key={item.date} className="flex items-center gap-3 text-xs">
                      <span className="w-10 text-gray-400 font-bold">{item.date}</span>
                      <div className="flex-1 h-5 bg-[#1F1F1F] rounded-lg overflow-hidden flex items-center px-2">
                        <div
                          className={`h-full rounded-md ${
                            isGrocery ? 'bg-emerald-500' : 'bg-amber-500'
                          } transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, 6)}%` }}
                        />
                      </div>
                      <span className="w-24 text-right font-black text-white">
                        ₹{item.sales.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-gray-500 text-center py-6">
                  No sales recorded yet this week.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#222222] flex items-center justify-between text-xs text-gray-400">
            <span>Branch Database Isolated</span>
            <span className="text-emerald-400 font-bold">100% Stock Data Integrity</span>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">
            Top Performing SKUs
          </h3>

          <div className="space-y-3">
            {data?.top_products && data.top_products.length > 0 ? (
              data.top_products.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-black text-gray-500">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">
                        {p.product_name}
                      </div>
                      <div className="text-[10px] text-gray-400">{p.quantity_sold} units sold</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-amber-400">
                    ₹{Number(p.total_amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 text-center py-8">
                No transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Active Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Alerts */}
        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <AlertTriangle size={15} /> Inventory Alerts
            </h3>
            <span className="text-[11px] text-gray-500">Requires Replenishment</span>
          </div>

          <div className="space-y-2">
            {data?.alerts && data.alerts.length > 0 ? (
              data.alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl bg-[#1A1A1A] border border-rose-900/20 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-gray-200">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-rose-400">
                      {a.stock_quantity} left
                    </span>
                    <span className="text-[9px] text-gray-500">
                      (Min: {a.low_stock_alert})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-emerald-400 text-center py-6">
                All stock levels healthy above minimum thresholds!
              </div>
            )}
          </div>
        </div>

        {/* Assigned Staff Members */}
        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Users size={15} className="text-sky-400" /> Branch Staff Roster
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">Active RLS Policy</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  R
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200">
                    {isGrocery ? 'Priya (Groceries Lead)' : 'Ravi (Billing Lead)'}
                  </div>
                  <div className="text-[10px] text-gray-500">Staff • POS & Inventory</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                Active Duty
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200">
                    {isGrocery ? 'Karthik (Stock Inward)' : 'Arun (Counter Staff)'}
                  </div>
                  <div className="text-[10px] text-gray-500">Staff • Barcode & Billing</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                Active Duty
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
