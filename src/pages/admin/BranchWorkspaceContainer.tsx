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
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-red-200 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
          <AlertOctagon size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Branch Access Rejected (404)
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            No branch matching identifier <code className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-amber-600 font-mono">{branchId}</code> exists in the organization database.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Silent fallback is disabled to guarantee branch state isolation and avoid accidental cross-tenant data operations.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Building2 size={14} className="text-amber-500" />
            <span>Available Authorized Branches</span>
          </div>
          <div className="space-y-2">
            {availableBranches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/admin/branches/${b.id}/overview`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-left shadow-2xs"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{b.name}</div>
                  <div className="text-[10px] text-slate-500">{b.branchType.toUpperCase()} Node • {b.phone}</div>
                </div>
                <span className="text-xs text-blue-600 font-semibold">Enter Workspace →</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md"
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
