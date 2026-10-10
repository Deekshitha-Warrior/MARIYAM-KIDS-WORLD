import { BRAND_EN } from './brand'
import { formatCurrency, formatInvoiceNo } from './retail'
import { formatPhoneForDisplay } from './phone'
import type { PosBranch } from '../store/store'
import { getBranchProfile } from './branchProfile'

export interface ThermalReceiptData {
  invoiceNo: string
  date: string
  customerName?: string
  phone?: string
  branch?: PosBranch
  items: Array<{
    name: string
    qty: number
    unit?: string
    price: number
    line_total?: number
  }>
  subtotal: number
  shipping: number
  couponDiscount?: number
  manualDiscount?: number
  totalGst?: number
  gstPercent?: number
  total: number
  paymentMode?: string
  storeName?: string
  storePhone?: string
  storeAddress?: string
  storeEmail?: string
  depositAmount?: number
  balancePaid?: number
  remainingBalance?: number
}

export function printThermalReceipt(data: ThermalReceiptData) {
  try {
    const profile = getBranchProfile(data.branch)
    const brandInitial = data.branch === 'pos2' ? 'T' : 'M'
    const storeDisplayName = data.storeName || (data.branch === 'pos2' ? 'TAJ TEXTILES' : BRAND_EN)
    // Create an isolated print iframe protected from third-party extension observers
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0.01;pointer-events:none;z-index:-1;'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute('tabindex', '-1')
    iframe.setAttribute('data-gramm', 'false')
    iframe.setAttribute('data-gramm_editor', 'false')
    iframe.setAttribute('data-enable-grammarly', 'false')
    iframe.setAttribute('spellcheck', 'false')
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      return
    }

    const dateStr = (() => {
      try { return new Date(data.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
      catch { return new Date().toLocaleString('en-IN') }
    })()

    // 1. Calculate items sum from actual item line totals
    const itemsSum = Math.round(data.items.reduce((sum, item) => {
      const lineTotal = item.line_total ?? (item.qty * item.price)
      return sum + (Number(lineTotal) || 0)
    }, 0) * 100) / 100

    const couponDisc = Number(data.couponDiscount || 0)
    const manualDisc = Number(data.manualDiscount || 0)
    const totalDisc = Math.round((couponDisc + manualDisc) * 100) / 100
    const shippingAmt = Number(data.shipping || 0)

    // 2. Determine effective GST amount: either passed explicitly or implied by difference between Total and (items - discounts + shipping)
    let effectiveGst = Math.max(0, Number(data.totalGst || 0))
    if (effectiveGst === 0 && data.total > 0 && itemsSum > 0) {
      const preTaxTotal = Math.max(0, Math.round((itemsSum - totalDisc + shippingAmt) * 100) / 100)
      if (data.total > preTaxTotal + 0.05) {
        effectiveGst = Math.round((data.total - preTaxTotal) * 100) / 100
      }
    }

    // 3. Determine true pre-tax subtotal
    let displaySubtotal = Number(data.subtotal || 0)
    if (itemsSum > 0) {
      displaySubtotal = itemsSum
    } else if (displaySubtotal === 0 || (displaySubtotal === data.total && effectiveGst > 0)) {
      displaySubtotal = Math.max(0, Math.round((data.total - effectiveGst - shippingAmt + totalDisc) * 100) / 100)
    }

    // 4. Calculate GST percentage and CGST/SGST split
    const taxableAmount = Math.max(0, displaySubtotal - totalDisc)
    const calculatedGstPercent = data.gstPercent ?? (taxableAmount > 0 && effectiveGst > 0 ? (effectiveGst / taxableAmount) * 100 : 0)
    const halfGstPercent = Math.round((calculatedGstPercent / 2) * 100) / 100
    const percentLabel = halfGstPercent > 0 ? ` (${halfGstPercent}%)` : ''
    const cgstAmount = Math.round((effectiveGst / 2) * 100) / 100
    const sgstAmount = Math.round((effectiveGst - cgstAmount) * 100) / 100

    const html = `
      <!DOCTYPE html>
      <html lang="en" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" spellcheck="false">
        <head>
          <meta charset="UTF-8">
          <meta name="grammarly" content="off">
          <meta name="robots" content="noindex,nofollow">
          <title>Receipt - ${data.invoiceNo}</title>
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 4mm;
            width: 80mm;
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
          .border-top { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 2px 0; vertical-align: top; }
          .item-name { font-size: 11px; padding-right: 4px; }
        </style>
      </head>
      <body>
        <div class="text-center mb-2">
          <div style="width: 38px; height: 38px; line-height: 34px; margin: 0 auto 6px auto; border: 2px solid #000; border-radius: 50%; font-size: 22px; font-weight: 900; text-align: center; font-family: 'Arial Black', Arial, sans-serif; box-sizing: border-box;">${brandInitial}</div>
          <div class="font-bold" style="font-size: 15px; letter-spacing: 1.5px;">${storeDisplayName}</div>
          <div style="font-size: 10px; margin-top: 2px;">${data.storeAddress || profile.address}</div>
          <div class="mt-1" style="font-size: 10px;">Ph: ${data.storePhone || profile.phone}</div>
          <div style="font-size: 9px; color: #333;">${data.storeEmail || profile.email}</div>
        </div>

        <div class="border-bottom border-top" style="font-size: 11px;">
          <div>Inv: #${formatInvoiceNo(data.invoiceNo)}</div>
          <div>Date: ${dateStr}</div>
          ${data.paymentMode ? `<div>Payment: ${data.paymentMode}</div>` : ''}
          ${data.customerName ? `<div>Name: ${data.customerName}</div>` : ''}
          ${data.phone ? `<div>Tel: ${formatPhoneForDisplay(data.phone)}</div>` : ''}
        </div>

        <table class="border-bottom" style="width: 100%; table-layout: fixed; border-collapse: collapse;">
          <thead>
            <tr style="font-size: 10px; border-bottom: 1px dashed #000;">
              <th style="width: 50%; text-align: left; padding: 4px 0;">Item Name</th>
              <th style="width: 18%; text-align: center; padding: 4px 0;">Qty</th>
              <th style="width: 32%; text-align: right; padding: 4px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => {
              const lineTotal = item.line_total ?? (item.qty * item.price)
              const unit = item.unit && item.unit !== 'unit' && item.unit !== 'piece' ? item.unit : ''
              const rateDisplay = `${formatCurrency(item.price)}${unit ? `/${unit}` : ''}`
              return `
                <tr>
                  <td style="text-align: left; padding: 3px 2px 3px 0; vertical-align: top; word-break: break-word;">
                    <div style="font-size: 11px; font-weight: bold; line-height: 1.25;">${item.name}</div>
                    <div style="font-size: 9px; color: #444; margin-top: 1px;">@ ${rateDisplay}</div>
                  </td>
                  <td style="text-align: center; vertical-align: top; padding: 3px 0; font-size: 11px;">
                    ${item.qty}
                  </td>
                  <td style="text-align: right; vertical-align: top; padding: 3px 0; font-size: 11px; font-weight: bold;">
                    ${formatCurrency(lineTotal)}
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>

        <div class="border-bottom" style="font-size: 12px;">
          <table style="width: 100%;">
            ${(displaySubtotal !== data.total || effectiveGst > 0 || totalDisc > 0 || shippingAmt > 0) ? `
              <tr>
                <td class="text-left">Subtotal</td>
                <td class="text-right">${formatCurrency(displaySubtotal)}</td>
              </tr>
            ` : ''}
            ${couponDisc > 0 ? `
              <tr style="font-size: 13px; font-weight: bold;">
                <td class="text-left">Coupon</td>
                <td class="text-right">-${formatCurrency(couponDisc)}</td>
              </tr>
            ` : ''}
            ${manualDisc > 0 ? `
              <tr>
                <td class="text-left">Manual Disc.</td>
                <td class="text-right">-${formatCurrency(manualDisc)}</td>
              </tr>
            ` : ''}
            ${effectiveGst > 0 ? `
              <tr style="font-size: 11px;">
                <td class="text-left font-bold">CGST${percentLabel}</td>
                <td class="text-right font-bold">+${formatCurrency(cgstAmount)}</td>
              </tr>
              <tr style="font-size: 11px;">
                <td class="text-left font-bold">SGST${percentLabel}</td>
                <td class="text-right font-bold">+${formatCurrency(sgstAmount)}</td>
              </tr>
            ` : ''}
            ${shippingAmt > 0 ? `
              <tr>
                <td class="text-left">Delivery</td>
                <td class="text-right">${formatCurrency(shippingAmt)}</td>
              </tr>
            ` : ''}
            <tr class="font-bold" style="font-size: 14px;">
              <td class="text-left">Total</td>
              <td class="text-right">${formatCurrency(data.total)}</td>
            </tr>
            ${(data.depositAmount !== undefined && data.depositAmount > 0) ? `
              <tr style="font-size: 11px; border-top: 1px dashed #555;">
                <td class="text-left font-bold" style="padding-top: 3px;">Deposit Paid</td>
                <td class="text-right font-bold" style="padding-top: 3px;">${formatCurrency(data.depositAmount)}</td>
              </tr>
              ${(data.balancePaid !== undefined && data.balancePaid > 0) ? `
                <tr style="font-size: 11px;">
                  <td class="text-left font-bold">Balance Paid</td>
                  <td class="text-right font-bold">${formatCurrency(data.balancePaid)}</td>
                </tr>
              ` : ''}
              <tr style="font-size: 12px; font-weight: bold; border-top: 1px dashed #555;">
                <td class="text-left" style="padding-top: 3px;">${(data.remainingBalance && data.remainingBalance > 0) ? 'Balance Due' : 'Remaining Balance'}</td>
                <td class="text-right" style="padding-top: 3px;">${formatCurrency(data.remainingBalance || 0)}</td>
              </tr>
            ` : ''}
          </table>
        </div>

        <div class="text-center mt-2" style="font-size: 11px;">
          <div class="font-bold">Thank you for shopping at ${data.storeName || (data.branch === 'pos2' ? 'TAJ TEXTILES' : BRAND_EN)}!</div>
        </div>
      </body>
    </html>
  `

    doc.open()
    doc.write(html)
    doc.close()

    const cleanup = () => {
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
      } catch {}
    }

    // Wait for resources to load, then print safely
    setTimeout(() => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.onbeforeunload = null
          iframe.contentWindow.onunload = null
          iframe.contentWindow.onafterprint = cleanup
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        }
      } catch (printErr) {
        console.warn('[thermalPrint] Print execution error:', printErr)
      } finally {
        setTimeout(cleanup, 2000)
      }
    }, 250)
  } catch (err) {
    console.warn('[thermalPrint] Failed to print receipt:', err)
  }
}
