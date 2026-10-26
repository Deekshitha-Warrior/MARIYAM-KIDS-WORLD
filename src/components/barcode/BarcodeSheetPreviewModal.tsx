import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'
import {
  type BarcodeQueueItem,
  type LabelSizeConfig,
  calculateSheetLayout,
  renderBarcodeSvg,
} from '../../lib/barcode'

interface BarcodeSheetPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  items: BarcodeQueueItem[]
  sizeConfig: LabelSizeConfig
  onPrint: () => void
}

export const BarcodeSheetPreviewModal: React.FC<BarcodeSheetPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  sizeConfig,
  onPrint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Expand all selected queue items into individual labels based on `noOfLabels`
  const individualLabels: BarcodeQueueItem[] = []
  items
    .filter((it) => it.selected)
    .forEach((it) => {
      const count = Math.max(1, it.noOfLabels || 1)
      for (let i = 0; i < count; i++) {
        individualLabels.push(it)
      }
    })

  // Calculate standard A4 vertical sheet layout & pagination
  const layout = calculateSheetLayout(sizeConfig)

  // Chunk labels into discrete printable sheets
  const sheets: BarcodeQueueItem[][] = []
  if (individualLabels.length === 0) {
    sheets.push([])
  } else {
    for (let i = 0; i < individualLabels.length; i += layout.stickersPerSheet) {
      sheets.push(individualLabels.slice(i, i + layout.stickersPerSheet))
    }
  }

  // Proportional card dimensions for preview sheet (matches physical label aspect ratio)
  const cardScale = Math.min(4.8, 195 / sizeConfig.widthMm)
  const cardWidthPx = Math.max(130, Math.round(sizeConfig.widthMm * cardScale))
  const cardHeightPx = Math.max(85, Math.round(sizeConfig.heightMm * cardScale))
  const cardBarcodeHeightPx = Math.max(22, Math.round(cardHeightPx * 0.48))
  const cardBarcodeWidth = Math.max(1.30, Math.min(2.40, Math.round(((cardWidthPx * 0.88) / 115) * 100) / 100))

  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    // Render SVG barcode for each label using calculated dimensions
    const svgs = containerRef.current.querySelectorAll<SVGSVGElement>('svg.preview-barcode-svg')
    svgs.forEach((svg) => {
      const code = svg.getAttribute('data-barcode')
      if (code) {
        renderBarcodeSvg(svg, code, {
          width: cardBarcodeWidth,
          height: cardBarcodeHeightPx,
          fontSize: Math.max(7, Math.round(cardHeightPx * 0.08)),
          fontOptions: 'bold',
          displayValue: false,
          margin: 0,
          lineColor: '#000000',
        })
      }
    })
  }, [
    isOpen,
    individualLabels.length,
    sizeConfig.id,
    sizeConfig.widthMm,
    sizeConfig.heightMm,
    cardBarcodeHeightPx,
    cardBarcodeWidth,
    cardHeightPx,
  ])

  // Lock body scrolling and close on Escape
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-none sm:rounded-3xl max-w-4xl w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] border-0 sm:border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-[#7A1220] text-white shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-wide text-white">Sticker Sheet Print Preview</h3>
            <p className="text-[11px] sm:text-xs text-[#D4AF37] font-semibold">
              {individualLabels.length} {individualLabels.length === 1 ? 'Sticker' : 'Stickers'} • {sheets.length} {sheets.length === 1 ? 'Sheet' : 'Sheets'} ({layout.columns} Across × {layout.rowsPerPage} Down • {layout.stickersPerSheet} per sheet • A4 Portrait)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview Sheet Body */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-gray-100/70 flex justify-center"
        >
          <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
            {sheets.map((sheetItems, sheetIdx) => (
              <div key={`sheet-${sheetIdx}`} className="w-full flex flex-col items-center">
                {/* Sheet Banner Info */}
                <div className="flex items-center justify-between w-full px-1 mb-2 text-xs font-bold text-gray-600">
                  <span className="font-mono bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-full shadow-xs">
                    Sheet {sheetIdx + 1} of {sheets.length} (A4 Vertical)
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {sheetItems.length} of {layout.stickersPerSheet} stickers
                  </span>
                </div>

                {/* Printable Sheet Box */}
                <div
                  className="bg-white rounded-2xl border-2 border-gray-300 p-4 sm:p-6 shadow-md w-full"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                    gap: '8px',
                  }}
                >
                  {sheetItems.map((label, idx) => (
                    <div
                      key={`${label.id}-${sheetIdx}-${idx}`}
                      className="bg-white rounded-xl border border-dashed border-gray-300 p-2 shadow-xs flex flex-col justify-between items-center text-center relative transition-all min-h-[90px]"
                    >
                      {/* Header */}
                      {label.header && (
                        <span
                          className="font-black uppercase tracking-wider text-gray-900 leading-none truncate max-w-[95%]"
                          style={{ fontSize: `${Math.max(7, Math.round(cardHeightPx * 0.085))}px` }}
                        >
                          {label.header}
                        </span>
                      )}

                      {/* Barcode Graphic Box */}
                      <div
                        className="w-full flex items-center justify-center overflow-hidden my-0.5"
                        style={{ height: `${cardBarcodeHeightPx}px` }}
                      >
                        <svg
                          className="preview-barcode-svg max-w-[98%] max-h-full h-auto"
                          data-barcode={label.barcodeValue}
                        />
                      </div>

                      {/* Item Code Number */}
                      <span
                        className="font-mono font-bold text-gray-800 tracking-wider leading-none"
                        style={{ fontSize: `${Math.max(6.5, Math.round(cardHeightPx * 0.07))}px` }}
                      >
                        {label.barcodeValue}
                      </span>

                      {/* Lines */}
                      {label.line1 && (
                        <span
                          className="font-bold text-gray-700 truncate max-w-full leading-tight"
                          style={{ fontSize: `${Math.max(6.5, Math.round(cardHeightPx * 0.07))}px` }}
                        >
                          {label.line1}
                        </span>
                      )}
                      {label.line2 && (
                        <span
                          className="font-semibold text-gray-600 truncate max-w-full leading-tight"
                          style={{ fontSize: `${Math.max(6, Math.round(cardHeightPx * 0.065))}px` }}
                        >
                          {label.line2}
                        </span>
                      )}
                      {label.line3 && (
                        <span
                          className="font-black text-[#7A1220] truncate max-w-full leading-none"
                          style={{ fontSize: `${Math.max(7.5, Math.round(cardHeightPx * 0.09))}px` }}
                        >
                          {label.line3}
                        </span>
                      )}
                      {label.line4 && (
                        <span
                          className="text-gray-500 truncate max-w-full leading-none"
                          style={{ fontSize: `${Math.max(5.5, Math.round(cardHeightPx * 0.06))}px` }}
                        >
                          {label.line4}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-white shrink-0 gap-2 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <span className="text-[11px] sm:text-xs font-bold text-gray-600 truncate mr-2">
            Total {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'} ({individualLabels.length} {individualLabels.length === 1 ? 'sticker' : 'stickers'}) ready to print
          </span>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onPrint()
              }}
              className="px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-xl bg-[#7A1220] border border-[#D4AF37] text-[#D4AF37] text-xs font-black uppercase tracking-wider hover:bg-[#1A1A1A] transition-all shadow-md flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Printer size={15} /> Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
