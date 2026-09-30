import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AdminOverview } from './AdminOverview'
import { StaffManagementView } from './StaffManagementView'
import { BranchWorkspaceContainer } from './BranchWorkspaceContainer'
import { useBranchContextStore } from '../../store/branchContextStore'

function GlobalModeSync({ children }: { children: React.ReactNode }) {
  const exitBranch = useBranchContextStore((s) => s.exitBranch)
  useEffect(() => {
    exitBranch()
  }, [exitBranch])
  return <>{children}</>
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route
          path=""
          element={
            <GlobalModeSync>
              <AdminOverview />
            </GlobalModeSync>
          }
        />
        <Route
          path="staff"
          element={
            <GlobalModeSync>
              <StaffManagementView />
            </GlobalModeSync>
          }
        />
        <Route path="branches/:branchId" element={<BranchWorkspaceContainer />} />
        <Route path="branches/:branchId/:tab" element={<BranchWorkspaceContainer />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}
