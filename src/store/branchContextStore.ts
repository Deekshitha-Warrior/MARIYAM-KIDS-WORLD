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
  name: 'Taj textiles',
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
  name: 'MARIYAM KIDS WORLD',
  branchType: 'grocery',
  isActive: true,
  userName: 'AANISHA BANU MOHAMMED ANSARI',
  phone: '9003024922 | 9445050934',
  email: 'mariyamkidsworld2025@gmail.com',
  address: '100, P.V. VAITHIYALINGAM road old Pallavaram Chennai 600117',
}

interface BranchContextState {
  activeBranch: Branch
  availableBranches: Branch[]
  setBranch: (branch: Branch) => void
  setBranchById: (branchId: string) => void
  setAvailableBranches: (branches: Branch[]) => void
  getActiveBranchId: () => string
}

export const useBranchContextStore = create<BranchContextState>()(
  persist(
    (set, get) => ({
      activeBranch: DEFAULT_TEXTILE_BRANCH,
      availableBranches: [DEFAULT_TEXTILE_BRANCH, DEFAULT_GROCERY_BRANCH],
      setBranch: (branch) => set({ activeBranch: branch }),
      setBranchById: (branchId) => {
        const found = get().availableBranches.find((b) => b.id === branchId)
        if (found) {
          set({ activeBranch: found })
        }
      },
      setAvailableBranches: (branches) => {
        set({ availableBranches: branches })
        // If current active branch isn't in new list, fallback to first active
        const current = get().activeBranch
        const exists = branches.find((b) => b.id === current.id)
        if (!exists && branches.length > 0) {
          set({ activeBranch: branches[0] })
        }
      },
      getActiveBranchId: () => get().activeBranch.id,
    }),
    {
      name: 'clad-pos-branch-context',
    }
  )
)
