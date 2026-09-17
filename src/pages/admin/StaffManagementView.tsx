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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Staff & Branch Memberships
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated employee credentials and database RLS branch permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={14} /> 4 Members Bound to RLS
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Staff Roster ({members.length})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => {
            const isTextile = m.branchCode === 'TEXTILE'
            return (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                      isTextile
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-pink-50 text-pink-700 border border-pink-200'
                    }`}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      {m.name}
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          m.role === 'manager'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{m.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold uppercase ${
                        isTextile ? 'text-blue-700' : 'text-pink-700'
                      }`}
                    >
                      {m.branchName}
                    </div>
                    <div className="text-[10px] text-slate-400">RLS Branch ID Bound</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
