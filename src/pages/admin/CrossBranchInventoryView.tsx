import React from 'react'
import { Package, AlertTriangle, Store, ShoppingBag } from 'lucide-react'

export const CrossBranchInventoryView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Consolidated Inventory & Stock Health
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Cross-branch stock valuation, warehouse reorder alerts, and catalog counts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Textile Inventory Card */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store size={20} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">CLAD TEXTILE STOCK</h2>
            </div>
            <span className="text-xs text-amber-400 font-bold">45 SKUs Active</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#262626] mb-4">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Total Stock Valuation</div>
            <div className="text-2xl font-black text-white mt-1">₹8,42,000</div>
          </div>

          <div className="text-xs text-gray-400 space-y-2">
            <div className="flex justify-between py-1 border-b border-[#222222]">
              <span>In-Stock Items</span>
              <span className="text-white font-bold">37</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#222222]">
              <span>Low Stock Alerts</span>
              <span className="text-amber-400 font-bold">8</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Out of Stock Items</span>
              <span className="text-rose-400 font-bold">0</span>
            </div>
          </div>
        </div>

        {/* Grocery Inventory Card */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-400" />
              <h2 className="text-base font-bold text-white">CLAD GROCERY STOCK</h2>
            </div>
            <span className="text-xs text-emerald-400 font-bold">68 SKUs Active</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#262626] mb-4">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Total Stock Valuation</div>
            <div className="text-2xl font-black text-white mt-1">₹5,24,000</div>
          </div>

          <div className="text-xs text-gray-400 space-y-2">
            <div className="flex justify-between py-1 border-b border-[#222222]">
              <span>In-Stock Items</span>
              <span className="text-white font-bold">54</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#222222]">
              <span>Low Stock Alerts</span>
              <span className="text-emerald-400 font-bold">14</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Out of Stock Items</span>
              <span className="text-rose-400 font-bold">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
