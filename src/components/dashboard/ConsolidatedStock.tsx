import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { inventoryService } from '../../services/inventoryService'
import type { PosBranch } from '../../store/store'
import { posAccent, branchLabel, branchLogo } from '../../lib/branchTheme'
import { formatCurrency } from '../../lib/retail'
import { BRAND_EN } from '../../lib/brand'
import type { TabKey } from '../../pages/Dashboard'

const BRANCHES: PosBranch[] = ['pos1', 'pos2']

type BranchStock = {
  valuation: number
  inStock: number
  lowStock: number
  outOfStock: number
}

const empty = (): BranchStock => ({ valuation: 0, inStock: 0, lowStock: 0, outOfStock: 0 })

interface ConsolidatedStockProps {
  onNavigate: (tab: TabKey, branch?: PosBranch) => void
}

export default function ConsolidatedStock({ onNavigate }: ConsolidatedStockProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Record<PosBranch, BranchStock>>({ pos1: empty(), pos2: empty() })

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    setLoading(true)
    try {
      const results = await Promise.all(BRANCHES.map(async (branch) => {
        const inventoryItems = await inventoryService.fetchInventoryItems(branch)
        const activeItems = (inventoryItems || []).filter((i) => i.is_active)
        const valuation = activeItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.stock) || 0), 0)
        const outOfStock = activeItems.filter((i) => (Number(i.stock) || 0) <= 0).length
        const lowStock = activeItems.filter((i) => {
          const qty = Number(i.stock) || 0
          const threshold = Number(i.low_stock_threshold) > 0 ? Number(i.low_stock_threshold) : 5
          return qty > 0 && qty <= threshold
        }).length
        const inStock = activeItems.filter((i) => {
          const qty = Number(i.stock) || 0
          const threshold = Number(i.low_stock_threshold) > 0 ? Number(i.low_stock_threshold) : 5
          return qty > threshold
        }).length

        return [branch, { valuation, inStock, lowStock, outOfStock }] as [PosBranch, BranchStock]
      }))

      setData(Object.fromEntries(results) as Record<PosBranch, BranchStock>)
    } catch (err) {
      console.error('[ConsolidatedStock] load error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#1A0E0E]">Consolidated Inventory &amp; Stock Health</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Cross-branch stock valuation, reorder alerts, and catalog counts.</p>
        </div>
        <button onClick={() => void load()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BRANCHES.map((b) => {
          const accent = posAccent(b)
          const s = data[b]
          return (
            <div key={b} className={`bg-white border-2 ${accent.border} rounded-2xl p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${accent.bgLight} p-1.5 flex items-center justify-center`}>
                    <img src={branchLogo(b)} alt={BRAND_EN} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#1A0E0E]">{branchLabel(b)} Stock</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{BRAND_EN} Catalog</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${accent.bgLight} ${accent.text}`}>Active SKUs</span>
              </div>
              <div className={`${accent.bgLight} rounded-xl p-3 mb-3`}>
                <p className="text-[10px] font-black uppercase text-gray-500">Total Stock Valuation</p>
                <p className="text-lg font-black text-[#1A0E0E]">{formatCurrency(s.valuation)}</p>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">In-Stock Items</span>
                  <span className="font-black text-[#1A0E0E]">{s.inStock}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Low Stock Alerts</span>
                  <span className="font-black text-amber-600">{s.lowStock} items</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Out of Stock Items</span>
                  <span className="font-black text-red-600">{s.outOfStock} items</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('inventory', b)}
                className={`w-full py-2.5 rounded-xl text-xs font-black text-white ${accent.bg} hover:opacity-90 cursor-pointer`}
              >
                Open Stock Control
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
