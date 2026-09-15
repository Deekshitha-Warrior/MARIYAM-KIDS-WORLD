import React from 'react'
import { TrendingUp, IndianRupee, Store, ShoppingBag, ArrowUpRight } from 'lucide-react'

export const CrossBranchSalesView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Cross-Branch Sales Performance
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Comparative sales analytics between CLAD TEXTILE and CLAD GROCERY.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Textile Branch Overview */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store size={20} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">CLAD TEXTILE</h2>
            </div>
            <span className="text-xs text-amber-400 font-bold">58% Share</span>
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
              <span className="font-black text-amber-400">₹340.28</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-gray-400">Gross Margin Estimate</span>
              <span className="font-black text-emerald-400">42.5%</span>
            </div>
          </div>
        </div>

        {/* Grocery Branch Overview */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-400" />
              <h2 className="text-base font-bold text-white">CLAD GROCERY</h2>
            </div>
            <span className="text-xs text-emerald-400 font-bold">42% Share</span>
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
              <span className="font-black text-emerald-400">₹170.25</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-gray-400">Gross Margin Estimate</span>
              <span className="font-black text-emerald-400">22.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
