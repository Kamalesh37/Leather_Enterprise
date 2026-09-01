import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar, NavTab } from './components/Layout/Sidebar';
import { ExecutiveDashboard } from './components/Analytics/ExecutiveDashboard';
import { CrewList } from './components/Admin/CrewList';
import { MachineCatalog } from './components/Machines/MachineCatalog';
import { VendorCatalog } from './components/Vendors/VendorCatalog';
import { LineDashboard } from './components/Supervisor/LineDashboard';
import { MechanicWorkbench } from './components/Mechanic/MechanicWorkbench';
import { TechLeadApprovalQueue } from './components/TechLead/TechLeadApprovalQueue';
import { SpareHeadDispatchStation } from './components/SpareHead/SpareHeadDispatchStation';
import { InventoryGrid } from './components/Inventory/InventoryGrid';
import { AuditLedgerView } from './components/AuditLedger/AuditLedgerView';
import { WorkReportsView } from './components/WorkReports/WorkReportsView';
import { BreakdownIntakeModal } from './components/Supervisor/BreakdownIntakeModal';
import { Machine } from './types';
import { Api } from './api/client';

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [pendingDispatchesCount, setPendingDispatchesCount] = useState<number>(0);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

  // Cross-tab navigation filters
  const [catalogFilters, setCatalogFilters] = useState<{
    status?: string;
    line_id?: number | string;
    search?: string;
  }>({});

  // Global Breakdown Modal trigger for machine catalog
  const [breakdownModalOpen, setBreakdownModalOpen] = useState<boolean>(false);
  const [targetBreakdownMachine, setTargetBreakdownMachine] = useState<Machine | null>(null);

  // Fetch pending badge counters
  const fetchBadgeCounters = async () => {
    try {
      const [apprRes, dispRes, repRes] = await Promise.all([
        Api.listPendingApprovals(),
        Api.listPendingDispatches(),
        Api.getSubordinateWorkReports(),
      ]);

      if (apprRes.success && apprRes.data) {
        setPendingApprovalsCount(apprRes.data.length);
      }
      if (dispRes.success && dispRes.data) {
        setPendingDispatchesCount(dispRes.data.length);
      }
      if (repRes.success && repRes.data) {
        setPendingReportsCount(repRes.data.filter((r) => r.status === 'submitted').length);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchBadgeCounters();
    const interval = setInterval(fetchBadgeCounters, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Set intuitive default tab whenever simulated role changes
  useEffect(() => {
    if (!user) return;
    switch (user.role) {
      case 'admin':
        setActiveTab('dashboard');
        break;
      case 'block_manager':
      case 'floor_manager':
        setActiveTab('dashboard');
        break;
      case 'line_supervisor':
        setActiveTab('supervisor');
        break;
      case 'mechanic':
        setActiveTab('mechanic');
        break;
      case 'tech_lead':
        setActiveTab('tech_lead');
        break;
      case 'spare_head':
        setActiveTab('spare_head');
        break;
      default:
        setActiveTab('machines');
    }
  }, [user?.role]);

  const handleOpenBreakdownFromCatalog = (machine?: Machine) => {
    setTargetBreakdownMachine(machine || null);
    setBreakdownModalOpen(true);
  };

  const handleNavigateTab = (tab: NavTab, params?: any) => {
    if (tab === 'machines' && params) {
      setCatalogFilters({
        status: params.status || '',
        line_id: params.line_id || '',
        search: params.search || '',
      });
    }
    setActiveTab(tab);
  };

  return (
    <div className="app-layout">
      <Navbar />

      <div className="app-body">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingApprovalsCount={pendingApprovalsCount}
          pendingDispatchesCount={pendingDispatchesCount}
          pendingReportsCount={pendingReportsCount}
        />

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              onNavigateTab={handleNavigateTab}
              onOpenBreakdown={handleOpenBreakdownFromCatalog}
            />
          )}
          {activeTab === 'crew' && <CrewList />}
          {activeTab === 'machines' && (
            <MachineCatalog
              onOpenBreakdown={handleOpenBreakdownFromCatalog}
              initialStatus={catalogFilters.status}
              initialLineId={catalogFilters.line_id}
              initialSearch={catalogFilters.search}
            />
          )}
          {activeTab === 'vendors' && <VendorCatalog />}
          {activeTab === 'supervisor' && <LineDashboard />}
          {activeTab === 'mechanic' && <MechanicWorkbench />}
          {activeTab === 'tech_lead' && <TechLeadApprovalQueue />}
          {activeTab === 'spare_head' && <SpareHeadDispatchStation />}
          {activeTab === 'inventory' && <InventoryGrid />}
          {activeTab === 'audit_ledger' && <AuditLedgerView />}
          {activeTab === 'work_reports' && <WorkReportsView />}
        </main>
      </div>

      {/* Global Breakdown Intake Modal */}
      <BreakdownIntakeModal
        isOpen={breakdownModalOpen}
        onClose={() => setBreakdownModalOpen(false)}
        onSuccess={fetchBadgeCounters}
        machine={targetBreakdownMachine}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};
export default App;
