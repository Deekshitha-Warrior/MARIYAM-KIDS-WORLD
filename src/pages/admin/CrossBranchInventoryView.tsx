import React from 'react'
import { Package, AlertTriangle, Store, ShoppingBag, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH } from '../../store/branchContextStore'

export const CrossBranchInventoryView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Consolidated Inventory & Stock Health
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cross-branch stock valuation, warehouse reorder alerts, and catalog counts across Taj Textiles and Mariyam Kids World.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Taj Textiles Inventory Card */}
        <div className="p-6 rounded-3xl bg-white border-2 border-blue-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 p-1 flex items-center justify-center">
                  <img src="/taj_textiles_logo.png" alt="Taj Textiles" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Taj Textiles Stock</h2>
                  <p className="text-[11px] text-slate-500">Retail & Apparel Catalog</p>
                </div>
              </div>
              <span className="text-xs text-blue-700 font-bold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">Active SKUs</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 mb-4">
              <div className="text-[10px] text-blue-700 uppercase font-bold">Total Stock Valuation</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹8,42,000</div>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>In-Stock Items</span>
                <span className="text-slate-900 font-bold">37</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Low Stock Alerts</span>
                <span className="text-amber-600 font-bold">8 items</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Out of Stock Items</span>
                <span className="text-rose-600 font-bold">0 items</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to={`/admin/branches/${DEFAULT_TEXTILE_BRANCH.id}/inventory`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Open Stock Control</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Mariyam Kids World Inventory Card */}
        <div className="p-6 rounded-3xl bg-white border-2 border-pink-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 p-1 flex items-center justify-center">
                  <img src="/mariyam_kids_world_logo.png" alt="Mariyam Kids World" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mariyam Kids World Stock</h2>
                  <p className="text-[11px] text-slate-500">Kids World & Clothing Catalog</p>
                </div>
              </div>
              <span className="text-xs text-pink-700 font-bold px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200">Active SKUs</span>
            </div>

            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 mb-4">
              <div className="text-[10px] text-pink-700 uppercase font-bold">Total Stock Valuation</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹5,24,000</div>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>In-Stock Items</span>
                <span className="text-slate-900 font-bold">54</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Low Stock Alerts</span>
                <span className="text-pink-600 font-bold">14 items</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Out of Stock Items</span>
                <span className="text-rose-600 font-bold">3 items</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to={`/admin/branches/${DEFAULT_GROCERY_BRANCH.id}/inventory`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs"
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
