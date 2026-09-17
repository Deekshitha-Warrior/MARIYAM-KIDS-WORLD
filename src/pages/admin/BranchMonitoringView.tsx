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
  Barcode,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  ExternalLink,
} from 'lucide-react'
import {
  fetchBranchDashboard,
  type BranchDashboardData,
} from '../../services/branchService'
import {
  useBranchContextStore,
  DEFAULT_TEXTILE_BRANCH,
  type Branch,
} from '../../store/branchContextStore'
import { getBranchBusinessDetails } from '../../lib/brand'

export interface BranchMonitoringViewProps {
  branchCode?: string
  branch?: Branch
  branchId?: string
  onBack?: () => void
  onSelectTab?: (tab: string) => void
}

export const BranchMonitoringView: React.FC<BranchMonitoringViewProps> = ({
  branchCode,
  branch: propBranch,
  branchId: propBranchId,
  onBack,
  onSelectTab,
}) => {
  const { availableBranches, activeBranch } = useBranchContextStore()

  const currentBranch: Branch =
    propBranch ||
    (propBranchId ? availableBranches.find((b) => b.id === propBranchId) : null) ||
    (branchCode
      ? availableBranches.find(
          (b) => b.code.toLowerCase() === branchCode.toLowerCase()
        )
      : null) ||
    activeBranch ||
    DEFAULT_TEXTILE_BRANCH

  const branchId = currentBranch.id
  const isGrocery = currentBranch.code.toUpperCase() === 'GROCERY'
  const details = getBranchBusinessDetails(currentBranch.code)

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
      {/* Header & Branch Overview Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#141414] to-[#1A1A1A] border border-[#2B2B2B] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 rounded-xl bg-[#222] border border-[#333] text-gray-400 hover:text-white hover:bg-[#2c2c2c] transition-colors cursor-pointer mt-1"
                title="Return"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-14 h-14 rounded-2xl bg-[#222] border border-[#333] p-1.5 flex items-center justify-center shadow-inner shrink-0">
              <img
                src={details.logo}
                alt={currentBranch.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {currentBranch.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isGrocery
                      ? 'bg-pink-950/60 text-pink-400 border border-pink-700/50'
                      : 'bg-blue-950/60 text-blue-400 border border-blue-700/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isGrocery ? 'bg-pink-400' : 'bg-blue-400'
                    } animate-pulse`}
                  />
                  {currentBranch.branchType.toUpperCase()} NODE • ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="text-gray-300 font-semibold">{currentBranch.userName}</span> •{' '}
                {currentBranch.phone} • {currentBranch.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#222] border border-[#333] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-amber-400' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Quick Operations Launchpad */}
        {onSelectTab && (
          <div className="mt-6 pt-5 border-t border-[#262626]">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <span>Quick Branch Operations</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('pos')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-bold shadow-sm cursor-pointer"
              >
                <Receipt size={15} className="text-amber-400 shrink-0" />
                <span className="truncate">Open POS</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('inventory')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#202020] border border-[#303030] text-gray-200 hover:bg-[#282828] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                <Package size={15} className="text-blue-400 shrink-0" />
                <span className="truncate">Stock Control</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('products')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#202020] border border-[#303030] text-gray-200 hover:bg-[#282828] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                <Layers size={15} className="text-emerald-400 shrink-0" />
                <span className="truncate">Categories</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('barcodes')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#202020] border border-[#303030] text-gray-200 hover:bg-[#282828] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                <Barcode size={15} className="text-purple-400 shrink-0" />
                <span className="truncate">Barcodes</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('expenses')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#202020] border border-[#303030] text-gray-200 hover:bg-[#282828] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                <FileSpreadsheet size={15} className="text-rose-400 shrink-0" />
                <span className="truncate">Expenses</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('orders')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#202020] border border-[#303030] text-gray-200 hover:bg-[#282828] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                <ExternalLink size={15} className="text-sky-400 shrink-0" />
                <span className="truncate">Orders</span>
              </button>
            </div>
          </div>
        )}
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
                            isGrocery ? 'bg-pink-500' : 'bg-blue-500'
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
            <span>Branch Scoped Node</span>
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
            <span className="text-[11px] text-emerald-400 font-semibold">Branch Scoped</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {currentBranch.userName ? currentBranch.userName.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200">
                    {currentBranch.userName} (Branch Manager)
                  </div>
                  <div className="text-[10px] text-gray-500">{currentBranch.phone}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                Supervisor
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200">
                    {isGrocery ? 'Grocery Counter Staff' : 'Textiles Counter Staff'}
                  </div>
                  <div className="text-[10px] text-gray-500">Staff • POS & Inventory</div>
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
