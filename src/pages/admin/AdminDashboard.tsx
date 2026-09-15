import React, { useState } from 'react'
import { AdminLayout, type AdminTab } from './AdminLayout'
import { AdminOverview } from './AdminOverview'
import { BranchMonitoringView } from './BranchMonitoringView'
import { StaffManagementView } from './StaffManagementView'
import { CrossBranchSalesView } from './CrossBranchSalesView'
import { CrossBranchInventoryView } from './CrossBranchInventoryView'
import { ReportsView } from './ReportsView'

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview')

  return (
    <AdminLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'overview' && <AdminOverview onNavigateTab={setCurrentTab} />}
      {currentTab === 'branch_textile' && (
        <BranchMonitoringView branchCode="TEXTILE" onBack={() => setCurrentTab('overview')} />
      )}
      {currentTab === 'branch_grocery' && (
        <BranchMonitoringView branchCode="GROCERY" onBack={() => setCurrentTab('overview')} />
      )}
      {currentTab === 'sales' && <CrossBranchSalesView />}
      {currentTab === 'inventory' && <CrossBranchInventoryView />}
      {currentTab === 'staff' && <StaffManagementView />}
      {currentTab === 'reports' && <ReportsView />}
    </AdminLayout>
  )
}
