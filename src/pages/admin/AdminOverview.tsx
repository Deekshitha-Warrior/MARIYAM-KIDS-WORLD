import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IndianRupee,
  Receipt,
  CreditCard,
  Store,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react'
import { fetchAdminOverview, type AdminOverviewData } from '../../services/branchService'
import {
  DEFAULT_TEXTILE_BRANCH,
  DEFAULT_GROCERY_BRANCH,
  useBranchContextStore,
} from '../../store/branchContextStore'

interface AdminOverviewProps {
  onNavigateTab?: (tab: string) => void
}

export const AdminOverview: React.FC<AdminOverviewProps> = () => {
  const navigate = useNavigate()
  const { enterBranch } = useBranchContextStore()
  const [data, setData] = useState<AdminOverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchAdminOverview()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const textileBranch = data?.branches.find((b) => b.code === 'TEXTILE')
  const groceryBranch = data?.branches.find((b) => b.code === 'GROCERY')

  const handleEnterBranch = (branchId: string, tab: string = 'overview') => {
    enterBranch(branchId)
    if (tab === 'pos' || tab === 'dashboard') {
      navigate(`/dashboard?branch=${branchId}`)
      return
    }
    navigate(`/admin/branches/${branchId}/${tab}`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Business Overview
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Live Aggregation
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated real-time operational metrics across Taj Textiles and Mariyam Kids World.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Consolidated Sales
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            ₹{Number(data?.today_sales || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <TrendingUp size={13} /> Across both active retail branches
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoices Issued
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {Number(data?.today_bills || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Completed POS checkout orders today
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Consolidated Stock Value
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            ₹{(Number(data?.total_inventory_value || 0) / 100000).toFixed(2)}L
          </div>
          <div className="mt-2 text-[11px] text-purple-600 font-medium">
            Retail inventory across 2 locations
          </div>
        </div>
      </div>

      {/* Branch Monitoring Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Operating Branch Nodes
          </h2>
          <span className="text-xs text-slate-400">Autonomous Branch Workspaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TAJ TEXTILES CARD */}
          <div className="p-6 rounded-3xl bg-white border-2 border-blue-200 hover:border-blue-500 transition-all duration-300 shadow-xs hover:shadow-md relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/taj_textiles_logo.png"
                      alt="Taj Textiles"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Taj Textiles</h3>
                    <p className="text-xs text-slate-500">Mohammed ansari</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Operational
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Today Sales</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    ₹{Number(textileBranch?.today_sales || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Bills</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {textileBranch?.today_bills || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Low Stock</div>
                  <div className="text-lg font-black text-amber-600 mt-0.5">
                    {textileBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_TEXTILE_BRANCH.id, 'dashboard')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>Store Dashboard & POS</span>
              </button>
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_TEXTILE_BRANCH.id, 'overview')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <span>Branch Hub</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* MARIYAM KIDS WORLD CARD */}
          <div className="p-6 rounded-3xl bg-white border-2 border-pink-200 hover:border-pink-500 transition-all duration-300 shadow-xs hover:shadow-md relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/mariyam_kids_world_logo.png"
                      alt="Mariyam Kids World"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">MARIYAM KIDS WORLD</h3>
                    <p className="text-xs text-slate-500">AANISHA BANU MOHAMMED ANSARI</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Operational
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-100">
                  <div className="text-[10px] text-pink-700 font-bold uppercase">Today Sales</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    ₹{Number(groceryBranch?.today_sales || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-100">
                  <div className="text-[10px] text-pink-700 font-bold uppercase">Bills</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {groceryBranch?.today_bills || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-100">
                  <div className="text-[10px] text-pink-700 font-bold uppercase">Low Stock</div>
                  <div className="text-lg font-black text-pink-600 mt-0.5">
                    {groceryBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_GROCERY_BRANCH.id, 'dashboard')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>Store Dashboard & POS</span>
              </button>
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_GROCERY_BRANCH.id, 'overview')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <span>Branch Hub</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Required Banner */}
      <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
              Attention Required Across Branches
            </h4>
            <ul className="text-xs text-amber-900/90 mt-1 space-y-0.5 list-disc list-inside font-medium">
              <li>
                <strong className="text-blue-900 font-bold">Taj Textiles:</strong>{' '}
                {textileBranch?.low_stock_count || 0} items are below minimum low stock threshold.
              </li>
              <li>
                <strong className="text-pink-900 font-bold">Mariyam Kids World:</strong>{' '}
                {groceryBranch?.low_stock_count || 0} items require replenishment.
              </li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/inventory')}
          className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100/60 transition-colors cursor-pointer shadow-xs"
        >
          View Consolidated Inventory Alerts
        </button>
      </div>
    </div>
  )
}
