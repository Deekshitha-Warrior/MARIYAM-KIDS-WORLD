export interface BranchBusinessDetails {
  name: string
  userName: string
  phones: string
  email: string
  address: string
  primaryPhone: string
  logo: string
}

export const BRANCH_1_DETAILS: BranchBusinessDetails = {
  name: 'Taj textiles',
  userName: 'Mohammed ansari',
  phones: '9442711949 / 9445050934',
  email: 'tajtextiles1965@gmail.com',
  address: '111, P.V. Vaithiyalingam road old Pallavaram Chennai 600117',
  primaryPhone: '9442711949',
  logo: '/taj_textiles_logo.png'
}

export const BRANCH_2_DETAILS: BranchBusinessDetails = {
  name: 'MARIYAM KIDS WORLD',
  userName: 'AANISHA BANU MOHAMMED ANSARI',
  phones: '9003024922 | 9445050934',
  email: 'mariyamkidsworld2025@gmail.com',
  address: '100, P.V. VAITHIYALINGAM road old Pallavaram Chennai 600117',
  primaryPhone: '9003024922',
  logo: '/mariyam_kids_world_logo.png'
}

export function getBranchBusinessDetails(branchCode?: string | null): BranchBusinessDetails {
  const code = (branchCode || 'TEXTILE').toUpperCase()
  if (code === 'GROCERY' || code === 'BRANCH_2') {
    return BRANCH_2_DETAILS
  }
  return BRANCH_1_DETAILS
}

export const BRAND_EN = 'Taj textiles'
export const BRAND_TA = 'Taj textiles'
export const BRAND_SHORT = 'Taj'
export const BRAND_SUBTITLE = 'Retail Billing & Inventory'
export const BRAND_LOGO = '/taj_textiles_logo.png'
export const BRAND_ICON = '/taj_textiles_logo.png'
export const BRAND_FAVICON = '/taj_textiles_logo.png'
export const BRAND_PRODUCTION_DOMAIN = 'https://cen-gen-pos.vercel.app'

// Owner / Personal contact (Branch 1 default)
export const BRAND_OWNER_NAME = 'Mohammed ansari'
export const BRAND_OWNER_PHONE_DISPLAY = '+91 94427 11949'
export const BRAND_OWNER_PHONE_E164 = '919442711949'

// Official Shop contact (used for receipts, billing, and customer WhatsApp)
export const BRAND_PRIMARY_PHONE_DISPLAY = '9442711949 / 9445050934'
export const BRAND_PRIMARY_PHONE_E164 = '919442711949'
export const BRAND_SECONDARY_PHONE_DISPLAY = '9445050934'
export const BRAND_SECONDARY_PHONE_E164 = '919445050934'
export const BRAND_THIRD_PHONE_DISPLAY = BRAND_SECONDARY_PHONE_DISPLAY
export const BRAND_THIRD_PHONE_E164 = BRAND_SECONDARY_PHONE_E164

export const BRAND_PHONE_DISPLAY = BRAND_PRIMARY_PHONE_DISPLAY
export const BRAND_PHONE_E164 = BRAND_PRIMARY_PHONE_E164

export const BRAND_WHATSAPP = '9442711949'
export const WHATSAPP_NUM = '919442711949'
export const BRAND_WHATSAPP_LINK = `https://wa.me/919442711949`

export const BRAND_EMAIL = 'tajtextiles1965@gmail.com'
export const BRAND_ADDRESS = '111, P.V. Vaithiyalingam road old Pallavaram Chennai 600117'
export const BRAND_INSTAGRAM = 'tajtextiles'
export const BRAND_INSTAGRAM_URL = '#'
export const BRAND_LOCATION_LINK = '#'
