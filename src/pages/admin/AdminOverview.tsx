import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { fetchAdminOverview, type AdminOverviewData } from '../../services/branchService'
import type { AdminTab } from './AdminLayout'

interface AdminOverviewProps {
  onNavigateTab: (tab: AdminTab) => void
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Business Overview
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Live Aggregation
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Consolidated real-time operational metrics across Textile and Grocery branches.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#222222] transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-amber-400' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Today's Consolidated Sales
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            ₹{Number(data?.today_sales || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp size={13} /> Across all retail branches
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Invoices Issued
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {Number(data?.today_bills || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            Completed POS transactions today
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Today's Store Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            ₹{Number(data?.today_expenses || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            Recorded branch operational payouts
          </div>
        </div>
      </div>

      {/* Branch Monitoring Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Branch Operations Overview
          </h2>
          <span className="text-xs text-gray-500">Autonomous Nodes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TEXTILE CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161616] to-[#121212] border border-[#2A2A2A] hover:border-amber-500/40 transition-all duration-300 shadow-xl relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">CLAD TEXTILE</h3>
                    <p className="text-xs text-gray-400">Apparel, Menswear & Fabrics</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Today Sales</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    ₹{Number(textileBranch?.today_sales || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Bills</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {textileBranch?.today_bills || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Low Stock</div>
                  <div className="text-lg font-black text-amber-400 mt-0.5">
                    {textileBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('branch_textile')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors shadow-md"
            >
              <span>Monitor Textile Branch</span>
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* GROCERY CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161616] to-[#121212] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all duration-300 shadow-xl relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">CLAD GROCERY</h3>
                    <p className="text-xs text-gray-400">Provisions, FMCG & Essentials</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Today Sales</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    ₹{Number(groceryBranch?.today_sales || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Bills</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {groceryBranch?.today_bills || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626]">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Low Stock</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {groceryBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('branch_grocery')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 transition-colors shadow-md"
            >
              <span>Monitor Grocery Branch</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Attention Required Banner */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Attention Required Across Branches
            </h4>
            <ul className="text-xs text-gray-300 mt-1 space-y-0.5 list-disc list-inside">
              <li>
                <strong className="text-amber-200">Textile:</strong>{' '}
                {textileBranch?.low_stock_count || 0} items are below minimum low stock threshold.
              </li>
              <li>
                <strong className="text-emerald-200">Grocery:</strong>{' '}
                {groceryBranch?.low_stock_count || 0} items require re-ordering from suppliers.
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('inventory')}
          className="px-4 py-2 rounded-xl bg-[#1F1F1F] border border-[#333333] text-xs font-bold text-white hover:bg-[#282828] transition-colors"
        >
          View Consolidated Inventory Alerts
        </button>
      </div>
    </div>
  )
}
