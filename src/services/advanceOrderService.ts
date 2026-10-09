import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { PosBranch } from '../store/store'

export type AdvanceStatus = 'pending_deposit' | 'ready_for_delivery' | 'waiting_final_payment' | 'completed' | 'cancelled'
export type AdvancePaymentMethod = 'cash' | 'upi' | 'card'

export type AdvanceOrder = {
  id: string
  deposit_id: string
  customer_name: string
  phone: string
  address: string
  product_name: string
  products: Array<Record<string, unknown>>
  category: string
  description: string
  total_amount: number
  deposit_amount: number
  remaining_balance: number
  expected_delivery_date: string
  status: AdvanceStatus
  remarks: string
  reference_number: string
  created_by_name: string
  created_at: string
  updated_at: string
  completed_at: string | null
  completed_order_id: string | null
  invoice_number: string | null
  final_payment_method: string | null
  branch: PosBranch
}

export type AdvanceTimeline = { id: number; advance_order_id: string; event_type: string; label: string; remarks: string; created_at: string }
export type AdvancePayment = { id: string; advance_order_id: string; payment_type: 'deposit' | 'remaining'; amount: number; payment_method: string; remarks: string; received_at: string }

const STORAGE_ORDERS_KEY = 'yg_enterprises_advance_orders_v1'
const STORAGE_TIMELINE_KEY = 'yg_enterprises_advance_timeline_v1'
const STORAGE_PAYMENTS_KEY = 'yg_enterprises_advance_payments_v1'

const loadLocalOrders = (): AdvanceOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY)
    return raw ? (JSON.parse(raw) as AdvanceOrder[]) : []
  } catch {
    return []
  }
}

const saveLocalOrders = (orders: AdvanceOrder[]) => {
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders))
  } catch { /* ignore */ }
}

const loadLocalTimeline = (): AdvanceTimeline[] => {
  try {
    const raw = localStorage.getItem(STORAGE_TIMELINE_KEY)
    return raw ? (JSON.parse(raw) as AdvanceTimeline[]) : []
  } catch {
    return []
  }
}

const saveLocalTimeline = (timeline: AdvanceTimeline[]) => {
  try {
    localStorage.setItem(STORAGE_TIMELINE_KEY, JSON.stringify(timeline))
  } catch { /* ignore */ }
}

const loadLocalPayments = (): AdvancePayment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENTS_KEY)
    return raw ? (JSON.parse(raw) as AdvancePayment[]) : []
  } catch {
    return []
  }
}

const saveLocalPayments = (payments: AdvancePayment[]) => {
  try {
    localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments))
  } catch { /* ignore */ }
}

const normalizeOrder = (row: Record<string, unknown>): AdvanceOrder => {
  const totalAmount = Number(row.total_amount || 0)
  const depositAmount = Number(row.deposit_amount || 0)
  const status = String(row.status || 'pending_deposit') as AdvanceStatus
  const calculatedBalance = Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100)

  let remainingBalance: number
  if (status === 'completed' || status === 'cancelled') {
    remainingBalance = 0
  } else {
    const rawBal = row.remaining_balance !== undefined && row.remaining_balance !== null ? Number(row.remaining_balance) : null
    remainingBalance = (rawBal !== null && rawBal > 0) ? rawBal : calculatedBalance
  }

  return {
    ...row,
    id: String(row.id || ''),
    deposit_id: String(row.deposit_id || ''),
    customer_name: String(row.customer_name || ''),
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    product_name: String(row.product_name || ''),
    products: Array.isArray(row.products) ? (row.products as Array<Record<string, unknown>>) : [],
    category: String(row.category || ''),
    description: String(row.description || ''),
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    remaining_balance: remainingBalance,
    expected_delivery_date: String(row.expected_delivery_date || ''),
    status,
    remarks: String(row.remarks || ''),
    reference_number: String(row.reference_number || ''),
    created_by_name: String(row.created_by_name || ''),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
    completed_at: row.completed_at ? String(row.completed_at) : null,
    completed_order_id: row.completed_order_id ? String(row.completed_order_id) : null,
    invoice_number: row.invoice_number ? String(row.invoice_number) : null,
    final_payment_method: row.final_payment_method ? String(row.final_payment_method) : null,
    branch: row.branch === 'pos2' ? 'pos2' : 'pos1',
  }
}

const rpcRow = (data: unknown) => (Array.isArray(data) ? data[0] : data) as Record<string, unknown>

/**
 * Deduct stock when an advance order is registered.
 * Records inventory_movements log and marks items with is_manual: true so complete_advance_order_v2 does not double deduct.
 */
async function deductStockForAdvanceOrder(order: AdvanceOrder): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const branch = order.branch || 'pos1'
    const items = order.products || []
    const updatedProducts: Array<Record<string, unknown>> = []

    for (const rawItem of items) {
      const item = { ...rawItem }
      const qty = Math.max(1, Number(item.quantity) || 1)
      let resolvedProdId = item.product_id ? Number(item.product_id) : null
      const resolvedVariantId = item.variant_id ? String(item.variant_id) : null

      // If product_id not provided, try to match by product name in this branch
      if (!resolvedProdId && item.name) {
        const { data: matched } = await supabase
          .from('products')
          .select('id, name, stock_quantity')
          .ilike('name', String(item.name).trim())
          .eq('branch', branch)
          .maybeSingle()
        if (matched) {
          resolvedProdId = Number(matched.id)
        }
      }

      if (resolvedVariantId) {
        const { data: varRow } = await supabase
          .from('product_variants')
          .select('id, product_id, stock')
          .eq('id', resolvedVariantId)
          .eq('branch', branch)
          .maybeSingle()

        if (varRow) {
          const currentStock = Number(varRow.stock) || 0
          const newStock = Math.max(0, currentStock - qty)
          await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', resolvedVariantId)

          // Sync parent product stock
          const { data: siblingVars } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('product_id', varRow.product_id)
            .eq('branch', branch)

          if (siblingVars) {
            const totalStock = siblingVars.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            await supabase
              .from('products')
              .update({ stock_quantity: totalStock })
              .eq('id', varRow.product_id)
          }

          // Insert movement
          await supabase.from('inventory_movements').insert({
            product_id: varRow.product_id,
            variant_id: resolvedVariantId,
            movement_type: 'SALE',
            quantity_delta: -qty,
            quantity_before: currentStock,
            quantity_after: newStock,
            note: `Advance Order Reserved (${order.deposit_id})`,
            created_by_name: order.created_by_name || 'Staff',
            branch,
          })

          item.product_id = varRow.product_id
          item.variant_id = resolvedVariantId
          item._stock_deducted = true
          item.is_manual = true // tells complete_advance_order_v2 not to double deduct!
        }
      } else if (resolvedProdId) {
        const { data: prodRow } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .eq('id', resolvedProdId)
          .eq('branch', branch)
          .maybeSingle()

        if (prodRow) {
          const currentStock = Number(prodRow.stock_quantity) || 0
          const newStock = Math.max(0, currentStock - qty)
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', resolvedProdId)

          // Insert movement
          await supabase.from('inventory_movements').insert({
            product_id: resolvedProdId,
            variant_id: null,
            movement_type: 'SALE',
            quantity_delta: -qty,
            quantity_before: currentStock,
            quantity_after: newStock,
            note: `Advance Order Reserved (${order.deposit_id})`,
            created_by_name: order.created_by_name || 'Staff',
            branch,
          })

          item.product_id = resolvedProdId
          item._stock_deducted = true
          item.is_manual = true // tells complete_advance_order_v2 not to double deduct!
        }
      }

      updatedProducts.push(item)
    }

    // Save updated products metadata with _stock_deducted: true
    await supabase
      .from('advance_orders')
      .update({ products: updatedProducts })
      .eq('id', order.id)
  } catch (err) {
    console.error('[deductStockForAdvanceOrder] Error:', err)
  }
}

/**
 * Rollback (restock) deducted items if an advance order is cancelled or deleted before completion.
 */
async function rollbackStockForAdvanceOrder(order: AdvanceOrder): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const branch = order.branch || 'pos1'
    const items = order.products || []
    const updatedProducts: Array<Record<string, unknown>> = []

    for (const rawItem of items) {
      const item = { ...rawItem }
      const wasDeducted = item._stock_deducted === true || item._stock_deducted === undefined
      const qty = Math.max(1, Number(item.quantity) || 1)
      const resolvedProdId = item.product_id ? Number(item.product_id) : null
      const resolvedVariantId = item.variant_id ? String(item.variant_id) : null

      if (wasDeducted) {
        if (resolvedVariantId) {
          const { data: varRow } = await supabase
            .from('product_variants')
            .select('id, product_id, stock')
            .eq('id', resolvedVariantId)
            .eq('branch', branch)
            .maybeSingle()

          if (varRow) {
            const currentStock = Number(varRow.stock) || 0
            const newStock = currentStock + qty
            await supabase
              .from('product_variants')
              .update({ stock: newStock })
              .eq('id', resolvedVariantId)

            // Sync parent product stock
            const { data: siblingVars } = await supabase
              .from('product_variants')
              .select('stock')
              .eq('product_id', varRow.product_id)
              .eq('branch', branch)

            if (siblingVars) {
              const totalStock = siblingVars.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
              await supabase
                .from('products')
                .update({ stock_quantity: totalStock })
                .eq('id', varRow.product_id)
            }

            // Insert RETURN movement
            await supabase.from('inventory_movements').insert({
              product_id: varRow.product_id,
              variant_id: resolvedVariantId,
              movement_type: 'RETURN',
              quantity_delta: qty,
              quantity_before: currentStock,
              quantity_after: newStock,
              note: `Advance Order Cancelled - Stock Restocked (${order.deposit_id})`,
              created_by_name: 'Admin',
              branch,
            })

            item._stock_deducted = false
          }
        } else if (resolvedProdId) {
          const { data: prodRow } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .eq('id', resolvedProdId)
            .eq('branch', branch)
            .maybeSingle()

          if (prodRow) {
            const currentStock = Number(prodRow.stock_quantity) || 0
            const newStock = currentStock + qty
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', resolvedProdId)

            // Insert RETURN movement
            await supabase.from('inventory_movements').insert({
              product_id: resolvedProdId,
              variant_id: null,
              movement_type: 'RETURN',
              quantity_delta: qty,
              quantity_before: currentStock,
              quantity_after: newStock,
              note: `Advance Order Cancelled - Stock Restocked (${order.deposit_id})`,
              created_by_name: 'Admin',
              branch,
            })

            item._stock_deducted = false
          }
        }
      }
      updatedProducts.push(item)
    }

    await supabase
      .from('advance_orders')
      .update({ products: updatedProducts })
      .eq('id', order.id)
  } catch (err) {
    console.error('[rollbackStockForAdvanceOrder] Error:', err)
  }
}

export async function deleteAdvanceOrder(orderId: string): Promise<void> {
  let completedOrderId: string | null = null
  if (isSupabaseConfigured) {
    const { data: adv } = await supabase.from('advance_orders').select('*').eq('id', orderId).maybeSingle()
    if (adv) {
      if (adv.completed_order_id) {
        completedOrderId = adv.completed_order_id
      }
      // Rollback stock if active (neither completed nor cancelled)
      if (adv.status !== 'completed' && adv.status !== 'cancelled') {
        const normalized = normalizeOrder(adv as Record<string, unknown>)
        await rollbackStockForAdvanceOrder(normalized)
      }
    }
    const { error } = await supabase.from('advance_orders').delete().eq('id', orderId)
    if (error) throw new Error(error.message)
    if (completedOrderId) {
      await supabase.from('orders').delete().eq('id', completedOrderId)
    }
  }
  
  // Clean up local storage
  const localOrders = loadLocalOrders()
  const target = localOrders.find(o => o.id === orderId)
  if (target?.completed_order_id) {
    completedOrderId = completedOrderId || target.completed_order_id
    if (isSupabaseConfigured) {
      await supabase.from('orders').delete().eq('id', target.completed_order_id)
    }
  }
  const filtered = localOrders.filter(o => o.id !== orderId)
  saveLocalOrders(filtered)
  
  const localTimeline = loadLocalTimeline().filter(t => t.advance_order_id !== orderId)
  saveLocalTimeline(localTimeline)
  
  const localPayments = loadLocalPayments().filter(p => p.advance_order_id !== orderId)
  saveLocalPayments(localPayments)
}

export async function cancelAdvanceOrderByCompletedOrderId(completedOrderId: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase
      .from('advance_orders')
      .update({ completed_order_id: null, invoice_number: null, status: 'cancelled' })
      .eq('completed_order_id', completedOrderId)
  }
  const localOrders = loadLocalOrders()
  const updated = localOrders.map(o => {
    if (o.completed_order_id === completedOrderId) {
      return { ...o, completed_order_id: null, invoice_number: null, status: 'cancelled' as AdvanceStatus }
    }
    return o
  })
  saveLocalOrders(updated)
}

export async function listAdvanceOrders(branch: PosBranch = 'pos1'): Promise<AdvanceOrder[]> {
  const cached = loadLocalOrders()
  const local = cached.filter(o => (o.branch || 'pos1') === branch)
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('advance_orders').select('*').order('created_at', { ascending: false })
      if (branch) query = query.eq('branch', branch)
      const { data, error } = await query
      if (error) {
        console.error('[listAdvanceOrders] Supabase error:', error.message)
      } else if (Array.isArray(data)) {
        const remote = data.map(row => normalizeOrder(row as Record<string, unknown>))
        const remoteIds = new Set(remote.map(r => r.id))
        const localOnly = local.filter(l => !remoteIds.has(l.id))
        const merged = [...remote, ...localOnly].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        saveLocalOrders([...merged, ...cached.filter(o => (o.branch || 'pos1') !== branch)])
        return merged
      }
    } catch (err) { console.error('[listAdvanceOrders] Exception:', err) }
  }
  return local
}

export async function getAdvanceOrderHistory(orderId: string) {
  const localTimeline = loadLocalTimeline().filter(t => t.advance_order_id === orderId)
  const localPayments = loadLocalPayments().filter(p => p.advance_order_id === orderId)

  if (isSupabaseConfigured) {
    try {
      const [tRes, pRes] = await Promise.all([
        supabase.from('advance_order_timeline').select('*').eq('advance_order_id', orderId).order('created_at'),
        supabase.from('advance_order_payments').select('*').eq('advance_order_id', orderId).order('received_at'),
      ])
      const timeline = (tRes.data && tRes.data.length > 0) ? (tRes.data as AdvanceTimeline[]) : localTimeline
      const payments = (pRes.data && pRes.data.length > 0) ? (pRes.data as AdvancePayment[]) : localPayments
      return { timeline, payments }
    } catch { /* fallback */ }
  }
  return { timeline: localTimeline, payments: localPayments }
}

export async function createAdvanceOrder(input: {
  customerName: string; phone: string; address: string; productName: string; category: string; description: string
  totalAmount: number; depositAmount: number; expectedDeliveryDate: string; remarks: string; referenceNumber: string
  paymentMethod: AdvancePaymentMethod; createdByName: string; products?: Array<Record<string, unknown>>; branch?: PosBranch
}): Promise<AdvanceOrder> {
  let createdOrder: AdvanceOrder | null = null

  // Ensure items have is_manual: true so complete_advance_order_v2 does not double deduct later
  const preparedProducts = (input.products && input.products.length > 0)
    ? input.products.map(p => ({
        ...p,
        is_manual: true,
        _stock_deducted: true
      }))
    : [{
        name: input.productName,
        category: input.category,
        description: input.description,
        quantity: 1,
        base_price: input.totalAmount,
        line_total: input.totalAmount,
        unit: 'piece',
        unit_type: 'unit',
        source: 'advance_order',
        is_manual: true,
        _stock_deducted: true
      }]

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('create_advance_order', {
        p_customer_name: input.customerName, p_phone: input.phone, p_address: input.address, p_product_name: input.productName,
        p_category: input.category, p_description: input.description, p_total_amount: input.totalAmount,
        p_deposit_amount: input.depositAmount, p_expected_delivery_date: input.expectedDeliveryDate, p_remarks: input.remarks,
        p_payment_method: input.paymentMethod, p_created_by_name: input.createdByName, p_products: preparedProducts,
        p_branch: input.branch || 'pos1',
      })
      if (error) {
        console.error('[createAdvanceOrder] Supabase error:', error.message)
      } else if (data) {
        createdOrder = normalizeOrder(rpcRow(data))
        // Ensure remaining_balance is computed and persisted if DB returned 0 or null
        const expectedBal = Math.max(0, Math.round((createdOrder.total_amount - createdOrder.deposit_amount) * 100) / 100)
        createdOrder.remaining_balance = expectedBal

        const patchPayload: Record<string, unknown> = { remaining_balance: expectedBal }
        if (input.referenceNumber.trim()) {
          patchPayload.reference_number = input.referenceNumber.trim()
          createdOrder.reference_number = input.referenceNumber.trim()
        }
        await supabase.from('advance_orders').update(patchPayload).eq('id', createdOrder.id)
      }
    } catch (err) { console.error('[createAdvanceOrder] Exception:', err) }
  }

  if (!createdOrder) {
    const now = new Date()
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const seq = String(Math.floor(1000 + Math.random() * 9000))
    const depositId = `DEP-${ymd}-${seq}`
    const orderId = crypto.randomUUID ? crypto.randomUUID() : `adv_${Date.now()}_${Math.random().toString(36).slice(2)}`

    createdOrder = {
      id: orderId,
      deposit_id: depositId,
      customer_name: input.customerName.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      product_name: input.productName.trim(),
      products: preparedProducts,
      category: input.category.trim(),
      description: input.description.trim(),
      total_amount: Number(input.totalAmount),
      deposit_amount: Number(input.depositAmount),
      remaining_balance: Number(input.totalAmount) - Number(input.depositAmount),
      expected_delivery_date: input.expectedDeliveryDate,
      status: 'pending_deposit',
      remarks: input.remarks.trim(),
      reference_number: input.referenceNumber.trim(),
      created_by_name: input.createdByName,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
      completed_order_id: null,
      invoice_number: null,
      final_payment_method: null,
      branch: input.branch || 'pos1',
    }

    const currentTimeline = loadLocalTimeline()
    currentTimeline.push(
      { id: Date.now(), advance_order_id: orderId, event_type: 'created', label: 'Deposit Created', remarks: input.remarks, created_at: now.toISOString() },
      { id: Date.now() + 1, advance_order_id: orderId, event_type: 'deposit_received', label: 'Deposit Received', remarks: `Received INR ${input.depositAmount} via ${input.paymentMethod.toLowerCase() === 'upi' ? 'QR' : input.paymentMethod.toUpperCase()}`, created_at: now.toISOString() }
    )
    saveLocalTimeline(currentTimeline)

    const currentPayments = loadLocalPayments()
    currentPayments.push({
      id: orderId + '_dep',
      advance_order_id: orderId,
      payment_type: 'deposit',
      amount: Number(input.depositAmount),
      payment_method: input.paymentMethod,
      remarks: input.remarks,
      received_at: now.toISOString(),
    })
    saveLocalPayments(currentPayments)
  }

  // Deduct stock immediately upon creating advance order
  if (createdOrder) {
    await deductStockForAdvanceOrder(createdOrder)
  }

  const localOrders = loadLocalOrders()
  const updated = [createdOrder, ...localOrders.filter(o => o.id !== createdOrder!.id)]
  saveLocalOrders(updated)
  return createdOrder
}

export async function updateAdvanceStatus(orderId: string, status: AdvanceStatus, remarks = ''): Promise<AdvanceOrder> {
  // Fetch current order before update to check whether rollback is needed
  let orderBefore: AdvanceOrder | null = null
  if (isSupabaseConfigured) {
    const { data: cur } = await supabase.from('advance_orders').select('*').eq('id', orderId).maybeSingle()
    if (cur) orderBefore = normalizeOrder(cur as Record<string, unknown>)
  } else {
    orderBefore = loadLocalOrders().find(o => o.id === orderId) || null
  }

  let updatedOrder: AdvanceOrder | null = null

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('update_advance_order_status', { p_order_id: orderId, p_status: status, p_remarks: remarks })
      if (error) {
        console.error('[updateAdvanceStatus] Supabase error:', error.message)
      } else if (data) {
        updatedOrder = normalizeOrder(rpcRow(data))
      }
    } catch (err) { console.error('[updateAdvanceStatus] Exception:', err) }
  }

  // Rollback stock when advance order is cancelled
  if (status === 'cancelled' && orderBefore && orderBefore.status !== 'cancelled' && orderBefore.status !== 'completed') {
    await rollbackStockForAdvanceOrder(orderBefore)
    if (updatedOrder) {
      updatedOrder.products = updatedOrder.products.map(p => ({ ...p, _stock_deducted: false }))
    }
  }

  const localOrders = loadLocalOrders()
  const existing = localOrders.find(o => o.id === orderId)
  if (!updatedOrder && existing) {
    const now = new Date().toISOString()
    const label = status === 'ready_for_delivery' ? 'Ready for Delivery' : status === 'waiting_final_payment' ? 'Customer Contacted' : status === 'cancelled' ? 'Cancelled' : 'Pending Deposit'
    updatedOrder = { ...existing, status, remarks: remarks || existing.remarks, updated_at: now }

    const timeline = loadLocalTimeline()
    timeline.push({ id: Date.now(), advance_order_id: orderId, event_type: status, label, remarks, created_at: now })
    saveLocalTimeline(timeline)
  }

  if (updatedOrder) {
    saveLocalOrders(localOrders.map(o => o.id === orderId ? updatedOrder! : o))
    return updatedOrder
  }
  throw new Error('Order not found')
}

export async function addAdvanceEvent(orderId: string, eventType: string, label: string, remarks = '') {
  if (isSupabaseConfigured) {
    try {
      await supabase.rpc('add_advance_order_event', { p_order_id: orderId, p_event_type: eventType, p_label: label, p_remarks: remarks })
    } catch { /* fallback */ }
  }
  const timeline = loadLocalTimeline()
  timeline.push({ id: Date.now(), advance_order_id: orderId, event_type: eventType, label, remarks, created_at: new Date().toISOString() })
  saveLocalTimeline(timeline)
}

export async function completeAdvanceOrder(
  orderId: string, 
  paymentMethod: AdvancePaymentMethod, 
  finalAmount: number,
  couponCode: string | null = null,
  couponPercentage: number = 0,
  manualDiscountAmount: number = 0,
  remarks = ''
) {
  let result: { order_id: string; invoice_no: string; completed_at: string } | null = null

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('complete_advance_order_v2', { 
        p_order_id: orderId, 
        p_payment_method: paymentMethod,
        p_final_amount: finalAmount,
        p_coupon_code: couponCode,
        p_coupon_percentage: couponPercentage,
        p_manual_discount: manualDiscountAmount,
        p_remarks: remarks 
      })
      if (error) {
        if (error.message?.includes('already generated') || error.message?.includes('already completed')) {
          // Self-heal: order was already completed with invoice
          const { data: existing } = await supabase.from('advance_orders').select('*').eq('id', orderId).maybeSingle()
          if (existing && (existing.invoice_number || existing.completed_order_id)) {
            result = {
              order_id: existing.completed_order_id || existing.id,
              invoice_no: existing.invoice_number || 'INV-COMPLETED',
              completed_at: existing.completed_at || new Date().toISOString()
            }
          } else {
            throw new Error('This order has already been completed.')
          }
        } else if (
          error.message?.includes('remaining_balance') ||
          error.message?.includes('can only be updated to DEFAULT') ||
          (error as { code?: string }).code === '428C9'
        ) {
          console.warn('[completeAdvanceOrder] RPC failed with remaining_balance error, falling back to direct completion...', error)
          const { data: existing } = await supabase.from('advance_orders').select('*').eq('id', orderId).maybeSingle()
          if (existing) {
            if (existing.completed_order_id && existing.invoice_number) {
              result = {
                order_id: existing.completed_order_id,
                invoice_no: existing.invoice_number,
                completed_at: existing.completed_at || new Date().toISOString()
              }
            } else {
              const nowIso = new Date().toISOString()
              const branch = existing.branch === 'pos2' ? 'pos2' : 'pos1'

              let invoiceNo = ''
              try {
                const { data: invData } = await supabase.rpc('get_next_invoice_no', { p_branch: branch })
                if (invData && typeof invData === 'string') {
                  invoiceNo = invData
                }
              } catch { /* fallback */ }
              if (!invoiceNo) {
                const prefix = branch === 'pos2' ? '500' : '100'
                invoiceNo = `${prefix}${String(Math.floor(10000 + Math.random() * 89999))}`
              }

              const completedOrderId = crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}_${Math.random().toString(36).slice(2)}`
              const rawProducts = Array.isArray(existing.products) ? existing.products : []
              const items = rawProducts.length > 0
                ? rawProducts
                : [{
                    name: existing.product_name,
                    category: existing.category,
                    description: existing.description,
                    quantity: 1,
                    base_price: existing.total_amount,
                    line_total: existing.total_amount,
                    unit: 'piece',
                    unit_type: 'unit',
                    source: 'advance_order'
                  }]

              const { error: ordErr } = await supabase.from('orders').insert({
                id: completedOrderId,
                invoice_no: invoiceNo,
                customer_name: existing.customer_name,
                phone: existing.phone,
                address: existing.address || '',
                items,
                subtotal: existing.total_amount,
                total: existing.total_amount,
                status: 'completed',
                order_mode: 'offline',
                order_type: 'advance_order',
                shipping: 0,
                delivery_charge: 0,
                discount_amount: 0,
                manual_discount_amount: 0,
                coupon_code: null,
                coupon_percentage: 0,
                manual_discount_type: 'flat',
                manual_discount_value: 0,
                payment_mode: paymentMethod.toLowerCase(),
                payment_method: paymentMethod.toLowerCase(),
                branch,
                created_at: nowIso,
                updated_at: nowIso
              })

              if (!ordErr) {
                const orderItemsToInsert = items.map((it: Record<string, unknown>) => ({
                  order_id: completedOrderId,
                  product_name: String(it.name || 'Product'),
                  name: String(it.name || 'Product'),
                  quantity: Number(it.quantity || 1),
                  unit: String(it.unit || 'piece'),
                  unit_type: String(it.unit_type || 'unit'),
                  base_price: Number(it.base_price || 0),
                  line_total: Number(it.line_total || 0),
                  is_manual: false
                }))
                await supabase.from('order_items').insert(orderItemsToInsert)

                await supabase.from('advance_order_payments').insert({
                  advance_order_id: orderId,
                  payment_type: 'remaining',
                  amount: finalAmount,
                  payment_method: paymentMethod.toLowerCase(),
                  remarks: remarks || '',
                  received_at: nowIso
                })

                await supabase.from('advance_orders').update({
                  status: 'completed',
                  completed_at: nowIso,
                  completed_order_id: completedOrderId,
                  invoice_number: invoiceNo,
                  final_payment_method: paymentMethod.toLowerCase(),
                  remarks: remarks ? remarks : existing.remarks,
                  updated_at: nowIso
                }).eq('id', orderId)

                await supabase.from('advance_order_timeline').insert([
                  { advance_order_id: orderId, event_type: 'remaining_payment_received', label: 'Remaining Payment Received', remarks: remarks || '', created_at: nowIso },
                  { advance_order_id: orderId, event_type: 'invoice_generated', label: 'Invoice Generated', remarks: invoiceNo, created_at: nowIso }
                ])

                result = {
                  order_id: completedOrderId,
                  invoice_no: invoiceNo,
                  completed_at: nowIso
                }
              } else {
                throw new Error(ordErr.message || error.message)
              }
            }
          } else {
            throw new Error(error.message || JSON.stringify(error))
          }
        } else {
          throw new Error(error.message || JSON.stringify(error))
        }
      }
      if (data) {
        const row = Array.isArray(data) ? data[0] : data
        result = row as { order_id: string; invoice_no: string; completed_at: string }
      }
    } catch (err: unknown) {
      if (!result) {
        console.error('[completeAdvanceOrder] Error:', err)
        throw err instanceof Error ? err : new Error(String(err))
      }
    }
  }

  const localOrders = loadLocalOrders()
  const order = localOrders.find(o => o.id === orderId)
  const now = new Date().toISOString()

  if (!result) {
    const seq = String(Math.floor(10000000 + Math.random() * 89999999))
    const invoiceNo = `INV${seq}`
    const completedOrderId = crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}_${Math.random().toString(36).slice(2)}`
    result = { order_id: completedOrderId, invoice_no: invoiceNo, completed_at: now }
  }

  if (order) {
    const updatedOrder: AdvanceOrder = {
      ...order,
      status: 'completed',
      completed_at: result.completed_at,
      completed_order_id: result.order_id,
      invoice_number: result.invoice_no,
      final_payment_method: paymentMethod,
      remarks: remarks || order.remarks,
      updated_at: now,
    }
    saveLocalOrders(localOrders.map(o => o.id === orderId ? updatedOrder : o))

    const timeline = loadLocalTimeline()
    timeline.push(
      { id: Date.now(), advance_order_id: orderId, event_type: 'remaining_payment_received', label: 'Final Payment Received', remarks, created_at: now },
      { id: Date.now() + 1, advance_order_id: orderId, event_type: 'delivered', label: 'Delivered', remarks, created_at: now },
      { id: Date.now() + 2, advance_order_id: orderId, event_type: 'revenue_posted', label: `Revenue Posted (INR ${order.total_amount})`, remarks, created_at: now },
      { id: Date.now() + 3, advance_order_id: orderId, event_type: 'invoice_generated', label: `Invoice Generated (${result.invoice_no})`, remarks, created_at: now }
    )
    saveLocalTimeline(timeline)

    const payments = loadLocalPayments()
    payments.push({
      id: orderId + '_rem',
      advance_order_id: orderId,
      payment_type: 'remaining',
      amount: order.remaining_balance,
      payment_method: paymentMethod,
      remarks,
      received_at: now,
    })
    saveLocalPayments(payments)
  }

  return result!
}
