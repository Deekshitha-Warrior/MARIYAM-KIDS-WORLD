import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { StructuredOrderItem } from '../lib/retail'
import type { PosBranch } from '../store/store'

type CreateOrderInput = {
  customerName: string
  phone: string
  address: string
  items: StructuredOrderItem[]
  shipping: number
  status?: string
  orderMode?: 'online' | 'offline'
  orderType?: 'online_request' | 'pos_sale' | 'manual_sale'
  deliveryCharge?: number
  discountAmount?: number
  manualDiscountAmount?: number
  manualDiscountType?: 'flat' | 'percent'
  manualDiscountValue?: number
  couponCode?: string
  couponPercentage?: number

  // POS additions
  paymentMethod?: string
  splitDetails?: Record<string, unknown>
  totalGst?: number
  gstEnabled?: boolean
  branch?: PosBranch
}

type CreatedOrder = {
  orderId: string
  invoiceNo: string
  createdAt: string
}

export const createOrderWithStock = async (input: CreateOrderInput): Promise<CreatedOrder> => {
  const customerName   = input.customerName.trim() || 'Customer'
  const phone          = input.phone.trim()
  const address        = input.address.trim()
  const shipping       = Number(input.shipping || 0)
  const status         = input.status || 'pending'
  const orderMode      = input.orderMode || 'online'
  const orderType      = input.orderType || (status === 'pending' && orderMode === 'online' ? 'online_request' : 'pos_sale')
  const deliveryCharge = Number(input.deliveryCharge || 0)
  const discountAmount = Number(input.discountAmount || 0)
  const manualDiscountAmount = Number(input.manualDiscountAmount || 0)
  const manualDiscountType = input.manualDiscountType || 'flat'
  const manualDiscountValue = Number(input.manualDiscountValue || 0)
  const couponCode     = input.couponCode?.trim() || null
  const couponPercentage = Number(input.couponPercentage || 0)
  const effectiveDiscount = discountAmount + manualDiscountAmount

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is required to create orders')
  }

  const totalGst        = Number(input.totalGst || 0)
  const gstEnabled      = Boolean(input.gstEnabled)
  const paymentMethod   = input.paymentMethod || 'cash'
  const splitDetails    = input.splitDetails || {}
  const branch          = input.branch || 'pos1'

  // Pre-validate stock limits against database before calling RPC
  for (const item of input.items) {
    if (!item.is_manual && Number(item.quantity || 0) > 0) {
      if (item.variant_id) {
        const { data: vRow } = await supabase
          .from('product_variants')
          .select('stock, variant_name')
          .eq('id', item.variant_id)
          .eq('branch', branch)
          .maybeSingle()
        if (vRow && typeof vRow.stock === 'number' && Number(item.quantity) > vRow.stock) {
          throw new Error(`Requested quantity (${item.quantity}) for "${item.name}${vRow.variant_name ? ` - ${vRow.variant_name}` : ''}" is greater than available stock limit (${vRow.stock})`)
        }
      } else if (item.product_id) {
        const { data: pRow } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product_id)
          .eq('branch', branch)
          .maybeSingle()
        if (pRow && typeof pRow.stock_quantity === 'number' && Number(item.quantity) > pRow.stock_quantity) {
          throw new Error(`Requested quantity (${item.quantity}) for "${pRow.name || item.name}" is greater than available stock limit (${pRow.stock_quantity})`)
        }
      }
    }
  }

  // Match the RPC signature currently defined in the migration files.
  let data: unknown = null
  let error: unknown = null

  const rpcPayload = {
    p_customer_name:          customerName,
    p_phone:                  phone,
    p_address:                address,
    p_items:                  input.items,
    p_shipping:               shipping,
    p_status:                 status,
    p_order_mode:             orderMode,
    p_order_type:             orderType,
    p_delivery_charge:        deliveryCharge,
    p_discount_amount:        discountAmount,
    p_manual_discount_amount: manualDiscountAmount,
    p_manual_discount_type:   manualDiscountType,
    p_manual_discount_value:  manualDiscountValue,
    p_coupon_code:            couponCode,
    p_coupon_percentage:      couponPercentage,
    p_total_gst:              totalGst,
    p_gst_enabled:            gstEnabled,
    p_payment_method:         paymentMethod,
    p_split_details:          splitDetails,
    p_branch:                 branch,
  }

  // 1. Try complete_pos_sale_with_inventory (inventory-aware transaction with atomic stock checks & movements ledger)
  const inventoryRpcResult = await supabase.rpc('complete_pos_sale_with_inventory', rpcPayload)
  data = inventoryRpcResult.data
  error = inventoryRpcResult.error

  // 2. Fallback to create_order_with_stock if migration 0012 is not yet deployed
  if (inventoryRpcResult.error?.code === 'PGRST202') {
    const newRpcResult = await supabase.rpc('create_order_with_stock', rpcPayload)
    data = newRpcResult.data
    error = newRpcResult.error

    // A legacy order RPC has no branch argument and defaults every bill to
    // POS 1. Never use it for a POS 2 checkout, or its bill and revenue will
    // be recorded under the wrong branch.
    if (newRpcResult.error?.code === 'PGRST202' && branch === 'pos2') {
      error = new Error('POS 2 checkout requires the branch-isolation database migration. Please update the database before creating this bill.')
    }

    // 3. Keep the legacy fallback only for POS 1, its original default branch.
    if (newRpcResult.error?.code === 'PGRST202' && branch === 'pos1') {
    const legacyResult = await supabase.rpc('create_order_without_stock', {
      p_address:                address,
      p_coupon_code:            couponCode,
      p_coupon_percentage:      couponPercentage,
      p_customer_name:          customerName,
      p_delivery_charge:        deliveryCharge,
      p_discount_amount:        discountAmount,
      p_items:                  input.items,
      p_manual_discount_amount: manualDiscountAmount,
      p_manual_discount_type:   manualDiscountType,
      p_manual_discount_value:  manualDiscountValue,
      p_order_mode:             orderMode,
      p_order_type:             orderType,
      p_phone:                  phone,
      p_shipping:               shipping,
      p_status:                 status,
    })
    data = legacyResult.data
    error = legacyResult.error

    const legacyRow = Array.isArray(data) ? data[0] : data
    if (!error && legacyRow && typeof legacyRow === 'object') {
      const legacyOrderId = String((legacyRow as Record<string, unknown>).order_id ?? '')
      if (legacyOrderId) {
        const legacySubtotal = input.items.reduce((sum, item) => sum + Number(item.line_total || 0), 0)
        const legacyTotal = Math.max(
          0,
          legacySubtotal + shipping + deliveryCharge + totalGst - effectiveDiscount,
        )
        await supabase
          .from('orders')
          .update({
            subtotal: legacySubtotal,
            shipping,
            delivery_charge: deliveryCharge,
            total: legacyTotal,
            payment_method: paymentMethod,
            payment_mode: paymentMethod,
            total_gst: totalGst,
            gst_amount: totalGst,
          })
          .eq('id', legacyOrderId)
      }
    }
  }
}



  if (error) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const err = error as { message: unknown; details?: unknown }
      const message = String(err.message)
      if (/invalid api key|invalid value.*apikey|apikey.*invalid/i.test(message)) {
        throw new Error('Supabase configuration is invalid. Please redeploy with the correct Supabase URL and publishable key.')
      }
      throw new Error(message + (err.details ? ` (${String(err.details)})` : ''))
    }
    throw new Error(String(error))
  }

  const row = Array.isArray(data) ? (data as unknown[])[0] : data
  if (!row || typeof row !== 'object') {
    throw new Error('Order RPC returned an invalid payload')
  }
  const rowObj = row as Record<string, unknown>
  const orderId = String(rowObj.order_id ?? rowObj.orderId ?? rowObj.id ?? '')
  const invoiceNo = String(rowObj.invoice_no ?? rowObj.invoiceNo ?? '')
  if (!orderId || !invoiceNo) {
    throw new Error('Order RPC returned an invalid payload')
  }

  // NOTE: coupon usage_count is already incremented atomically inside the
  // create_order_with_stock DB function. Do NOT increment it again here.

  return {
    orderId,
    invoiceNo,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Deletes an order from the database and rolls back all deducted item quantities
 * to their respective products and variants, creating RETURN inventory movements.
 */
export const deleteOrderWithStockRollback = async (
  orderId: string,
  branch?: PosBranch,
  invoiceNo?: string,
): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured')
  }

  // 1. Fetch order metadata
  const { data: orderRow, error: fetchErr } = await supabase
    .from('orders')
    .select('id, invoice_no, branch, items, coupon_code')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchErr) {
    throw new Error(`Failed to load order: ${fetchErr.message}`)
  }

  const targetBranch: PosBranch = (orderRow?.branch as PosBranch) || branch || 'pos1'
  const targetInvoiceNo = invoiceNo || orderRow?.invoice_no || orderId

  // 2. Fetch order items from order_items table
  const { data: dbItems } = await supabase
    .from('order_items')
    .select('id, product_id, variant_id, product_name, name, quantity, is_manual, source')
    .eq('order_id', orderId)

  // 3. Collect items to restock
  let rawItems: Array<Record<string, unknown>> = []
  if (dbItems && dbItems.length > 0) {
    rawItems = dbItems as Array<Record<string, unknown>>
  } else if (orderRow?.items) {
    let parsed: unknown = orderRow.items
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed) } catch { parsed = [] }
    }
    if (Array.isArray(parsed)) {
      rawItems = parsed.filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    }
  }

  // 4. Rollback stock for each item
  for (const item of rawItems) {
    const qty = Math.max(0, Number(item.quantity ?? item.qty) || 0)
    if (qty <= 0) continue

    const isPureManual = (item.is_manual === true || item.source === 'manual') &&
      !item.variant_id && !item.variantId && !item.product_id && !item.productId && !item.id

    if (isPureManual) continue

    const variantId = item.variant_id || item.variantId ? String(item.variant_id || item.variantId) : null
    const rawProdId = item.product_id || item.productId || (item.id && !variantId ? item.id : null)

    if (variantId) {
      const { data: vRow } = await supabase
        .from('product_variants')
        .select('id, product_id, stock')
        .eq('id', variantId)
        .eq('branch', targetBranch)
        .maybeSingle()

      if (vRow) {
        const currentStock = Number(vRow.stock) || 0
        const newStock = currentStock + qty

        await supabase
          .from('product_variants')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', vRow.id)
          .eq('branch', targetBranch)

        const parentProdId = vRow.product_id
        if (parentProdId) {
          const { data: siblings } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('product_id', parentProdId)
            .eq('branch', targetBranch)

          if (siblings && siblings.length > 0) {
            const totalStock = siblings.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
            await supabase
              .from('products')
              .update({
                stock_quantity: totalStock,
                stock: Math.floor(totalStock),
                updated_at: new Date().toISOString(),
              })
              .eq('id', parentProdId)
              .eq('branch', targetBranch)
          }
        }

        try {
          let barcodeId: string | null = null
          const { data: bRow } = await supabase
            .from('barcode_registry')
            .select('id')
            .eq('variant_id', vRow.id)
            .eq('branch', targetBranch)
            .limit(1)
            .maybeSingle()
          if (bRow) barcodeId = bRow.id

          await supabase.from('inventory_movements').insert({
            product_id: parentProdId,
            variant_id: vRow.id,
            barcode_id: barcodeId,
            movement_type: 'RETURN',
            quantity_delta: qty,
            quantity_before: currentStock,
            quantity_after: newStock,
            reference_type: 'order',
            reference_id: targetInvoiceNo,
            note: `Order Cancelled / Deleted (${targetInvoiceNo})`,
            branch: targetBranch,
          })
        } catch (movErr) {
          console.warn('[deleteOrderWithStockRollback] variant movement log error:', movErr)
        }
      }
    } else {
      // Standalone product
      let pRow: { id: string | number; stock_quantity?: number | null; stock?: number | null } | null = null

      if (rawProdId) {
        const { data } = await supabase
          .from('products')
          .select('id, stock_quantity, stock')
          .eq('id', rawProdId)
          .eq('branch', targetBranch)
          .maybeSingle()
        pRow = data
      }

      if (!pRow && (item.name || item.product_name)) {
        const prodName = String(item.name || item.product_name).trim()
        if (prodName) {
          const { data } = await supabase
            .from('products')
            .select('id, stock_quantity, stock')
            .ilike('name', prodName)
            .eq('branch', targetBranch)
            .maybeSingle()
          pRow = data
        }
      }

      if (pRow) {
        const currentStock = Number(pRow.stock_quantity ?? pRow.stock) || 0
        const newStock = currentStock + qty

        await supabase
          .from('products')
          .update({
            stock_quantity: newStock,
            stock: Math.floor(newStock),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pRow.id)
          .eq('branch', targetBranch)

        try {
          let barcodeId: string | null = null
          const { data: bRow } = await supabase
            .from('barcode_registry')
            .select('id')
            .eq('product_id', pRow.id)
            .is('variant_id', null)
            .eq('branch', targetBranch)
            .limit(1)
            .maybeSingle()
          if (bRow) barcodeId = bRow.id

          await supabase.from('inventory_movements').insert({
            product_id: pRow.id,
            variant_id: null,
            barcode_id: barcodeId,
            movement_type: 'RETURN',
            quantity_delta: qty,
            quantity_before: currentStock,
            quantity_after: newStock,
            reference_type: 'order',
            reference_id: targetInvoiceNo,
            note: `Order Cancelled / Deleted (${targetInvoiceNo})`,
            branch: targetBranch,
          })
        } catch (movErr) {
          console.warn('[deleteOrderWithStockRollback] product movement log error:', movErr)
        }
      }
    }
  }

  // 5. Rollback coupon usage if applicable
  if (orderRow?.coupon_code) {
    try {
      const { data: cRow } = await supabase
        .from('coupons')
        .select('id, usage_count')
        .eq('code', orderRow.coupon_code)
        .eq('branch', targetBranch)
        .maybeSingle()
      if (cRow && Number(cRow.usage_count) > 0) {
        await supabase
          .from('coupons')
          .update({
            usage_count: Math.max(0, Number(cRow.usage_count) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('id', cRow.id)
      }
    } catch (cErr) {
      console.warn('[deleteOrderWithStockRollback] coupon usage rollback error:', cErr)
    }
  }

  // 6. Cancel linked advance order if one exists
  try {
    const { cancelAdvanceOrderByCompletedOrderId } = await import('./advanceOrderService')
    await cancelAdvanceOrderByCompletedOrderId(orderId)
  } catch (advErr) {
    console.warn('[deleteOrderWithStockRollback] advance order link cancel error:', advErr)
  }

  // 7. Delete order items
  await supabase.from('order_items').delete().eq('order_id', orderId)

  // 8. Delete order
  const { error: delErr } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('branch', targetBranch)

  if (delErr) {
    const { error: fallbackDelErr } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    if (fallbackDelErr) {
      throw new Error(`Failed to delete order: ${fallbackDelErr.message}`)
    }
  }

  return { success: true }
}

