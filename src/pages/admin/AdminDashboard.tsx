import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AdminOverview } from './AdminOverview'
import { StaffManagementView } from './StaffManagementView'
import { CrossBranchSalesView } from './CrossBranchSalesView'
import { CrossBranchInventoryView } from './CrossBranchInventoryView'
import { ReportsView } from './ReportsView'
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
          path="sales"
          element={
            <GlobalModeSync>
              <CrossBranchSalesView />
            </GlobalModeSync>
          }
        />
        <Route
          path="inventory"
          element={
            <GlobalModeSync>
              <CrossBranchInventoryView />
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
        <Route
          path="reports"
          element={
            <GlobalModeSync>
              <ReportsView />
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
