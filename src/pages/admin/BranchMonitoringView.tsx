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
      <div
        className={`p-6 rounded-3xl bg-white border shadow-sm ${
          isGrocery
            ? 'border-pink-200 bg-gradient-to-r from-pink-50/50 via-white to-pink-50/20'
            : 'border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/20'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer mt-1 shadow-xs"
                title="Return"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs shrink-0">
              <img
                src={details.logo}
                alt={currentBranch.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {currentBranch.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isGrocery
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isGrocery ? 'bg-pink-500' : 'bg-blue-600'
                    } animate-pulse`}
                  />
                  {currentBranch.branchType.toUpperCase()} NODE • ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-slate-900 font-bold">{currentBranch.userName}</span> •{' '}
                {currentBranch.phone} • {currentBranch.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw
                size={14}
                className={loading ? (isGrocery ? 'animate-spin text-pink-600' : 'animate-spin text-blue-600') : ''}
              />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Quick Operations Launchpad */}
        {onSelectTab && (
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
              <span>Quick Branch Operations</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('pos')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-white transition-all text-xs font-bold shadow-xs cursor-pointer ${
                  isGrocery ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Receipt size={15} className="shrink-0" />
                <span className="truncate">Open Full POS</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('inventory')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Package size={15} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} />
                <span className="truncate">Stock Control</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('products')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Layers size={15} className="text-emerald-600 shrink-0" />
                <span className="truncate">Categories</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('barcodes')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Barcode size={15} className="text-purple-600 shrink-0" />
                <span className="truncate">Barcodes</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('expenses')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                <FileSpreadsheet size={15} className="text-rose-600 shrink-0" />
                <span className="truncate">Expenses</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('orders')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                <ExternalLink size={15} className="text-sky-600 shrink-0" />
                <span className="truncate">Orders</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Today's Sales</span>
            <IndianRupee size={15} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{Number(data?.today_sales || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Live POS gross</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Bills Count</span>
            <Receipt size={15} className="text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {Number(data?.today_bills || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Receipts generated</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Average Bill</span>
            <TrendingUp size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{Number(data?.avg_bill || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Avg basket size</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Inventory Value</span>
            <Package size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(Number(data?.inventory_value || 0) / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Retail valuation</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Low Stock</span>
            <AlertTriangle size={15} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {data?.low_stock_count || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Items below min</div>
        </div>
      </div>

      {/* Main Grid: 7-Day Trend & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Daily Sales Trend */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Recent Daily Sales Trend
              </h3>
              <span className="text-[11px] text-slate-400">Last 7 Days</span>
            </div>

            <div className="space-y-3">
              {data?.daily_sales && data.daily_sales.length > 0 ? (
                data.daily_sales.map((item) => {
                  const maxSale = Math.max(...data.daily_sales.map((s) => s.sales), 1)
                  const percentage = Math.round((item.sales / maxSale) * 100)
                  return (
                    <div key={item.date} className="flex items-center gap-3 text-xs">
                      <span className="w-10 text-slate-600 font-bold">{item.date}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden flex items-center px-1">
                        <div
                          className={`h-3.5 rounded-md ${
                            isGrocery ? 'bg-pink-500' : 'bg-blue-600'
                          } transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, 6)}%` }}
                        />
                      </div>
                      <span className="w-24 text-right font-black text-slate-900">
                        ₹{item.sales.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">
                  No sales recorded yet this week.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Branch Scoped Node</span>
            <span className="text-emerald-600 font-bold">100% Stock Data Integrity</span>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">
            Top Performing SKUs
          </h3>

          <div className="space-y-3">
            {data?.top_products && data.top_products.length > 0 ? (
              data.top_products.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-black text-slate-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">
                        {p.product_name}
                      </div>
                      <div className="text-[10px] text-slate-500">{p.quantity_sold} units sold</div>
                    </div>
                  </div>
                  <div
                    className={`text-xs font-black ${
                      isGrocery ? 'text-pink-600' : 'text-blue-600'
                    }`}
                  >
                    ₹{Number(p.total_amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">
                No transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Active Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Alerts */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 flex items-center gap-2">
              <AlertTriangle size={15} /> Inventory Alerts
            </h3>
            <span className="text-[11px] text-slate-400">Requires Replenishment</span>
          </div>

          <div className="space-y-2">
            {data?.alerts && data.alerts.length > 0 ? (
              data.alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-rose-950">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-rose-600">
                      {a.stock_quantity} left
                    </span>
                    <span className="text-[9px] text-rose-400">(Min: {a.low_stock_alert})</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-emerald-600 text-center py-6 font-semibold">
                All stock levels healthy above minimum thresholds!
              </div>
            )}
          </div>
        </div>

        {/* Assigned Staff Members */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users size={15} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} /> Branch Staff Roster
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Branch Scoped</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                    isGrocery ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {currentBranch.userName ? currentBranch.userName.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentBranch.userName} (Branch Manager)
                  </div>
                  <div className="text-[10px] text-slate-500">{currentBranch.phone}</div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  isGrocery
                    ? 'bg-pink-50 text-pink-700 border-pink-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                Supervisor
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {isGrocery ? 'Kids World Billing Staff' : 'Textiles Billing Staff'}
                  </div>
                  <div className="text-[10px] text-slate-500">Staff • POS & Inventory</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Duty
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
