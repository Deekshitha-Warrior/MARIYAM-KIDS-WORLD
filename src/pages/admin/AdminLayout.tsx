import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Globe,
  Users,
  Power,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react'
import { useAdminAuthStore } from '../../store/store'
import { BRAND_EN, BRAND_LOGO } from '../../lib/brand'
import { useBranchContextStore } from '../../store/branchContextStore'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAdminAuthStore((s) => s.logout)
  const { availableBranches, activeBranch, enterBranch, exitBranch } =
    useBranchContextStore()

  // Determine current active section
  const isBranchMode = location.pathname.startsWith('/admin/branches/')
  let currentTab = 'overview'
  if (location.pathname.startsWith('/admin/staff')) {
    currentTab = 'staff'
  } else if (!isBranchMode) {
    currentTab = 'overview'
  }

  const selectedValue = isBranchMode && activeBranch ? activeBranch.id : '__global__'

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* Deep Maroon Sidebar matching reference screenshot */}
      <aside className="w-64 flex-shrink-0 bg-[#70121E] text-white flex flex-col justify-between z-20 shadow-xl select-none">
        <div className="flex flex-col overflow-y-auto hide-scrollbar flex-1 p-4 space-y-5">
          {/* Header: Logo, Brand Name, Admin Badge, and Collapse Arrow */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={BRAND_LOGO}
                  alt={BRAND_EN}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black tracking-wider uppercase text-white truncate">
                  {BRAND_EN}
                </h2>
                <span className="inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C59B27] text-white">
                  ADMIN
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                exitBranch()
                navigate('/admin')
              }}
              title="Return to Global Overview"
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* OPERATING BRANCH SECTION */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-rose-200/60 mb-1.5 block px-1">
              OPERATING BRANCH
            </label>
            <div className="relative">
              <select
                value={selectedValue}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__global__') {
                    exitBranch()
                    navigate('/admin')
                  } else {
                    enterBranch(val)
                    navigate(`/dashboard?branch=${val}`)
                  }
                }}
                className="w-full h-10 px-3 pr-8 bg-black/25 hover:bg-black/35 border border-white/10 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer appearance-none outline-none"
              >
                <option value="__global__" className="bg-[#70121E] text-white">
                  Global Admin (All Branches)
                </option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#70121E] text-white">
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
              />
            </div>
          </div>

          {/* MAIN NAV ITEM: Business Overview */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                exitBranch()
                navigate('/admin')
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'overview' && !isBranchMode
                  ? 'bg-[#d4af37] text-slate-950 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <Globe
                size={18}
                className={
                  currentTab === 'overview' && !isBranchMode ? 'text-slate-950' : 'text-white/80'
                }
              />
              <span>Business Overview</span>
            </button>
          </div>

          {/* ENTER BRANCH WORKSPACE */}
          <div className="pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-200/60 mb-2 px-1">
              ENTER BRANCH WORKSPACE
            </div>
            <div className="space-y-1">
              {availableBranches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    enterBranch(b.id)
                    navigate(`/dashboard?branch=${b.id}`)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="truncate">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STAFF & MEMBERSHIPS */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                exitBranch()
                navigate('/admin/staff')
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'staff'
                  ? 'bg-[#d4af37] text-slate-950 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <Users
                size={18}
                className={
                  currentTab === 'staff' ? 'text-slate-950' : 'text-white/80'
                }
              />
              <span>Staff & Memberships</span>
            </button>
          </div>
        </div>

        {/* LOGOUT BUTTON AT BOTTOM */}
        <div className="p-4 border-t border-white/10 bg-[#65101b] shrink-0">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Power size={18} className="text-white/80" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
