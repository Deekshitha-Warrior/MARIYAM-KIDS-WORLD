import React from 'react'
import {
  LayoutDashboard,
  Store,
  TrendingUp,
  Package,
  Users,
  FileText,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { useAdminAuthStore } from '../../store/store'
import { BRAND_EN, BRAND_LOGO } from '../../lib/brand'
import { useBranchContextStore } from '../../store/branchContextStore'

export type AdminTab =
  | 'overview'
  | 'branch_textile'
  | 'branch_grocery'
  | 'sales'
  | 'inventory'
  | 'staff'
  | 'reports'

interface AdminLayoutProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const logout = useAdminAuthStore((s) => s.logout)
  const { availableBranches } = useBranchContextStore()

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: 'Business Overview', icon: <LayoutDashboard size={18} /> },
    {
      id: 'branch_textile',
      label: 'CLAD Textile',
      icon: <Store size={18} className="text-amber-400" />,
      badge: 'Branch',
    },
    {
      id: 'branch_grocery',
      label: 'CLAD Grocery',
      icon: <ShoppingBag size={18} className="text-emerald-400" />,
      badge: 'Branch',
    },
    { id: 'sales', label: 'Cross-Branch Sales', icon: <TrendingUp size={18} /> },
    { id: 'inventory', label: 'Consolidated Stock', icon: <Package size={18} /> },
    { id: 'staff', label: 'Staff & Memberships', icon: <Users size={18} /> },
    { id: 'reports', label: 'Business Reports', icon: <FileText size={18} /> },
  ]

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#121212] border-r border-[#222222] flex flex-col justify-between z-20">
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-[#222222] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#D4AF37]/40 flex items-center justify-center p-1.5 shadow-md">
              <img src={BRAND_LOGO} alt={BRAND_EN} className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-[#D4AF37]">
                {BRAND_EN}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ShieldCheck size={12} className="text-amber-400" />
                <span>Admin Orchestrator</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Navigation
            </div>
            {navItems.map((item) => {
              const active = currentTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 text-amber-300 border border-[#D4AF37]/30 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-amber-400' : 'text-gray-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#222222] text-gray-400">
                      {item.badge}
                    </span>
                  ) : (
                    active && <ChevronRight size={14} className="text-amber-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#222222] bg-[#0E0E0E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold">
                AD
              </div>
              <div>
                <div className="text-xs font-bold text-gray-200">Administrator</div>
                <div className="text-[10px] text-gray-400">CLAD Head Office</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A]">
        {/* Top App Bar */}
        <header className="h-14 border-b border-[#222222] bg-[#111111]/80 backdrop-blur px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Branches Online
            </span>
            <span className="text-xs text-gray-500">
              Connected to Supabase ({availableBranches.length} Active Nodes)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-bold text-gray-300">CLAD RETAIL GROUP</div>
              <div className="text-[9px] text-gray-500">Tamil Nadu, India</div>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
      </main>
    </div>
  )
}
