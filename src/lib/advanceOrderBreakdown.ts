import type { AdvanceOrder } from '../services/advanceOrderService'

export type AdvanceOrderBreakdown = {
  itemsSum: number
  subtotal: number
  discountAmount: number
  couponDiscount: number
  manualDiscount: number
  couponCode?: string | null
  deliveryCharge: number
  totalGst: number
  cgstAmount: number
  sgstAmount: number
  cgstPercent: number
  sgstPercent: number
  total: number
  depositPaid: number
  balancePaid: number
  remainingBalance: number
}

/**
 * Calculates a complete financial breakdown (Subtotal, Discounts, Delivery, CGST, SGST,
 * Total, Deposit Paid, Balance Paid, and Remaining Balance) for any advance order.
 * Works seamlessly across both Mariyam Kids World (pos1) and Taj Textiles (pos2).
 */
export function getAdvanceOrderBreakdown(order: AdvanceOrder | Record<string, unknown>): AdvanceOrderBreakdown {
  const o = order as Record<string, any>
  const total = Math.max(0, Number(o.total_amount || o.total || 0))
  const depositPaid = Math.max(0, Number(o.deposit_amount || 0))
  const rawProducts = Array.isArray(o.products)
    ? o.products
    : (Array.isArray(o.items) ? o.items : [])

  // 1. Calculate items sum from product line totals
  const itemsSum = Math.round(
    rawProducts.reduce((acc: number, item: any) => {
      const lineTotal = item?.line_total ?? (Number(item?.quantity || item?.qty || 1) * Number(item?.base_price || item?.price || 0))
      return acc + (Number(lineTotal) || 0)
    }, 0) * 100
  ) / 100

  // 2. Check for breakdown metadata if embedded in products
  let metaSubtotal: number | null = null
  let metaDiscount = 0
  let metaCouponDiscount = 0
  let metaManualDiscount = 0
  let metaCouponCode: string | null = null
  let metaDelivery = 0
  let metaGst = 0

  for (const item of rawProducts) {
    const b = (item as any)?._breakdown || (item as any)?.breakdown
    if (b && typeof b === 'object') {
      if (b.subtotal !== undefined) metaSubtotal = Number(b.subtotal) || 0
      if (b.discount_amount !== undefined) metaDiscount = Number(b.discount_amount) || 0
      if (b.coupon_discount !== undefined) metaCouponDiscount = Number(b.coupon_discount) || 0
      if (b.manual_discount !== undefined) metaManualDiscount = Number(b.manual_discount) || 0
      if (b.coupon_code) metaCouponCode = String(b.coupon_code)
      if (b.shipping !== undefined || b.delivery_charge !== undefined) {
        metaDelivery = Number(b.shipping || b.delivery_charge) || 0
      }
      if (b.total_gst !== undefined || b.gst_amount !== undefined) {
        metaGst = Number(b.total_gst || b.gst_amount) || 0
      }
      break
    }
  }

  // 3. Check remarks for explicit breakdown annotations (e.g., "GST: ₹100.00 | Delivery: ₹100.00")
  const remarks = String(order.remarks || '')
  const gstMatch = remarks.match(/GST:\s*(?:₹|Rs\.?|INR)?\s*([\d.]+)/i)
  const deliveryMatch = remarks.match(/(?:Delivery|Shipping):\s*(?:₹|Rs\.?|INR)?\s*([\d.]+)/i)
  const discountMatch = remarks.match(/Discount:\s*(?:₹|Rs\.?|INR)?\s*([\d.]+)/i)

  const remarksGst = gstMatch ? Number(gstMatch[1]) : 0
  const remarksDelivery = deliveryMatch ? Number(deliveryMatch[1]) : 0
  const remarksDiscount = discountMatch ? Number(discountMatch[1]) : 0

  let discountAmount = metaDiscount || remarksDiscount || (Number((order as any).discount_amount || 0) + Number((order as any).manual_discount_amount || 0))
  const couponDiscount = metaCouponDiscount || Number((order as any).discount_amount || 0)
  let manualDiscount = metaManualDiscount || remarksDiscount || Number((order as any).manual_discount_amount || 0)
  let deliveryCharge = metaDelivery || remarksDelivery || Number((order as any).shipping || (order as any).delivery_charge || 0)
  let totalGst = metaGst || remarksGst || Number((order as any).total_gst || (order as any).gst_amount || 0)

  // 4. Base items total
  const baseItems = itemsSum > 0 ? itemsSum : total
  let subtotal = metaSubtotal ?? baseItems

  // 5. Harmonize with thermal print logic when numbers are implicit
  if (totalGst === 0 && deliveryCharge === 0 && discountAmount === 0) {
    if (total > baseItems + 0.05) {
      // Total exceeds items sum: difference represents GST
      totalGst = Math.round((total - baseItems) * 100) / 100
      subtotal = baseItems
    } else if (baseItems > total + 0.05) {
      // Items sum exceeds total: difference represents discount
      discountAmount = Math.round((baseItems - total) * 100) / 100
      manualDiscount = discountAmount
      subtotal = baseItems
    }
  } else {
    // Reconcile remaining difference if total has unaccounted variance
    const accounted = Math.round((subtotal - discountAmount + deliveryCharge + totalGst) * 100) / 100
    if (total > accounted + 0.05) {
      const diff = Math.round((total - accounted) * 100) / 100
      if (remarksDelivery > 0) {
        deliveryCharge = Math.round((deliveryCharge + diff) * 100) / 100
      } else if (totalGst > 0) {
        // GST was explicit, remaining difference is delivery
        deliveryCharge = Math.round((deliveryCharge + diff) * 100) / 100
      } else {
        totalGst = Math.round((totalGst + diff) * 100) / 100
      }
    }
  }

  // 6. GST rate and CGST / SGST split
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const calculatedGstPercent = taxableAmount > 0 && totalGst > 0 ? (totalGst / taxableAmount) * 100 : 0
  const halfGstPercent = Math.round((calculatedGstPercent / 2) * 100) / 100
  const cgstAmount = Math.round((totalGst / 2) * 100) / 100
  const sgstAmount = Math.round((totalGst - cgstAmount) * 100) / 100

  // 7. Balance status
  const status = String(order.status || '')
  let remainingBalance = 0
  let balancePaid = 0

  if (status === 'completed') {
    remainingBalance = 0
    balancePaid = Math.max(0, Math.round((total - depositPaid) * 100) / 100)
  } else if (status === 'cancelled') {
    remainingBalance = 0
    balancePaid = 0
  } else {
    const rawBal = (order as any).remaining_balance !== undefined && (order as any).remaining_balance !== null
      ? Number((order as any).remaining_balance)
      : null
    remainingBalance = (rawBal !== null && rawBal > 0)
      ? rawBal
      : Math.max(0, Math.round((total - depositPaid) * 100) / 100)
    balancePaid = 0
  }

  return {
    itemsSum,
    subtotal,
    discountAmount,
    couponDiscount,
    manualDiscount,
    couponCode: metaCouponCode || ((order as any).coupon_code ? String((order as any).coupon_code) : null),
    deliveryCharge,
    totalGst,
    cgstAmount,
    sgstAmount,
    cgstPercent: halfGstPercent,
    sgstPercent: halfGstPercent,
    total,
    depositPaid,
    balancePaid,
    remainingBalance,
  }
}
