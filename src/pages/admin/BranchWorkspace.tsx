import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { type Branch } from '../../store/branchContextStore'
import { BranchMonitoringView } from './BranchMonitoringView'
import Pos from '../Pos'
import { InventoryTable } from '../../components/inventory/InventoryTable'
import { CategoryManagerView } from '../../components/inventory/CategoryManagerView'
import { ExpensesView } from '../../components/expenses/ExpensesView'
import AdvanceOrders from '../AdvanceOrders'
import { CreateBarcodeModal } from '../../components/barcode/CreateBarcodeModal'
import { BarcodePrintModal } from '../../components/barcode/BarcodePrintModal'
import { useProductStore } from '../../store/store'
import {
  Barcode,
  Printer,
  Package,
  Layers,
  FileSpreadsheet,
  Receipt,
  ExternalLink,
  Sparkles,
  Info,
  LayoutDashboard,
} from 'lucide-react'

export interface BranchWorkspaceProps {
  branch: Branch
  branchId: string
  tab: string
}

export const BranchWorkspace: React.FC<BranchWorkspaceProps> = ({
  branch,
  branchId,
  tab,
}) => {
  const navigate = useNavigate()
  const { products } = useProductStore()
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  const isGrocery = branch.code.toUpperCase() === 'GROCERY'

  const barcodeProducts = products.map((p) => ({
    id: typeof p.id === 'number' ? p.id : Number(p.id) || 0,
    name: p.name,
    price: p.price,
    cost_price: p.purchasePrice,
    barcode: p.barcode,
    stock_quantity: p.stockQuantity,
    category: p.category,
    has_variants: p.hasVariants,
  }))

  const handleSelectTab = (newTab: string) => {
    navigate(`/admin/branches/${branch.id}/${newTab}`)
  }

  // 1. POS Tab: Redirects to /dashboard with branch context so it contains the operational sidebar
  if (tab === 'pos') {
    return <Navigate to={`/dashboard?branch=${branch.id}`} replace />
  }

  // 2. Inventory Tab
  if (tab === 'inventory') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-xs ${
            isGrocery ? 'border-pink-200' : 'border-blue-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package size={20} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} />
              <span>{branch.name} • Stock & Inventory Management</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stock levels, purchase prices, stock adjustments, and replenishment alarms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/dashboard?branch=${branch.id}`)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isGrocery ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <LayoutDashboard size={14} /> Open Store Dashboard & POS
          </button>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 text-slate-900">
          <InventoryTable />
        </div>
      </div>
    )
  }

  // 3. Products & Categories Tab
  if (tab === 'products') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-xs ${
            isGrocery ? 'border-pink-200' : 'border-blue-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>{branch.name} • Categories & Product Hierarchy</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage product categories, display sort order, and bilingual names (English / Tamil).
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectTab('inventory')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Package size={14} /> View Stock Table
          </button>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 text-slate-900">
          <CategoryManagerView />
        </div>
      </div>
    )
  }

  // 4. Barcodes Tab
  if (tab === 'barcodes') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div
          className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-xs ${
            isGrocery ? 'border-pink-200' : 'border-blue-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Barcode size={20} className="text-purple-600" />
              <span>{branch.name} • Barcode Operations Hub</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate EAN/Code128 barcodes, configure thermal sticker sizes, and print label sheets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-3 shadow-xs">
                <Barcode size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Create & Assign Barcodes</h3>
              <p className="text-xs text-slate-500 mt-1">
                Assign customized or auto-generated 12-digit barcodes to products and variants with stock intake support.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Sparkles size={16} /> Launch Barcode Generator
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                <Printer size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Print Thermal Stickers & Sheets</h3>
              <p className="text-xs text-slate-500 mt-1">
                Print barcode sheets (24, 40, or 65 labels per A4 page) or continuous thermal sticker rolls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Printer size={16} /> Open Print Label Studio
            </button>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isGrocery ? 'bg-pink-50/50 border-pink-200' : 'bg-blue-50/50 border-blue-200'
          }`}
        >
          <Info
            size={18}
            className={`shrink-0 mt-0.5 ${isGrocery ? 'text-pink-600' : 'text-blue-600'}`}
          />
          <div className={`text-xs ${isGrocery ? 'text-pink-900' : 'text-blue-900'}`}>
            <strong>Branch Scoped Barcodes:</strong> Products and variants registered in {branch.name} are mapped to this branch's database node. Scanners on the POS panel automatically recognize these codes.
          </div>
        </div>

        {showBarcodeModal && (
          <CreateBarcodeModal
            isOpen={showBarcodeModal}
            onClose={() => setShowBarcodeModal(false)}
            products={barcodeProducts}
          />
        )}

        {showPrintModal && (
          <BarcodePrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            productName={branch.name}
            barcodeValue="890123456789"
            price={100}
          />
        )}
      </div>
    )
  }

  // 5. Expenses Tab
  if (tab === 'expenses') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-xs ${
            isGrocery ? 'border-pink-200' : 'border-blue-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-rose-600" />
              <span>{branch.name} • Operational Expenses Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track daily shop expenses, petty cash, rent, electricity, staff disbursements, and supplier payouts.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 text-slate-900">
          <ExpensesView />
        </div>
      </div>
    )
  }

  // 6. Orders Tab
  if (tab === 'orders') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-xs ${
            isGrocery ? 'border-pink-200' : 'border-blue-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ExternalLink size={20} className="text-sky-600" />
              <span>{branch.name} • Advance & Custom Orders</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage customer custom orders, advance deposits, delivery tracking, and WhatsApp status updates.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 text-slate-900">
          <AdvanceOrders />
        </div>
      </div>
    )
  }

  // Default: Overview Tab
  return (
    <BranchMonitoringView
      branch={branch}
      branchId={branch.id}
      onSelectTab={handleSelectTab}
    />
  )
}
