import React from 'react'
import { FileText, Download, Calendar, ArrowRight } from 'lucide-react'

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Business Reports & Financial Statements
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate consolidated financial audits, GST filings, and sales reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 w-fit mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Consolidated Sales</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Combined ledger of Taj Textiles & Mariyam Kids World sales, discounts, and payment methods.
            </p>
          </div>
          <button className="mt-5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 w-fit mb-3">
              <Calendar size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tax & GST Summary Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              GST breakdown by rate tier (5%, 12%, 18%) for input/output tax reconciliations.
            </p>
          </div>
          <button className="mt-5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 w-fit mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Consolidated Inventory Ledger</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Current stock counts, retail values, cost values, and estimated margins.
            </p>
          </div>
          <button className="mt-5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
