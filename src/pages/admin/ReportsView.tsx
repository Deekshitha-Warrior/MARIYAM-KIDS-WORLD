import React from 'react'
import { FileText, Download, Calendar, ArrowRight } from 'lucide-react'

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Business Reports & Financial Statements
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Generate consolidated financial audits, GST filings, and sales reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Monthly Consolidated Sales</h3>
            <p className="text-xs text-gray-400 mt-1">
              Combined ledger of Textile & Grocery sales, discounts, and payment methods.
            </p>
          </div>
          <button className="mt-5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-xs font-bold text-gray-200 hover:text-white hover:bg-[#222222] transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mb-3">
              <Calendar size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Tax & GST Summary Report</h3>
            <p className="text-xs text-gray-400 mt-1">
              GST breakdown by rate tier (5%, 12%, 18%) for input/output tax reconciliations.
            </p>
          </div>
          <button className="mt-5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-xs font-bold text-gray-200 hover:text-white hover:bg-[#222222] transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Consolidated Inventory Ledger</h3>
            <p className="text-xs text-gray-400 mt-1">
              Current stock counts, retail values, cost values, and estimated margins.
            </p>
          </div>
          <button className="mt-5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-xs font-bold text-gray-200 hover:text-white hover:bg-[#222222] transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
