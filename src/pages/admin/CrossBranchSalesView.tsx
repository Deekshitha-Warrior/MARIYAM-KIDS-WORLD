import React from 'react'
import { TrendingUp, IndianRupee, Store, ShoppingBag, ArrowUpRight, LayoutDashboard } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DEFAULT_TEXTILE_BRANCH,
  DEFAULT_GROCERY_BRANCH,
  useBranchContextStore,
} from '../../store/branchContextStore'

export const CrossBranchSalesView: React.FC = () => {
  const navigate = useNavigate()
  const { enterBranch } = useBranchContextStore()
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Cross-Branch Sales Performance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comparative sales analytics between Taj Textiles and Mariyam Kids World.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Taj Textiles Overview */}
        <div className="p-6 rounded-3xl bg-white border-2 border-blue-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 p-1 flex items-center justify-center">
                  <img src="/taj_textiles_logo.png" alt="Taj Textiles" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Taj Textiles</h2>
                  <p className="text-[11px] text-slate-500">Mohammed ansari</p>
                </div>
              </div>
              <span className="text-xs text-blue-700 font-bold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">58% Share</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Total Revenue (MTD)</span>
                <span className="font-black text-slate-900">₹11,84,200</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Transactions Count</span>
                <span className="font-black text-slate-900">3,480 Bills</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Average Basket Value</span>
                <span className="font-black text-blue-700">₹340.28</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2">
                <span className="text-slate-500">Gross Margin Estimate</span>
                <span className="font-black text-emerald-600">42.5%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => {
                enterBranch(DEFAULT_TEXTILE_BRANCH.id)
                navigate(`/dashboard?branch=${DEFAULT_TEXTILE_BRANCH.id}`)
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <LayoutDashboard size={14} />
              <span>Store Dashboard</span>
            </button>
            <Link
              to={`/admin/branches/${DEFAULT_TEXTILE_BRANCH.id}/overview`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs"
            >
              <span>Branch Hub</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Mariyam Kids World Overview */}
        <div className="p-6 rounded-3xl bg-white border-2 border-pink-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 p-1 flex items-center justify-center">
                  <img src="/mariyam_kids_world_logo.png" alt="Mariyam Kids World" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">MARIYAM KIDS WORLD</h2>
                  <p className="text-[11px] text-slate-500">AANISHA BANU MOHAMMED ANSARI</p>
                </div>
              </div>
              <span className="text-xs text-pink-700 font-bold px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200">42% Share</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Total Revenue (MTD)</span>
                <span className="font-black text-slate-900">₹8,56,400</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Transactions Count</span>
                <span className="font-black text-slate-900">5,030 Bills</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Average Basket Value</span>
                <span className="font-black text-pink-700">₹170.25</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2">
                <span className="text-slate-500">Gross Margin Estimate</span>
                <span className="font-black text-emerald-600">22.8%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => {
                enterBranch(DEFAULT_GROCERY_BRANCH.id)
                navigate(`/dashboard?branch=${DEFAULT_GROCERY_BRANCH.id}`)
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <LayoutDashboard size={14} />
              <span>Store Dashboard</span>
            </button>
            <Link
              to={`/admin/branches/${DEFAULT_GROCERY_BRANCH.id}/overview`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs"
            >
              <span>Branch Hub</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
