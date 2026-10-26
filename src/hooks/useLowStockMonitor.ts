import { useEffect, useRef } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAlarmStore, type LowStockItem } from '../store/alarmStore'
import { alarmSound } from '../lib/alarmAudio'
import { useSettingsStore } from '../store/store'

/**
 * @param branch  Only products/variants of this branch raise the alarm ('pos1' | 'pos2').
 *                 Pass null for the admin's all-branches view.
 */
export function useLowStockMonitor(enabled: boolean = true, role?: string | null, branch?: 'pos1' | 'pos2' | null) {
  const setLowStockItems = useAlarmStore((state) => state.setLowStockItems)
  const isCheckingRef = useRef(false)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const branchRef = useRef(branch)
  branchRef.current = branch

  const pos1AlertEnabled = useSettingsStore((s) => s.settingsByBranch['pos1']?.lowStockAlertEnabled)
  const pos2AlertEnabled = useSettingsStore((s) => s.settingsByBranch['pos2']?.lowStockAlertEnabled)

  const checkStockLevels = async (force: boolean = false) => {
    if (!enabled || (isCheckingRef.current && !force)) return
    isCheckingRef.current = true

    try {
      const checkedBranch = branchRef.current
      const settingsByBranch = useSettingsStore.getState().settingsByBranch
      const pos1Enabled = Boolean(settingsByBranch['pos1']?.lowStockAlertEnabled)
      const pos2Enabled = Boolean(settingsByBranch['pos2']?.lowStockAlertEnabled)

      // If low stock alert is disabled for the branch being checked, do NOT sound alarm or popup
      if (checkedBranch === 'pos1' && !pos1Enabled) {
        alarmSound.stopAlert()
        useAlarmStore.setState({ lowStockItems: [], isAlarmActive: false, silencedItemIds: new Set() })
        return
      }
      if (checkedBranch === 'pos2' && !pos2Enabled) {
        alarmSound.stopAlert()
        useAlarmStore.setState({ lowStockItems: [], isAlarmActive: false, silencedItemIds: new Set() })
        return
      }
      if (!checkedBranch && !pos1Enabled && !pos2Enabled) {
        alarmSound.stopAlert()
        useAlarmStore.setState({ lowStockItems: [], isAlarmActive: false, silencedItemIds: new Set() })
        return
      }

      // 1. Fetch non-variant active products (exclude Unregistered)
      let prodQuery = supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_alert, barcode, has_variants, category, category_id, branch')
        .eq('is_active', true)
        .eq('has_variants', false)
      if (checkedBranch) prodQuery = prodQuery.eq('branch', checkedBranch)
      const { data: prods, error: prodErr } = await prodQuery

      if (prodErr) {
        console.warn('Low stock product check warning:', prodErr)
      }

      // 2. Fetch active variants
      let variantQuery = supabase
        .from('product_variants')
        .select('id, variant_name, stock, barcode, product_id, is_active, branch, products(name, category, category_id, is_active, branch, low_stock_alert)')
        .eq('is_active', true)
      if (checkedBranch) variantQuery = variantQuery.eq('branch', checkedBranch)
      const { data: variants, error: varErr } = await variantQuery

      if (varErr) {
        console.warn('Low stock variant check warning:', varErr)
      }

      const flagged: LowStockItem[] = []

      // Check standard products (Only alert for actual inventory running low: 0 < stock <= threshold)
      for (const p of prods || []) {
        if (
          (p.category && p.category.trim().toLowerCase() === 'unregistered') ||
          p.category_id === 4
        ) {
          continue
        }
        // If checking all branches, respect each branch's independent switch
        const pBranch = (p as { branch?: string }).branch
        if (pBranch === 'pos1' && !pos1Enabled) continue
        if (pBranch === 'pos2' && !pos2Enabled) continue

        const threshold = Number(p.low_stock_alert) > 0 ? Number(p.low_stock_alert) : 5
        const currentStock = Number(p.stock_quantity) || 0

        // Alert for products running low or out of stock (currentStock <= threshold)
        if (currentStock <= threshold) {
          flagged.push({
            id: `p-${p.id}`,
            name: p.name,
            stock: currentStock,
            alertThreshold: threshold,
            barcode: p.barcode,
            category: p.category,
          })
        }
      }

      // Check product variants (alert for variants running low or out of stock)
      for (const v of variants || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parentProd = v.products as any
        if (parentProd && parentProd.is_active === false) {
          continue
        }
        if (
          (parentProd?.category && parentProd.category.trim().toLowerCase() === 'unregistered') ||
          parentProd?.category_id === 4
        ) {
          continue
        }
        // If checking all branches, respect each branch's independent switch
        const vBranch = (v as { branch?: string }).branch || parentProd?.branch
        if (vBranch === 'pos1' && !pos1Enabled) continue
        if (vBranch === 'pos2' && !pos2Enabled) continue

        const threshold = Number(parentProd?.low_stock_alert) > 0 ? Number(parentProd.low_stock_alert) : 5
        const currentStock = Number(v.stock) || 0

        if (currentStock <= threshold) {
          flagged.push({
            id: `v-${v.id}`,
            name: parentProd?.name ? `${parentProd.name}` : 'Product Variant',
            variantName: v.variant_name,
            stock: currentStock,
            alertThreshold: threshold,
            barcode: v.barcode,
            category: parentProd?.category,
          })
        }
      }

      // A check that was in flight during logout must not restart the alarm
      if (!enabledRef.current || branchRef.current !== checkedBranch) return
      setLowStockItems(flagged)
    } catch (err) {
      console.warn('Stock monitor error:', err)
    } finally {
      isCheckingRef.current = false
    }
  }

  // React immediately when the low stock alert switches are toggled in Store Settings
  useEffect(() => {
    const isCurrentEnabled = branch === 'pos1'
      ? Boolean(pos1AlertEnabled)
      : branch === 'pos2'
      ? Boolean(pos2AlertEnabled)
      : Boolean(pos1AlertEnabled || pos2AlertEnabled)

    if (!isCurrentEnabled) {
      alarmSound.stopAlert()
      useAlarmStore.setState({ lowStockItems: [], isAlarmActive: false, silencedItemIds: new Set() })
    } else if (enabled) {
      isCheckingRef.current = false
      void checkStockLevels(true)
    }
  }, [pos1AlertEnabled, pos2AlertEnabled, branch, enabled])

  useEffect(() => {
    if (!enabled) {
      // Logged out (or lost staff/admin access): silence any ringing alarm and clear state
      alarmSound.stopAlert()
      useAlarmStore.setState({ lowStockItems: [], isAlarmActive: false, silencedItemIds: new Set() })
      return
    }

    // Immediately unblock and run fresh stock check on login or role switch
    isCheckingRef.current = false
    void checkStockLevels(true)

    // 15-second interval continuous stock monitor
    const interval = setInterval(() => {
      void checkStockLevels()
    }, 15000)

    if (!isSupabaseConfigured) {
      return () => clearInterval(interval)
    }

    // Realtime channel to immediately trigger alarm on stock updates across both Admin and Staff panels
    const realtimeChannel = supabase
      .channel('low-stock-realtime-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void checkStockLevels(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => {
        void checkStockLevels(true)
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      void supabase.removeChannel(realtimeChannel)
    }
  }, [enabled, role, branch])

  // Re-check stock levels when enabled changes from false to true (e.g., on login)
  useEffect(() => {
    if (enabled && !isCheckingRef.current) {
      isCheckingRef.current = false
      void checkStockLevels(true)
    }
  }, [enabled])
}
