import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { BRAND_EN } from './brand'
import { formatCurrency, formatQuantityValue, normalizeStructuredOrderItem, normalizeUnitLabel, formatInvoiceNo } from './retail'
import type { PosBranch } from '../store/store'
import { getBranchProfile } from './branchProfile'
import { formatPhoneForDisplay } from './phone'

export type InvoicePdfData = {
  invoiceNo: string
  date: string
  customerName: string
  phone: string
  address: string
  branch?: PosBranch
  items: Array<Record<string, unknown>>
  subtotal: number
  shipping: number
  total: number
  discountAmount?: number
  manualDiscountAmount?: number
  gstAmount?: number
  couponCode?: string | null
  paymentMode?: string
  depositAmount?: number
  balancePaid?: number
  remainingBalance?: number
}

// jsPDF's built-in Helvetica font does not include the ₹ Unicode glyph (U+20B9).
// In ISO-8859-1 (WinAnsiEncoding), \u20B9 maps to character code 185 (0xB9), which renders
// as the superscript 1 (¹) glyph. Replacing with "Rs. " ensures clean and proper PDF formatting.
const money = (value: number): string => {
  const formatted = formatCurrency(Number(value || 0)).replace(/\s+/g, ' ')
  return formatted.replace(/^[₹\u20b9]\s*/, 'Rs. ')
}

/** Creates a compact A4 invoice that can be attached as a file to WhatsApp. */
export function createInvoicePdf(data: InvoicePdfData): Blob {
  const formattedNo = formatInvoiceNo(data.invoiceNo)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const left = 16
  const right = 194
  const isPos2 = data.branch === 'pos2'
  const primaryColor = isPos2 ? '#1D4ED8' : '#DB2777' // Royal Blue for Taj Textiles, Deep Pink for Mariyam
  const borderColor = isPos2 ? '#60A5FA' : '#F472B6'
  const boxFill = isPos2 ? '#EFF6FF' : '#FDF2F8'
  const boxBorder = isPos2 ? '#BFDBFE' : '#FBCFE8'
  const tableHeaderBg = isPos2 ? '#1D4ED8' : '#DB2777'
  const tableRowLine = isPos2 ? '#DBEAFE' : '#FCE7F3'
  const ink = '#18202a'
  const muted = '#68717c'
  let y = 16

  const profile = getBranchProfile(data.branch)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(primaryColor)
  doc.text('TAX INVOICE', left, y)
  doc.text(`Invoice: #${formattedNo}`, right, y, { align: 'right' })
  y += 6
  doc.setDrawColor(borderColor)
  doc.setLineWidth(0.5)
  doc.line(left, y, right, y)
  y += 7

  const brandInitial = isPos2 ? 'T' : 'M'
  const logoSize = 22
  const headerTop = y
  // Monogram circle badge with M or T instead of logo image
  doc.setFillColor(boxFill)
  doc.setDrawColor(primaryColor)
  doc.setLineWidth(0.8)
  doc.circle(left + logoSize / 2, headerTop + logoSize / 2, logoSize / 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(primaryColor)
  doc.text(brandInitial, left + logoSize / 2, headerTop + logoSize / 2 + 5, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(primaryColor)
  doc.text(profile.name, left + logoSize + 5, headerTop + 6)
  doc.setFontSize(8)
  doc.setTextColor('#555555')
  doc.setFont('helvetica', 'normal')
  doc.text(profile.address, left + logoSize + 5, headerTop + 13, { maxWidth: 80 })
  doc.text(`Phone: ${formatPhoneForDisplay(profile.phone)}`, left + logoSize + 5, headerTop + 22)
  doc.setTextColor(primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-IN')}`, right - 2, headerTop + 5, { align: 'right' })
  const paymentText = `Payment: ${data.paymentMode || 'POS'}`.replace(/[₹\u20b9]/g, 'Rs. ')
  doc.text(paymentText, right - 2, headerTop + 11, { align: 'right', maxWidth: 100 })
  
  // Advance y cleanly past the logo with 6mm margin to guarantee NO overlap with the BILL TO box
  y = headerTop + logoSize + 6

  const customerName = String(data.customerName || 'Walk-in Customer').trim()
  const customerPhone = formatPhoneForDisplay(data.phone) || '—'
  const customerAddress = String(data.address || '').trim()
  const customerNameLines = doc.splitTextToSize(customerName, 165) as string[]
  const customerAddressLines = customerAddress
    ? doc.splitTextToSize(`Address: ${customerAddress}`, 165) as string[]
    : []
  const customerBoxHeight = 19 + customerNameLines.length * 4 + customerAddressLines.length * 4

  doc.setFillColor(boxFill)
  doc.setDrawColor(boxBorder)
  doc.setLineWidth(0.5)
  doc.roundedRect(left, y, right - left, customerBoxHeight, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(primaryColor)
  doc.text('BILL TO', left + 5, y + 7)
  doc.setFontSize(10)
  doc.setTextColor(ink)
  doc.text(customerNameLines, left + 5, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(muted)
  const phoneY = y + 13 + customerNameLines.length * 4 + 2
  doc.text(`Mobile Number: ${customerPhone}`, left + 5, phoneY)
  if (customerAddressLines.length > 0) {
    doc.text(customerAddressLines, left + 5, phoneY + 5)
  }
  y += customerBoxHeight + 8

  doc.setFillColor(tableHeaderBg)
  doc.rect(left, y, right - left, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor('#FFFFFF')
  doc.text('#', left + 3, y + 6)
  doc.text('ITEM DESCRIPTION', left + 12, y + 6)
  doc.text('QTY', 139, y + 6, { align: 'center' })
  doc.text('RATE', 164, y + 6, { align: 'right' })
  doc.text('AMOUNT', right - 3, y + 6, { align: 'right' })
  y += 14

  data.items.forEach((raw, index) => {
    const item = normalizeStructuredOrderItem(raw)
    if (y > 260) { doc.addPage(); y = 20 }
    const name = item.name || 'Item'
    const nameLines = doc.splitTextToSize(name, 105) as string[]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(ink)
    doc.text(String(index + 1), left + 3, y)
    doc.text(nameLines, left + 12, y)
    const subY = y + nameLines.length * 4
    const unitLabel = normalizeUnitLabel(item.unit, item.unit_type)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(muted)
    doc.text(`${unitLabel} · ${money(item.base_price)}`, left + 12, subY)
    doc.text(`${formatQuantityValue(item.quantity)}`, 139, y, { align: 'center' })
    doc.text(money(item.base_price), 164, y, { align: 'right' })
    const itemBaseTotal = Math.round((item.quantity * item.base_price) * 100) / 100
    const itemAmount = itemBaseTotal > 0 && Math.abs(item.line_total - itemBaseTotal) > 0.01 && (data.gstAmount || 0) > 0
      ? itemBaseTotal
      : (item.line_total || itemBaseTotal)
    doc.text(money(itemAmount), right - 3, y, { align: 'right' })
    y += Math.max(14, (nameLines.length + 1) * 4 + 4)
    doc.setDrawColor(tableRowLine)
    doc.line(left, y - 3, right, y - 3)
  })

  y = Math.max(y + 6, 150)
  const rows: Array<[string, string, string, number]> = [['Subtotal', money(data.subtotal), ink, 9]]
  if ((data.discountAmount || 0) > 0) rows.push([`Coupon${data.couponCode ? ` (${data.couponCode})` : ''}`, `-${money(data.discountAmount || 0)}`, primaryColor, 10])
  if ((data.manualDiscountAmount || 0) > 0) rows.push(['Manual Discount', `-${money(data.manualDiscountAmount || 0)}`, primaryColor, 10])
  if ((data.gstAmount || 0) > 0) {
    const gst = data.gstAmount || 0
    const taxable = Math.max(0, data.subtotal - (data.discountAmount || 0) - (data.manualDiscountAmount || 0))
    const calculatedPercent = taxable > 0 ? (gst / taxable) * 100 : 0
    const halfPercent = Math.round((calculatedPercent / 2) * 100) / 100
    const percentLabel = halfPercent > 0 ? ` (${halfPercent}%)` : ''
    const cgst = Math.round((gst / 2) * 100) / 100
    const sgst = Math.round((gst - cgst) * 100) / 100
    rows.push([`CGST${percentLabel}`, `+${money(cgst)}`, ink, 7])
    rows.push([`SGST${percentLabel}`, `+${money(sgst)}`, ink, 7])
  }
  rows.push(['Delivery', (data.shipping || 0) > 0 ? money(data.shipping) : 'FREE', ink, 9])
  rows.forEach(([label, value, color, fontSize]) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(color === primaryColor ? primaryColor : '#18202a')
    doc.text(label, 142, y, { align: 'right' })
    doc.text(value, right - 3, y, { align: 'right' })
    y += 7
  })
  doc.setDrawColor(borderColor)
  doc.setLineWidth(1)
  doc.line(left + 20, y - 3, right - 3, y - 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(primaryColor)
  doc.text('TOTAL', 142, y + 6, { align: 'right' })
  doc.text(money(data.total), right - 3, y + 6, { align: 'right' })

  if ((data.depositAmount || 0) > 0) {
    y += 13
    doc.setDrawColor(borderColor)
    doc.setLineWidth(0.3)
    doc.line(120, y - 4, right - 3, y - 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor('#374151')
    doc.text('Deposit Paid', 142, y, { align: 'right' })
    doc.text(money(data.depositAmount || 0), right - 3, y, { align: 'right' })

    const balPaid = data.balancePaid !== undefined ? data.balancePaid : Math.max(0, data.total - (data.depositAmount || 0))
    if (balPaid > 0) {
      y += 5
      doc.text('Balance Paid', 142, y, { align: 'right' })
      doc.text(money(balPaid), right - 3, y, { align: 'right' })
    }

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor((data.remainingBalance || 0) > 0 ? primaryColor : '#059669')
    doc.text('Remaining Balance', 142, y, { align: 'right' })
    doc.text(money(data.remainingBalance || 0), right - 3, y, { align: 'right' })
  }

  y = 275
  doc.setDrawColor(borderColor)
  doc.setLineWidth(0.5)
  doc.line(left, y, right, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(primaryColor)
  const footerMessage = isPos2 ? 'THANK YOU FOR SHOPPING AT TAJ TEXTILES' : 'THANK YOU FOR SHOPPING WITH US'
  doc.text(footerMessage, pageWidth / 2, y + 8, { align: 'center' })
  return doc.output('blob')
}

export function invoicePdfFile(data: InvoicePdfData): File {
  return new File([createInvoicePdf(data)], `Invoice-${formatInvoiceNo(data.invoiceNo)}.pdf`, { type: 'application/pdf' })
}

/** Captures the rendered invoice so the downloaded PDF matches the visible view and anchors footer to the bottom. */
export async function invoicePdfFileFromElement(
  element: HTMLElement,
  invoiceNo: string,
): Promise<File> {
  const formattedNo = formatInvoiceNo(invoiceNo)
  const invoiceRoot = (element.querySelector('#invoice-print-root') as HTMLElement) || element
  const canonicalWidth = 680
  const targetMinHeight = Math.round(canonicalWidth * (297 / 210)) // 962px (exact A4 ratio)

  try {
    const canvas = await html2canvas(invoiceRoot, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 1024,
      onclone: (_clonedDoc, clonedElement) => {
        const clonedInvoice =
          clonedElement.id === 'invoice-print-root'
            ? clonedElement
            : (clonedElement.querySelector('#invoice-print-root') as HTMLElement) || clonedElement
        clonedInvoice.style.width = `${canonicalWidth}px`
        clonedInvoice.style.minWidth = `${canonicalWidth}px`
        clonedInvoice.style.maxWidth = `${canonicalWidth}px`
        clonedInvoice.style.minHeight = `${targetMinHeight}px`
        clonedInvoice.style.boxSizing = 'border-box'
        clonedInvoice.style.margin = '0 auto'
      },
    })

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageWidth = 210
    const pageHeight = 297
    const imageHeight = (canvas.height * pageWidth) / canvas.width
    const image = canvas.toDataURL('image/png')

    if (imageHeight <= pageHeight + 5) {
      doc.addImage(image, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
    } else {
      let offset = 0
      let page = 0
      while (offset < imageHeight) {
        if (page > 0) doc.addPage()
        doc.addImage(image, 'PNG', 0, -offset, pageWidth, imageHeight, undefined, 'FAST')
        offset += pageHeight
        page += 1
      }
    }

    return new File([doc.output('blob')], `Invoice-${formattedNo}.pdf`, { type: 'application/pdf' })
  } catch (error) {
    console.error('Failed to generate invoice PDF from element:', error)
    throw error
  }
}
