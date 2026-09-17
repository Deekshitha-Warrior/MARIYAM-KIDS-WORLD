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
    navigate(`/admin/branches/${branchId}/${tab}`)
  }

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
            Consolidated real-time operational metrics across Taj Textiles and Mariyam Kids World.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Consolidated Stock Value
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            ₹{(Number(data?.total_inventory_value || 0) / 100000).toFixed(2)}L
          </div>
          <div className="mt-2 text-[11px] text-purple-400 font-medium">
            Retail inventory across 2 locations
          </div>
        </div>
      </div>

      {/* Branch Monitoring Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Operating Branch Nodes
          </h2>
          <span className="text-xs text-gray-500">Autonomous Branch Workspaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TAJ TEXTILES CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161616] to-[#121212] border border-[#2A2A2A] hover:border-blue-500/40 transition-all duration-300 shadow-xl relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 p-1 flex items-center justify-center">
                    <img
                      src="/taj_textiles_logo.png"
                      alt="Taj Textiles"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Taj Textiles</h3>
                    <p className="text-xs text-gray-400">Mohammed ansari • White & Blue Theme</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Operational
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

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_TEXTILE_BRANCH.id, 'pos')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Receipt size={14} />
                <span>Launch POS</span>
              </button>
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_TEXTILE_BRANCH.id, 'overview')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#222] hover:bg-[#282828] border border-[#333] text-gray-200 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Branch Hub</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* MARIYAM KIDS WORLD CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161616] to-[#121212] border border-[#2A2A2A] hover:border-pink-500/40 transition-all duration-300 shadow-xl relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 p-1 flex items-center justify-center">
                    <img
                      src="/mariyam_kids_world_logo.png"
                      alt="Mariyam Kids World"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">MARIYAM KIDS WORLD</h3>
                    <p className="text-xs text-gray-400">AANISHA BANU • White & Pink Theme</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-950/60 text-pink-300 border border-pink-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Operational
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
                  <div className="text-lg font-black text-pink-400 mt-0.5">
                    {groceryBranch?.low_stock_count || 0} items
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_GROCERY_BRANCH.id, 'pos')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Receipt size={14} />
                <span>Launch POS</span>
              </button>
              <button
                type="button"
                onClick={() => handleEnterBranch(DEFAULT_GROCERY_BRANCH.id, 'overview')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#222] hover:bg-[#282828] border border-[#333] text-gray-200 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Branch Hub</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
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
                <strong className="text-blue-300">Taj Textiles:</strong>{' '}
                {textileBranch?.low_stock_count || 0} items are below minimum low stock threshold.
              </li>
              <li>
                <strong className="text-pink-300">Mariyam Kids World:</strong>{' '}
                {groceryBranch?.low_stock_count || 0} items require re-ordering from suppliers.
              </li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/inventory')}
          className="px-4 py-2 rounded-xl bg-[#1F1F1F] border border-[#333333] text-xs font-bold text-white hover:bg-[#282828] transition-colors cursor-pointer"
        >
          View Consolidated Inventory Alerts
        </button>
      </div>
    </div>
  )
}
