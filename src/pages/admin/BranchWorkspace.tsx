import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Branch } from '../../store/branchContextStore'
import { BranchMonitoringView } from './BranchMonitoringView'
import Pos from '../Pos'
import { InventoryTable } from '../../components/inventory/InventoryTable'
import { CategoryManagerView } from '../../components/inventory/CategoryManagerView'
import { ExpensesView } from '../../components/expenses/ExpensesView'
import AdvanceOrders from '../AdvanceOrders'
import { CreateBarcodeModal } from '../../components/barcode/CreateBarcodeModal'
import { BarcodePrintModal } from '../../components/barcode/BarcodePrintModal'
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
} from 'lucide-react'
import { useProductStore } from '../../store/store'

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

  // 1. POS Tab
  if (tab === 'pos') {
    return (
      <div className="h-full flex flex-col bg-[#FAFAFA] rounded-2xl overflow-hidden border border-[#2B2B2B]">
        <Pos accessMode="admin" branchId={branch.id} isEmbedded={false} />
      </div>
    )
  }

  // 2. Inventory Tab
  if (tab === 'inventory') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-[#141414] border border-[#262626] p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Package size={20} className="text-blue-400" />
              <span>{branch.name} • Stock & Inventory Management</span>
            </h2>
            <p className="text-xs text-gray-400">
              Live stock levels, purchase prices, stock adjustments, and replenishment alarms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectTab('pos')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
          >
            <Receipt size={14} /> Open POS
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-900">
          <InventoryTable />
        </div>
      </div>
    )
  }

  // 3. Products & Categories Tab
  if (tab === 'products') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-[#141414] border border-[#262626] p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Layers size={20} className="text-emerald-400" />
              <span>{branch.name} • Categories & Product Hierarchy</span>
            </h2>
            <p className="text-xs text-gray-400">
              Manage product categories, display sort order, and bilingual names (English / Tamil).
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectTab('inventory')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#222] text-gray-200 border border-[#333] text-xs font-bold hover:bg-[#282828] transition-all cursor-pointer"
          >
            <Package size={14} /> View Stock Table
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-900">
          <CategoryManagerView />
        </div>
      </div>
    )
  }

  // 4. Barcodes Tab
  if (tab === 'barcodes') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between bg-[#141414] border border-[#262626] p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Barcode size={20} className="text-purple-400" />
              <span>{branch.name} • Barcode Operations Hub</span>
            </h2>
            <p className="text-xs text-gray-400">
              Generate EAN/Code128 barcodes, configure thermal sticker sizes, and print label sheets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Barcode size={22} />
              </div>
              <h3 className="text-base font-bold text-white">Create & Assign Barcodes</h3>
              <p className="text-xs text-gray-400 mt-1">
                Assign customized or auto-generated 12-digit barcodes to products and variants. Also supports stock intake increment during barcode assignment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Sparkles size={16} /> Launch Barcode Generator
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-[#141414] border border-[#262626] flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Printer size={22} />
              </div>
              <h3 className="text-base font-bold text-white">Print Thermal Stickers & Sheets</h3>
              <p className="text-xs text-gray-400 mt-1">
                Print barcode sheets (24, 40, or 65 labels per A4 page) or continuous rolls for barcode thermal sticker printers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#222] hover:bg-[#282828] text-white border border-[#333] font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer size={16} /> Open Print Label Studio
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/30 flex items-start gap-3">
          <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300">
            <strong>Branch Scoped Barcodes:</strong> Products and variants registered in {branch.name} will have their barcode tags mapped to this branch's database node. Scanners on the POS panel automatically recognize these codes.
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
        <div className="flex items-center justify-between bg-[#141414] border border-[#262626] p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-rose-400" />
              <span>{branch.name} • Operational Expenses Ledger</span>
            </h2>
            <p className="text-xs text-gray-400">
              Track daily shop expenses, petty cash, rent, electricity, staff disbursements, and supplier payouts.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-900">
          <ExpensesView />
        </div>
      </div>
    )
  }

  // 6. Orders Tab
  if (tab === 'orders') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-[#141414] border border-[#262626] p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ExternalLink size={20} className="text-sky-400" />
              <span>{branch.name} • Advance & Custom Orders</span>
            </h2>
            <p className="text-xs text-gray-400">
              Manage customer custom orders, advance deposits, delivery tracking, and WhatsApp status updates.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-900">
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
