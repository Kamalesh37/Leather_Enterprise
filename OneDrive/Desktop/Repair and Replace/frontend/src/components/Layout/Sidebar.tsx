import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  TrendingUp,
  Users,
  Cpu,
  Truck,
  QrCode,
  Wrench,
  CheckSquare,
  Package,
  Boxes,
  ScrollText,
  ShieldCheck,
  Zap,
  Layers,
  Building,
  MapPin,
  ArrowUp,
  FileText,
  Send,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'crew'
  | 'machines'
  | 'vendors'
  | 'supervisor'
  | 'mechanic'
  | 'tech_lead'
  | 'spare_head'
  | 'inventory'
  | 'audit_ledger'
  | 'work_reports';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: string[];
  permission?: 'can_manage_vendors' | 'can_edit_machines' | 'can_assign_mechanics' | 'can_approve_diagnostics' | 'can_dispatch_spares' | 'can_adjust_inventory_stock' | 'can_view_analytics' | null;
  badge?: string;
  counter?: number;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingApprovalsCount?: number;
  pendingDispatchesCount?: number;
  pendingReportsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount = 0,
  pendingDispatchesCount = 0,
  pendingReportsCount = 0,
}) => {
  const { user, hasPermission } = useAuth();

  const getAppTitle = (role?: string) => {
    switch (role) {
      case 'admin':
        return '🏢 Enterprise Admin Suite';
      case 'block_manager':
        return '🏢 Block Management Portal';
      case 'floor_manager':
        return '📐 Floor Operations Portal';
      case 'line_supervisor':
        return '⚙️ Line Supervisor App';
      case 'mechanic':
        return '🔧 Technician Mobile Console';
      case 'tech_lead':
        return '🔬 Tech Lead Engineering App';
      case 'spare_head':
        return '📦 Warehouse & Parts App';
      default:
        return 'Enterprise Portal';
    }
  };

  const groups: NavGroup[] = [
    {
      heading: 'FACTORY OVERSIGHT',
      items: [
        {
          id: 'crew',
          label: 'Crew & Reporting Tree',
          icon: Users,
          roles: ['admin'],
          permission: null,
          badge: 'Admin',
        },
        {
          id: 'machines',
          label: 'Machinery Registry',
          icon: Cpu,
          roles: ['admin', 'block_manager', 'floor_manager', 'line_supervisor', 'mechanic', 'tech_lead', 'spare_head'],
          permission: null,
        },
        {
          id: 'vendors',
          label: 'Machinery Vendors',
          icon: Truck,
          roles: ['admin', 'spare_head', 'tech_lead'],
          permission: 'can_manage_vendors',
        },
      ],
    },
    {
      heading: 'MAINTENANCE & REPAIR PIPELINE',
      items: [
        {
          id: 'supervisor',
          label: 'Line Supervisor Station',
          icon: QrCode,
          roles: ['admin', 'block_manager', 'floor_manager', 'line_supervisor'],
          permission: null,
        },
        {
          id: 'mechanic',
          label: 'Mechanic Workbench',
          icon: Wrench,
          roles: ['admin', 'mechanic'],
          permission: null,
        },
        {
          id: 'tech_lead',
          label: 'Tech Lead Approvals',
          icon: CheckSquare,
          roles: ['admin', 'tech_lead'],
          permission: 'can_approve_diagnostics',
          counter: pendingApprovalsCount,
        },
      ],
    },
    {
      heading: 'OPERATIONAL REPORTING & ESCALATION',
      items: [
        {
          id: 'work_reports',
          label: 'Work Reports & Higher Sign-off',
          icon: FileText,
          roles: ['admin', 'block_manager', 'floor_manager', 'line_supervisor', 'mechanic', 'tech_lead', 'spare_head'],
          permission: null,
          counter: pendingReportsCount,
        },
      ],
    },
    {
      heading: 'WAREHOUSE & INVENTORY',
      items: [
        {
          id: 'spare_head',
          label: 'Spare Head Dispatch',
          icon: Package,
          roles: ['admin', 'spare_head'],
          permission: 'can_dispatch_spares',
          counter: pendingDispatchesCount,
        },
        {
          id: 'inventory',
          label: 'Central Parts Storage',
          icon: Boxes,
          roles: ['admin', 'spare_head', 'mechanic', 'tech_lead'],
          permission: null,
        },
        {
          id: 'audit_ledger',
          label: 'Inventory Audit Ledger',
          icon: ScrollText,
          roles: ['admin', 'spare_head', 'block_manager', 'tech_lead'],
          permission: null,
        },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      {/* Active App Header in Sidebar */}
      {user && (
        <div
          style={{
            padding: '12px 14px',
            marginBottom: '8px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ACTIVE APPLICATION
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', marginTop: '2px' }}>
            {getAppTitle(user.role)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Account: <strong style={{ color: '#fff' }}>{user.name}</strong>
          </div>
          {user.higher_official && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUp size={11} color="var(--primary-light)" />
              <span>Reports to: <strong style={{ color: 'var(--text-primary)' }}>{user.higher_official.name}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* DEDICATED ALWAYS-PRESENT ENTERPRISE ANALYTICS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
        <div className="sidebar-menu-heading" style={{ color: 'var(--accent-cyan)' }}>
          INTELLIGENCE & KPIS
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
            style={
              activeTab === 'dashboard'
                ? {
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.18) 100%)',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.15)',
                  }
                : {
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }
            }
          >
            <BarChart3 size={18} color={activeTab === 'dashboard' ? '#38bdf8' : 'var(--text-secondary)'} />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>
              Live Plant Analytics
            </span>
            <span
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#34d399',
                  display: 'inline-block',
                }}
              ></span>
              LIVE
            </span>
          </button>
        </nav>
      </div>

      {groups.map((group, gIdx) => {
        const visibleItems = group.items.filter((item) => {
          const isAllowedRole = !item.roles || item.roles.includes(user?.role || '');
          const isAllowedPerm = !item.permission || hasPermission(item.permission);
          return isAllowedRole || isAllowedPerm || user?.role === 'admin';
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="sidebar-menu-heading">{group.heading}</div>
            <nav className="sidebar-nav">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.badge && <span className="badge badge-primary">{item.badge}</span>}
                    {typeof item.counter === 'number' && item.counter > 0 && (
                      <span className="badge badge-rose">{item.counter}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        );
      })}

      <div className="sidebar-footer">
        <div className="role-security-badge">
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span>RBAC Matrix Verified</span>
        </div>
      </div>
    </aside>
  );
};
