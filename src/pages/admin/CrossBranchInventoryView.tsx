import React from 'react'
import { Package, AlertTriangle, Store, ShoppingBag, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH } from '../../store/branchContextStore'

export const CrossBranchInventoryView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Consolidated Inventory & Stock Health
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Cross-branch stock valuation, warehouse reorder alerts, and catalog counts across Taj Textiles and Mariyam Kids World.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Taj Textiles Inventory Card */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 p-1 flex items-center justify-center">
                  <img src="/taj_textiles_logo.png" alt="Taj Textiles" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-base font-bold text-white">Taj Textiles Stock</h2>
              </div>
              <span className="text-xs text-blue-400 font-bold px-2 py-0.5 rounded-full bg-blue-950/50 border border-blue-800/40">Active SKUs</span>
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

          <div className="mt-6 pt-4 border-t border-[#222222]">
            <Link
              to={`/admin/branches/${DEFAULT_TEXTILE_BRANCH.id}/inventory`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-gray-200 text-xs font-bold transition-all"
            >
              <span>Open Stock Control</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Mariyam Kids World Inventory Card */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 p-1 flex items-center justify-center">
                  <img src="/mariyam_kids_world_logo.png" alt="Mariyam Kids World" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-base font-bold text-white">Mariyam Kids World Stock</h2>
              </div>
              <span className="text-xs text-pink-400 font-bold px-2 py-0.5 rounded-full bg-pink-950/50 border border-pink-800/40">Active SKUs</span>
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
                <span className="text-pink-400 font-bold">14</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Out of Stock Items</span>
                <span className="text-rose-400 font-bold">3</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#222222]">
            <Link
              to={`/admin/branches/${DEFAULT_GROCERY_BRANCH.id}/inventory`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-gray-200 text-xs font-bold transition-all"
            >
              <span>Open Stock Control</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
