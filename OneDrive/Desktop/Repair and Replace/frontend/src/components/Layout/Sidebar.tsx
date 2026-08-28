import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
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
  | 'audit_ledger';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount = 0,
  pendingDispatchesCount = 0,
}) => {
  const { user, hasPermission } = useAuth();

  const groups: NavGroup[] = [
    {
      heading: 'FACTORY OVERSIGHT',
      items: [
        {
          id: 'dashboard',
          label: 'Factory Analytics',
          icon: LayoutDashboard,
          roles: ['admin', 'block_manager', 'floor_manager', 'tech_lead'],
          permission: 'can_view_analytics',
        },
        {
          id: 'crew',
          label: 'Crew & RBAC Matrix',
          icon: Users,
          roles: ['admin'],
          permission: null,
          badge: 'Admin',
        },
        {
          id: 'machines',
          label: 'Machinery & QR Registry',
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
