import React, { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useBranchContextStore } from '../../store/branchContextStore'
import { BranchWorkspace } from './BranchWorkspace'
import { AlertOctagon, ArrowLeft, Building2 } from 'lucide-react'

export const BranchWorkspaceContainer: React.FC = () => {
  const { branchId, tab } = useParams<{ branchId: string; tab?: string }>()
  const navigate = useNavigate()
  const { availableBranches, enterBranch } = useBranchContextStore()

  // Validate branch against availableBranches
  const branch = useMemo(() => {
    if (!branchId) return null
    const needle = branchId.trim().toLowerCase()
    return (
      availableBranches.find(
        (b) => b.id.toLowerCase() === needle || b.code.toLowerCase() === needle
      ) ?? null
    )
  }, [branchId, availableBranches])

  // Synchronize store when branch is valid — URL is the authoritative source of truth
  useEffect(() => {
    if (branch) {
      enterBranch(branch.id)
    }
  }, [branch, enterBranch])

  // Security / Error Boundary: Do NOT fall back silently to another branch!
  if (!branch) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-[#141414] border border-red-900/40 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-950/50 border border-red-800/40 flex items-center justify-center text-red-400">
          <AlertOctagon size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Branch Access Rejected (404)
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            No branch matching identifier <code className="bg-[#222] px-2 py-0.5 rounded text-amber-300 font-mono">{branchId}</code> exists in the organization database.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Silent fallback is disabled to guarantee branch state isolation and avoid accidental cross-tenant data operations.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2B2B2B] text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
            <Building2 size={14} className="text-amber-400" />
            <span>Available Authorized Branches</span>
          </div>
          <div className="space-y-2">
            {availableBranches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/admin/branches/${b.id}/overview`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#333] transition-colors cursor-pointer text-left"
              >
                <div>
                  <div className="text-xs font-bold text-white">{b.name}</div>
                  <div className="text-[10px] text-gray-400">{b.branchType.toUpperCase()} Node • {b.phone}</div>
                </div>
                <span className="text-xs text-amber-400 font-semibold">Enter Workspace →</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md"
          >
            <ArrowLeft size={15} /> Return to Global Business Overview
          </Link>
        </div>
      </div>
    )
  }

  // Keyed remounting: completely unmounts and isolates state on branch switch
  return (
    <BranchWorkspace
      key={branch.id}
      branch={branch}
      branchId={branch.id}
      tab={tab || 'overview'}
    />
  )
}
export default BranchWorkspaceContainer
