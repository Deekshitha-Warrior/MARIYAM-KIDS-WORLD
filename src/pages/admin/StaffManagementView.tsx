import React, { useState } from 'react'
import { Users, Shield, Plus, CheckCircle, UserCheck } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: 'staff' | 'manager'
  branchName: string
  branchCode: 'TEXTILE' | 'GROCERY'
  isActive: boolean
}

export const StaffManagementView: React.FC = () => {
  const [members] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Mohammed ansari',
      email: 'tajtextiles1965@gmail.com',
      role: 'manager',
      branchName: 'Taj Textiles',
      branchCode: 'TEXTILE',
      isActive: true,
    },
    {
      id: '2',
      name: 'Textiles Billing Staff',
      email: 'staff.textile@tajtextiles.com',
      role: 'staff',
      branchName: 'Taj Textiles',
      branchCode: 'TEXTILE',
      isActive: true,
    },
    {
      id: '3',
      name: 'AANISHA BANU MOHAMMED ANSARI',
      email: 'mariyamkidsworld2025@gmail.com',
      role: 'manager',
      branchName: 'MARIYAM KIDS WORLD',
      branchCode: 'GROCERY',
      isActive: true,
    },
    {
      id: '4',
      name: 'Kids World Counter Staff',
      email: 'staff.kids@mariyamkidsworld.com',
      role: 'staff',
      branchName: 'MARIYAM KIDS WORLD',
      branchCode: 'GROCERY',
      isActive: true,
    },
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Staff & Branch Memberships
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage authenticated employee credentials and database RLS branch permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <CheckCircle size={14} /> 4 Members Bound to RLS
          </span>
        </div>
      </div>

      <div className="bg-[#141414] rounded-3xl border border-[#262626] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1A1A1A]/40">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Active Staff Roster ({members.length})
          </span>
        </div>

        <div className="divide-y divide-[#222222]">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-4 flex items-center justify-between hover:bg-[#1A1A1A]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                    m.branchCode === 'TEXTILE'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                  }`}
                >
                  {m.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {m.name}
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        m.role === 'manager'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div
                    className={`text-xs font-black uppercase ${
                      m.branchCode === 'TEXTILE' ? 'text-blue-400' : 'text-pink-400'
                    }`}
                  >
                    {m.branchName}
                  </div>
                  <div className="text-[10px] text-gray-500">RLS Branch ID Bound</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
