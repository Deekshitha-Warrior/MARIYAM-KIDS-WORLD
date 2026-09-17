import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Branch {
  id: string
  code: string
  name: string
  branchType: 'retail' | 'grocery' | string
  isActive: boolean
  userName?: string
  phone?: string
  email?: string
  address?: string
}

export const DEFAULT_TEXTILE_BRANCH: Branch = {
  id: 'b0000000-0000-0000-0000-000000000001',
  code: 'TEXTILE',
  name: 'Taj Textiles',
  branchType: 'retail',
  isActive: true,
  userName: 'Mohammed ansari',
  phone: '9442711949 / 9445050934',
  email: 'tajtextiles1965@gmail.com',
  address: '111, P.V. Vaithiyalingam road old Pallavaram Chennai 600117',
}

export const DEFAULT_GROCERY_BRANCH: Branch = {
  id: 'b0000000-0000-0000-0000-000000000002',
  code: 'GROCERY',
  name: 'Mariyam Kids World',
  branchType: 'grocery',
  isActive: true,
  userName: 'AANISHA BANU MOHAMMED ANSARI',
  phone: '9003024922 | 9445050934',
  email: 'mariyamkidsworld2025@gmail.com',
  address: '100, P.V. VAITHIYALINGAM road old Pallavaram Chennai 600117',
}

export interface BranchContextState {
  mode: 'global' | 'branch'
  activeBranch: Branch | null
  availableBranches: Branch[]
  enterBranch: (branchIdOrCode: string) => boolean
  exitBranch: () => void
  switchBranch: (branchIdOrCode: string) => boolean
  setBranch: (branch: Branch) => void
  setBranchById: (branchId: string) => void
  setAvailableBranches: (branches: Branch[]) => void
  getActiveBranchId: () => string | null
}

export const useBranchContextStore = create<BranchContextState>()(
  persist(
    (set, get) => ({
      mode: 'branch',
      activeBranch: DEFAULT_TEXTILE_BRANCH,
      availableBranches: [DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH],
      enterBranch: (branchIdOrCode: string) => {
        const needle = String(branchIdOrCode || '').trim().toLowerCase()
        const found = get().availableBranches.find(
          (b) => b.id.toLowerCase() === needle || b.code.toLowerCase() === needle
        )
        if (found) {
          set({ activeBranch: found, mode: 'branch' })
          return true
        }
        return false
      },
      exitBranch: () => {
        set({ activeBranch: null, mode: 'global' })
      },
      switchBranch: (branchIdOrCode: string) => {
        return get().enterBranch(branchIdOrCode)
      },
      setBranch: (branch) => set({ activeBranch: branch, mode: 'branch' }),
      setBranchById: (branchId) => {
        get().enterBranch(branchId)
      },
      setAvailableBranches: (branches) => {
        set({ availableBranches: branches })
        const current = get().activeBranch
        if (current) {
          const exists = branches.find((b) => b.id === current.id)
          if (!exists && branches.length > 0) {
            set({ activeBranch: branches[0], mode: 'branch' })
          }
        }
      },
      getActiveBranchId: () => get().activeBranch?.id ?? null,
    }),
    {
      name: 'pos-branch-context',
    }
  )
)
