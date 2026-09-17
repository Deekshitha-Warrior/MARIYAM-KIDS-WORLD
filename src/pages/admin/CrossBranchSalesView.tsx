import React from 'react'
import { TrendingUp, IndianRupee, Store, ShoppingBag, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH } from '../../store/branchContextStore'

export const CrossBranchSalesView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Cross-Branch Sales Performance
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Comparative sales analytics between Taj Textiles and Mariyam Kids World.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Taj Textiles Overview */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-blue-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 p-1 flex items-center justify-center">
                  <img src="/taj_textiles_logo.png" alt="Taj Textiles" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Taj Textiles</h2>
                  <p className="text-[11px] text-gray-400">Mohammed ansari • White & Blue</p>
                </div>
              </div>
              <span className="text-xs text-blue-400 font-bold px-2 py-0.5 rounded-full bg-blue-950/50 border border-blue-800/40">58% Share</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-[#222222]">
                <span className="text-gray-400">Total Revenue (MTD)</span>
                <span className="font-black text-white">₹11,84,200</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-[#222222]">
                <span className="text-gray-400">Transactions Count</span>
                <span className="font-black text-white">3,480 Bills</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-[#222222]">
                <span className="text-gray-400">Average Basket Value</span>
                <span className="font-black text-blue-400">₹340.28</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2">
                <span className="text-gray-400">Gross Margin Estimate</span>
                <span className="font-black text-emerald-400">42.5%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#222222]">
            <Link
              to={`/admin/branches/${DEFAULT_TEXTILE_BRANCH.id}/overview`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <span>View Branch Workspace</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Mariyam Kids World Overview */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-pink-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 p-1 flex items-center justify-center">
                  <img src="/mariyam_kids_world_logo.png" alt="Mariyam Kids World" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">MARIYAM KIDS WORLD</h2>
                  <p className="text-[11px] text-gray-400">AANISHA BANU • White & Pink</p>
                </div>
              </div>
              <span className="text-xs text-pink-400 font-bold px-2 py-0.5 rounded-full bg-pink-950/50 border border-pink-800/40">42% Share</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-[#222222]">
                <span className="text-gray-400">Total Revenue (MTD)</span>
                <span className="font-black text-white">₹8,56,400</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-[#222222]">
                <span className="text-gray-400">Transactions Count</span>
                <span className="font-black text-white">5,030 Bills</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-[#222222]">
                <span className="text-gray-400">Average Basket Value</span>
                <span className="font-black text-pink-400">₹170.25</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2">
                <span className="text-gray-400">Gross Margin Estimate</span>
                <span className="font-black text-emerald-400">22.8%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#222222]">
            <Link
              to={`/admin/branches/${DEFAULT_GROCERY_BRANCH.id}/overview`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <span>View Branch Workspace</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
