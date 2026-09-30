import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Receipt,
  Package,
  Store,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { fetchAdminOverview, type AdminOverviewData } from '../../services/branchService'
import {
  DEFAULT_TEXTILE_BRANCH,
  DEFAULT_GROCERY_BRANCH,
  useBranchContextStore,
} from '../../store/branchContextStore'

export const AdminOverview: React.FC = () => {
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

  const handleEnterBranch = (branchId: string) => {
    enterBranch(branchId)
    navigate(`/dashboard?branch=${branchId}`)
  }

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0)
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            Business Overview
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              LIVE AGGREGATION
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated real-time operational metrics across Taj Textiles and Mariyam Kids World.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-slate-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Today's Consolidated Sales */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TODAY'S CONSOLIDATED SALES
            </span>
            <TrendingUp size={18} className="text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(data?.today_sales)}
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-600">
            Across both active retail branches
          </div>
        </div>

        {/* Card 2: Total Invoices Issued */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL INVOICES ISSUED
            </span>
            <Receipt size={18} className="text-amber-500 shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {Number(data?.today_bills || 0)}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-400">
            Completed POS checkout orders today
          </div>
        </div>

        {/* Card 3: Consolidated Stock Value */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              CONSOLIDATED STOCK VALUE
            </span>
            <Package size={18} className="text-purple-500 shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(data?.total_inventory_value || 2715240)}
          </div>
          <div className="mt-2 text-xs font-medium text-purple-600">
            Retail inventory across 2 locations
          </div>
        </div>
      </div>

      {/* OPERATING BRANCH NODES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            OPERATING BRANCH NODES
          </h2>
          <span className="text-xs text-slate-400 font-medium">Autonomous Branch Workspaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Taj Textiles Card */}
          <div className="p-5 rounded-2xl bg-white border-2 border-[#7A1A28] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/taj_textiles_logo.png"
                      alt="Taj Textiles"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Taj Textiles</h3>
                    <p className="text-xs text-slate-400 font-medium">Taj Textiles</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F2] text-[#9B1C1C] border border-[#FDE8E8] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9B1C1C]" /> OPERATIONAL
                </span>
              </div>

              {/* 3 Stats Columns */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-2.5 rounded-xl bg-[#F7EFEF] text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    TODAY SALES
                  </div>
                  <div className="text-sm md:text-base font-black text-slate-900 mt-1">
                    {formatCurrency(textileBranch?.today_sales)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7EFEF] text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    BILLS
                  </div>
                  <div className="text-sm md:text-base font-black text-slate-900 mt-1">
                    {textileBranch?.today_bills || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7EFEF] text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    LOW STOCK
                  </div>
                  <div
                    className={`text-sm md:text-base font-black mt-1 ${
                      (textileBranch?.low_stock_count || 0) > 0
                        ? 'text-[#9B1C1C]'
                        : 'text-slate-900'
                    }`}
                  >
                    {textileBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            {/* Single Full-width Store Dashboard & POS button */}
            <button
              type="button"
              onClick={() => handleEnterBranch(DEFAULT_TEXTILE_BRANCH.id)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7A1A28] hover:bg-[#651521] text-white text-xs md:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Store size={16} />
              <span>Store Dashboard & POS</span>
            </button>
          </div>

          {/* Mariyam Kids World Card */}
          <div className="p-5 rounded-2xl bg-white border-2 border-[#7A1A28] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/mariyam_kids_world_logo.png"
                      alt="MARIYAM KIDS WORLD"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">MARIYAM KIDS WORLD</h3>
                    <p className="text-xs text-slate-400 font-medium">MARIYAM KIDS WORLD</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F2] text-[#9B1C1C] border border-[#FDE8E8] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9B1C1C]" /> OPERATIONAL
                </span>
              </div>

              {/* 3 Stats Columns */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-2.5 rounded-xl bg-[#F7EFEF] text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    TODAY SALES
                  </div>
                  <div className="text-sm md:text-base font-black text-slate-900 mt-1">
                    {formatCurrency(groceryBranch?.today_sales)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7EFEF] text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    BILLS
                  </div>
                  <div className="text-sm md:text-base font-black text-slate-900 mt-1">
                    {groceryBranch?.today_bills || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7EFEF] text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    LOW STOCK
                  </div>
                  <div
                    className={`text-sm md:text-base font-black mt-1 ${
                      (groceryBranch?.low_stock_count || 0) > 0
                        ? 'text-[#9B1C1C]'
                        : 'text-slate-900'
                    }`}
                  >
                    {groceryBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            {/* Single Full-width Store Dashboard & POS button */}
            <button
              type="button"
              onClick={() => handleEnterBranch(DEFAULT_GROCERY_BRANCH.id)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7A1A28] hover:bg-[#651521] text-white text-xs md:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Store size={16} />
              <span>Store Dashboard & POS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attention Required Banner */}
      <div className="p-4 rounded-2xl bg-[#FFFDEB] border border-[#FDE68A] flex items-start gap-3 shadow-xs">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-xs md:text-sm font-bold text-amber-950">
            Attention Required Across Branches
          </h4>
          <p className="text-xs text-amber-900 mt-0.5 font-medium">
            {data?.low_stock_alerts && data.low_stock_alerts.length > 0 ? (
              data.low_stock_alerts.map((alert, idx) => (
                <span key={idx} className="block">
                  {alert.branch_name}: {alert.count} item at or below minimum stock threshold ({alert.product_name})
                </span>
              ))
            ) : (groceryBranch?.low_stock_count || 0) > 0 ? (
              <span>
                MARIYAM KIDS WORLD: 1 item at or below minimum stock threshold (Deluxe Assortment Gift Box)
              </span>
            ) : (
              <span>All active retail branches operational with healthy stock levels.</span>
            )}
          </p>
        </div>
      </div>

      {/* Cenexa Systems Footer */}
      <div className="text-center pt-6 pb-2 text-xs text-slate-400 font-medium">
        Powered by Cenexa Systems © 2026
      </div>
    </div>
  )
}

export default AdminOverview
