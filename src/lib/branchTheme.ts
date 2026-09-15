import rawThemes from '../config/branchThemes.json'

export interface BranchThemeColors {
  primary: string
  primaryHover: string
  primaryLight: string
  primaryMuted: string
  accent: string
  accentLight: string
  surface: string
  cardBg: string
  border: string
  sidebarBg: string
  sidebarBorder: string
  sidebarActiveTab: string
  sidebarActiveText: string
  sidebarBadgeBg: string
  sidebarBadgeText: string
  sidebarBadgeBorder: string
  headerAccent: string
  bannerBg: string
  cardBorder: string
  checkoutBtn: string
  checkoutBtnText: string
  checkoutBtnBorder: string
  pillBg: string
  pillText: string
  pillBorder: string
}

export interface BranchThemeConfig {
  branchCode: string
  branchName: string
  tagline: string
  badge: string
  icon: string
  colors: BranchThemeColors
}

export type BranchThemesMap = Record<string, BranchThemeConfig>

const themesMap = rawThemes as unknown as BranchThemesMap

export function getBranchTheme(branchCode?: string | null): BranchThemeConfig {
  const code = (branchCode || 'TEXTILE').toUpperCase()
  if (themesMap[code]) {
    return themesMap[code]
  }
  // Default to TEXTILE if not found
  return themesMap['TEXTILE'] || {
    branchCode: 'TEXTILE',
    branchName: 'CLAD TEXTILE',
    tagline: 'Retail POS',
    badge: 'Branch 1',
    icon: 'store',
    colors: {
      primary: '#D4AF37',
      primaryHover: '#C59F2E',
      primaryLight: '#FBF7ED',
      primaryMuted: '#E8D399',
      accent: '#0A0A0A',
      accentLight: '#FEF3C7',
      surface: '#141414',
      cardBg: '#FFFFFF',
      border: '#E5E7EB',
      sidebarBg: '#0A0A0A',
      sidebarBorder: 'rgba(212, 175, 55, 0.25)',
      sidebarActiveTab: '#D4AF37',
      sidebarActiveText: '#0A0A0A',
      sidebarBadgeBg: 'rgba(212, 175, 55, 0.2)',
      sidebarBadgeText: '#D4AF37',
      sidebarBadgeBorder: 'rgba(212, 175, 55, 0.4)',
      headerAccent: '#D4AF37',
      bannerBg: 'linear-gradient(135deg, #141414 0%, #1A1608 100%)',
      cardBorder: '#E8D399',
      checkoutBtn: '#0A0A0A',
      checkoutBtnText: '#D4AF37',
      checkoutBtnBorder: '#D4AF37',
      pillBg: '#FEF3C7',
      pillText: '#92400E',
      pillBorder: '#FDE68A',
    },
  }
}

/**
 * Apply CSS variables to the document element for dynamic reactive theme styling.
 */
export function applyBranchThemeCssVariables(theme: BranchThemeConfig): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const c = theme.colors
  root.style.setProperty('--pos-primary', c.primary)
  root.style.setProperty('--pos-primary-hover', c.primaryHover)
  root.style.setProperty('--pos-primary-light', c.primaryLight)
  root.style.setProperty('--pos-primary-muted', c.primaryMuted)
  root.style.setProperty('--pos-accent', c.accent)
  root.style.setProperty('--pos-sidebar-bg', c.sidebarBg)
  root.style.setProperty('--pos-sidebar-border', c.sidebarBorder)
  root.style.setProperty('--pos-sidebar-active', c.sidebarActiveTab)
  root.style.setProperty('--pos-sidebar-active-text', c.sidebarActiveText)
  root.style.setProperty('--pos-card-border', c.cardBorder)
  root.style.setProperty('--pos-accent-light', c.accentLight)
  root.style.setProperty('--pos-badge-bg', c.sidebarBadgeBg)
  root.style.setProperty('--pos-badge-text', c.sidebarBadgeText)
  root.style.setProperty('--pos-badge-border', c.sidebarBadgeBorder)
  root.setAttribute('data-branch-code', theme.branchCode.toLowerCase())
}
