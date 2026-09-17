import React from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  FileText,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Store,
  Receipt,
  Layers,
  Barcode,
  FileSpreadsheet,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { useAdminAuthStore } from '../../store/store'
import { BRAND_EN, BRAND_LOGO } from '../../lib/brand'
import { useBranchContextStore, type Branch } from '../../store/branchContextStore'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAdminAuthStore((s) => s.logout)
  const { availableBranches, activeBranch, enterBranch, exitBranch } =
    useBranchContextStore()

  // Determine current mode and branch from URL (the canonical source of truth)
  const isBranchMode = location.pathname.startsWith('/admin/branches/')

  let urlBranchId: string | null = null
  let currentTab = 'overview'

  if (isBranchMode) {
    const parts = location.pathname.replace('/admin/branches/', '').split('/')
    urlBranchId = parts[0] || null
    currentTab = parts[1] || 'overview'
  } else {
    if (location.pathname.startsWith('/admin/sales')) currentTab = 'sales'
    else if (location.pathname.startsWith('/admin/inventory')) currentTab = 'inventory'
    else if (location.pathname.startsWith('/admin/staff')) currentTab = 'staff'
    else if (location.pathname.startsWith('/admin/reports')) currentTab = 'reports'
    else currentTab = 'overview'
  }

  const currentBranch: Branch | null = isBranchMode
    ? availableBranches.find(
        (b) =>
          b.id.toLowerCase() === (urlBranchId || '').toLowerCase() ||
          b.code.toLowerCase() === (urlBranchId || '').toLowerCase()
      ) || activeBranch
    : null

  const isGrocery = currentBranch?.code.toUpperCase() === 'GROCERY'

  // Global navigation items
  const globalNavItems = [
    { id: 'overview', label: 'Business Overview', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { id: 'sales', label: 'Cross-Branch Sales', path: '/admin/sales', icon: <TrendingUp size={18} /> },
    { id: 'inventory', label: 'Consolidated Stock', path: '/admin/inventory', icon: <Package size={18} /> },
    { id: 'staff', label: 'Staff & Memberships', path: '/admin/staff', icon: <Users size={18} /> },
    { id: 'reports', label: 'Business Reports', path: '/admin/reports', icon: <FileText size={18} /> },
  ]

  // Branch workspace navigation items
  const branchNavItems = currentBranch
    ? [
        { id: 'overview', label: 'Branch Overview', path: `/admin/branches/${currentBranch.id}/overview`, icon: <Store size={18} className={isGrocery ? 'text-pink-400' : 'text-blue-400'} /> },
        { id: 'pos', label: 'POS Billing Counter', path: `/admin/branches/${currentBranch.id}/pos`, icon: <Receipt size={18} className="text-amber-400" />, badge: 'Live POS' },
        { id: 'inventory', label: 'Stock & Inventory', path: `/admin/branches/${currentBranch.id}/inventory`, icon: <Package size={18} className="text-blue-400" /> },
        { id: 'products', label: 'Categories & Catalog', path: `/admin/branches/${currentBranch.id}/products`, icon: <Layers size={18} className="text-emerald-400" /> },
        { id: 'barcodes', label: 'Barcode Generation', path: `/admin/branches/${currentBranch.id}/barcodes`, icon: <Barcode size={18} className="text-purple-400" /> },
        { id: 'expenses', label: 'Expenses Ledger', path: `/admin/branches/${currentBranch.id}/expenses`, icon: <FileSpreadsheet size={18} className="text-rose-400" /> },
        { id: 'orders', label: 'Advance & Custom Orders', path: `/admin/branches/${currentBranch.id}/orders`, icon: <ExternalLink size={18} className="text-sky-400" /> },
      ]
    : []

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#121212] border-r border-[#222222] flex flex-col justify-between z-20">
        <div className="flex flex-col overflow-y-auto hide-scrollbar flex-1">
          {/* Logo & Header */}
          <div className="p-4 border-b border-[#222222] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#D4AF37]/40 flex items-center justify-center p-1.5 shadow-md shrink-0">
              <img src={BRAND_LOGO} alt={BRAND_EN} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black tracking-wider uppercase text-[#D4AF37] truncate">
                {BRAND_EN}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ShieldCheck size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">Admin Orchestrator</span>
              </div>
            </div>
          </div>

          {/* SINGLE AUTHORITATIVE BRANCH SELECTOR */}
          <div className="p-3 border-b border-[#222222] bg-[#0F0F0F]">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center justify-between">
              <span>Operating Branch</span>
              {isBranchMode && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${
                  isGrocery
                    ? 'bg-pink-950/60 text-pink-300 border-pink-700/40'
                    : 'bg-blue-950/60 text-blue-300 border-blue-700/40'
                }`}>
                  {currentBranch?.code}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={isBranchMode && currentBranch ? currentBranch.id : '__global__'}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__global__') {
                    exitBranch()
                    navigate('/admin')
                  } else {
                    enterBranch(val)
                    navigate(`/admin/branches/${val}/overview`)
                  }
                }}
                className="w-full h-10 px-3 pr-8 bg-[#1A1A1A] hover:bg-[#222] border border-[#333] hover:border-[#444] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer appearance-none outline-none focus:border-amber-400"
              >
                <option value="__global__">
                  🌐 Global Admin (All Branches)
                </option>
                <option disabled>──────────────</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code === 'TEXTILE' ? '🔵 Taj Textiles (White & Blue)' : '🌸 Mariyam Kids World (White & Pink)'}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Navigation Links based on mode */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {isBranchMode ? `${currentBranch?.name || 'Branch'} Workspace` : 'Global Management'}
            </div>

            {isBranchMode
              ? branchNavItems.map((item) => {
                  const active = currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 shadow-sm font-bold'
                          : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className={active ? 'text-amber-400' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      ) : (
                        active && <ChevronRight size={14} className="text-amber-400 shrink-0" />
                      )}
                    </button>
                  )
                })
              : globalNavItems.map((item) => {
                  const active = currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 text-amber-300 border border-[#D4AF37]/30 shadow-sm font-bold'
                          : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className={active ? 'text-amber-400' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {active && <ChevronRight size={14} className="text-amber-400 shrink-0" />}
                    </button>
                  )
                })}

            {isBranchMode && (
              <div className="pt-4 mt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    exitBranch()
                    navigate('/admin')
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Exit to Global Admin</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick branch buttons when in Global mode */}
          {!isBranchMode && (
            <div className="p-3 border-t border-[#222222] bg-[#0E0E0E]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-1">
                Enter Branch Node
              </div>
              <div className="space-y-1.5">
                {availableBranches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      enterBranch(b.id)
                      navigate(`/admin/branches/${b.id}/overview`)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          b.code === 'GROCERY' ? 'bg-pink-400' : 'bg-blue-400'
                        }`}
                      />
                      <span className="truncate">{b.name}</span>
                    </span>
                    <ChevronRight size={13} className="text-gray-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#222222] bg-[#0A0A0A] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-200 truncate">Administrator</div>
                <div className="text-[10px] text-gray-400 truncate">Taj & Mariyam HQ</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A]">
        {/* Top App Bar */}
        <header className="h-14 border-b border-[#222222] bg-[#111111]/90 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            {isBranchMode && currentBranch ? (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isGrocery
                      ? 'bg-pink-950/60 text-pink-300 border border-pink-700/50'
                      : 'bg-blue-950/60 text-blue-300 border border-blue-700/50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isGrocery ? 'bg-pink-400' : 'bg-blue-400'
                    } animate-pulse`}
                  />
                  Operating in: {currentBranch.name}
                </span>
                <span className="text-xs text-gray-400 hidden lg:inline">
                  {currentBranch.userName} • {currentBranch.address}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  All {availableBranches.length} Branches Online
                </span>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Global Control Plane • Taj & Mariyam Retail Group
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isBranchMode ? (
              <button
                type="button"
                onClick={() => {
                  exitBranch()
                  navigate('/admin')
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] text-xs font-bold text-amber-300 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} /> Exit to Global
              </button>
            ) : (
              <div className="text-right">
                <div className="text-[11px] font-bold text-gray-300 tracking-wide">
                  TAJ & MARIYAM RETAIL GROUP
                </div>
                <div className="text-[9px] text-gray-500">Pallavaram, Chennai</div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
      </main>
    </div>
  )
}
export default AdminLayout
