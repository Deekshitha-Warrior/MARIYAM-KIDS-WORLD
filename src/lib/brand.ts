export const BRAND_EN = 'MARIYAM KIDS WORLD'
export const BRAND_TA = 'MARIYAM KIDS WORLD'
export const BRAND_SHORT = 'MKW'
export const BRAND_MONOGRAM = 'MKW'

// Branch-specific barcode prefixes for inventory differentiation
export function getBarcodePrefix(branch?: string): string {
  if (branch === 'pos2') return 'TAJ'
  return 'MKW' // Default to POS1 (Mariyam Kids World)
}

// Branch-specific barcode settings
export interface BarcodeSettingsConfig {
  printerType: 'label' | 'regular'
  selectedSizeId: string
  showSalePrice: boolean
  showCompanyName: boolean
  showItemName: boolean
  showDiscount: boolean
}

export function getDefaultBarcodeSettings(branch?: string): BarcodeSettingsConfig {
  if (branch === 'pos2') {
    return {
      printerType: 'regular',
      selectedSizeId: '1_100x50',
      showSalePrice: true,
      showCompanyName: true,
      showItemName: true,
      showDiscount: true
    }
  }
  // POS1: Standard thermal labels (default)
  return {
    printerType: 'label',
    selectedSizeId: '2_50x25',
    showSalePrice: true,
    showCompanyName: true,
    showItemName: true,
    showDiscount: false
  }
}

export const BRAND_SUBTITLE = 'Kids Wear, Toys & Kids Accessories'
export const BRAND_LOGO = '/mariyam_kids_world_logo_transparent.png'
export const BRAND_ICON = '/mariyam-icon-512.png'
export const BRAND_FAVICON = '/mariyam-favicon.png'

// Per-branch logos
export const BRAND_LOGO_POS1 = '/mariyam_kids_world_logo_transparent.png'
export const BRAND_LOGO_POS2 = '/taj_textiles_logo.png'
export const BRAND_PRODUCTION_DOMAIN = 'https://cen-gen-pos.vercel.app'

// POS 1: MARIYAM KIDS WORLD
// Owner / Personal contact
export const BRAND_OWNER_NAME = 'AANISHA BANU MOHAMMED ANSARI'
export const BRAND_OWNER_PHONE_DISPLAY = '+91 9003024922'
export const BRAND_OWNER_PHONE_E164 = '919003024922'

// Official Shop contact (used for receipts, billing, and customer WhatsApp)
export const BRAND_PRIMARY_PHONE_DISPLAY = '+91 9003024922'
export const BRAND_PRIMARY_PHONE_E164 = '919003024922'
export const BRAND_SECONDARY_PHONE_DISPLAY = '+91 9445050934'
export const BRAND_SECONDARY_PHONE_E164 = '919445050934'
export const BRAND_THIRD_PHONE_DISPLAY = BRAND_SECONDARY_PHONE_DISPLAY
export const BRAND_THIRD_PHONE_E164 = BRAND_SECONDARY_PHONE_E164

export const BRAND_PHONE_DISPLAY = '+91 9003024922 | +91 9445050934'
export const BRAND_PHONE_E164 = BRAND_PRIMARY_PHONE_E164

export const BRAND_WHATSAPP = '+91 9003024922'
export const WHATSAPP_NUM = '919003024922'
export const BRAND_WHATSAPP_LINK = `https://wa.me/${BRAND_PRIMARY_PHONE_E164}`

export const BRAND_EMAIL = 'mariyamkidsworld2025@gmail.com'
export const BRAND_ADDRESS = '100, P.V. VAITHIYALINGAM road old Pallavaram Chennai 600117'
export const BRAND_WEBSITE = 'https://mariyamkidsworld.com'
export const BRAND_LOCATION_LINK = '#'

// POS 2: TAJ TEXTILES
export const TAJ_BRAND_NAME = 'Taj textiles'
export const TAJ_BRAND_OWNER = 'Mohammed ansari'
export const TAJ_BRAND_PHONE_DISPLAY = '+91 9442711949 | +91 9445050934'
export const TAJ_BRAND_PRIMARY_PHONE_DISPLAY = '+91 9442711949'
export const TAJ_BRAND_PRIMARY_PHONE_E164 = '919442711949'
export const TAJ_BRAND_SECONDARY_PHONE_DISPLAY = '+91 9445050934'
export const TAJ_BRAND_SECONDARY_PHONE_E164 = '919445050934'
export const TAJ_BRAND_EMAIL = 'tajtextiles1965@gmail.com'
export const TAJ_BRAND_ADDRESS = '111, P.V. Vaithiyalingam road old Pallavaram Chennai 600117'
export const TAJ_BRAND_LOGO = '/taj_textiles_logo.png'
export const TAJ_BRAND_SUBTITLE = 'Textiles & Garments'
export const TAJ_BRAND_THEME_COLOR = '#2563EB' // White and Blue theme

// Instagram URLs shown on invoices, receipts and WhatsApp messages
export function getInstagramUrls(branch?: string): string {
  if (branch === 'pos2') return ''
  return 'https://www.instagram.com/mariyamkidsworld/'
}

export const BRAND_INSTAGRAM = 'mariyamkidsworld'
export const BRAND_INSTAGRAM_URL = 'https://www.instagram.com/mariyamkidsworld/'
