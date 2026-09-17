import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
        {
          id: 'overview',
          label: 'Branch Hub',
          path: `/admin/branches/${currentBranch.id}/overview`,
          icon: <Store size={18} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} />,
        },
        {
          id: 'dashboard',
          label: 'Store Dashboard (Sidebar)',
          path: `/dashboard?branch=${currentBranch.id}`,
          icon: <LayoutDashboard size={18} className="text-indigo-600" />,
          badge: 'Sidebar & POS',
        },
        {
          id: 'inventory',
          label: 'Stock & Inventory',
          path: `/admin/branches/${currentBranch.id}/inventory`,
          icon: <Package size={18} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} />,
        },
        {
          id: 'products',
          label: 'Categories & Catalog',
          path: `/admin/branches/${currentBranch.id}/products`,
          icon: <Layers size={18} className="text-emerald-600" />,
        },
        {
          id: 'barcodes',
          label: 'Barcode Generator',
          path: `/admin/branches/${currentBranch.id}/barcodes`,
          icon: <Barcode size={18} className="text-purple-600" />,
        },
        {
          id: 'expenses',
          label: 'Expenses Ledger',
          path: `/admin/branches/${currentBranch.id}/expenses`,
          icon: <FileSpreadsheet size={18} className="text-rose-600" />,
        },
        {
          id: 'orders',
          label: 'Advance & Custom Orders',
          path: `/admin/branches/${currentBranch.id}/orders`,
          icon: <ExternalLink size={18} className="text-sky-600" />,
        },
      ]
    : []

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between z-20 shadow-xs">
        <div className="flex flex-col overflow-y-auto hide-scrollbar flex-1">
          {/* Logo & Header */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shadow-xs shrink-0">
              <img src={BRAND_LOGO} alt={BRAND_EN} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black tracking-wider uppercase text-slate-900 truncate">
                {BRAND_EN}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <ShieldCheck size={12} className={isGrocery ? 'text-pink-600' : 'text-blue-600'} />
                <span className="truncate">Admin Orchestrator</span>
              </div>
            </div>
          </div>

          {/* SINGLE AUTHORITATIVE BRANCH SELECTOR */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Operating Branch</span>
              {isBranchMode && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${
                    isGrocery
                      ? 'bg-pink-100 text-pink-700 border-pink-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                >
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
                className={`w-full h-10 px-3 pr-8 bg-white hover:bg-slate-50 border rounded-xl text-xs font-bold transition-all cursor-pointer appearance-none outline-none shadow-xs ${
                  isBranchMode
                    ? isGrocery
                      ? 'border-pink-300 text-pink-900 focus:border-pink-500'
                      : 'border-blue-300 text-blue-900 focus:border-blue-500'
                    : 'border-slate-300 text-slate-800 focus:border-slate-500'
                }`}
              >
                <option value="__global__">🌐 Global Admin (All Branches)</option>
                <option disabled>──────────────</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code === 'TEXTILE'
                      ? '🔵 Taj Textiles'
                      : '🌸 MARIYAM KIDS WORLD'}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Navigation Links based on mode */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isBranchMode ? `${currentBranch?.name || 'Branch'} Workspace` : 'Global Management'}
            </div>

            {isBranchMode
              ? branchNavItems.map((item) => {
                  const active = currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.path.startsWith('/dashboard') && currentBranch) {
                          enterBranch(currentBranch.id)
                        }
                        navigate(item.path)
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                        active
                          ? isGrocery
                            ? 'bg-pink-50 text-pink-700 border border-pink-200 font-bold shadow-xs'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span
                          className={
                            active
                              ? isGrocery
                                ? 'text-pink-600'
                                : 'text-blue-600'
                              : 'text-slate-400'
                          }
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                            isGrocery
                              ? 'bg-pink-100 text-pink-700 border-pink-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        active && (
                          <ChevronRight
                            size={14}
                            className={isGrocery ? 'text-pink-600' : 'text-blue-600'}
                          />
                        )
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className={active ? 'text-white' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {active && <ChevronRight size={14} className="text-white shrink-0" />}
                    </button>
                  )
                })}

            {isBranchMode && (
              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    exitBranch()
                    navigate('/admin')
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Exit to Global Admin</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick branch buttons when in Global mode */}
          {!isBranchMode && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Enter Branch Workspace
              </div>
              <div className="space-y-1.5">
                {availableBranches.map((b) => {
                  const isB2 = b.code === 'GROCERY'
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        enterBranch(b.id)
                        navigate(`/admin/branches/${b.id}/overview`)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isB2
                          ? 'bg-pink-50/50 hover:bg-pink-50 border-pink-200/80 text-pink-900'
                          : 'bg-blue-50/50 hover:bg-blue-50 border-blue-200/80 text-blue-900'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isB2 ? 'bg-pink-500' : 'bg-blue-500'
                          }`}
                        />
                        <span className="truncate">{b.name}</span>
                      </span>
                      <ChevronRight size={13} className="text-slate-400 shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  isBranchMode
                    ? isGrocery
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                AD
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">Administrator</div>
                <div className="text-[10px] text-slate-500 truncate">Taj & Mariyam HQ</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        {/* Top App Bar */}
        <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            {isBranchMode && currentBranch ? (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isGrocery
                      ? 'bg-pink-50 text-pink-700 border border-pink-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isGrocery ? 'bg-pink-500' : 'bg-blue-500'
                    } animate-pulse`}
                  />
                  Operating in: {currentBranch.name}
                </span>
                <span className="text-xs text-slate-500 hidden lg:inline">
                  {currentBranch.userName} • {currentBranch.address}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All {availableBranches.length} Branches Online
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft size={13} /> Exit to Global
              </button>
            ) : (
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-800 tracking-wide">
                  TAJ & MARIYAM RETAIL GROUP
                </div>
                <div className="text-[9px] text-slate-500">Pallavaram, Chennai</div>
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
