import React from 'react';
import { Cpu, PieChart, QrCode, Wrench, Boxes, History } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  systemStatus: { status: string; database: string };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen,
  onCloseMobile,
  systemStatus,
}) => {
  const handleNavClick = (view: string) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-icon">
          <Cpu size={20} />
        </div>
        <div className="brand-text">
          <h1>RepairMatrix</h1>
          <span className="brand-badge">React & Laravel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Operations</div>
        <button
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <PieChart size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${activeView === 'qr-passport' ? 'active' : ''}`}
          onClick={() => handleNavClick('qr-passport')}
        >
          <QrCode size={18} />
          <span>QR Passport & Intake</span>
        </button>

        <button
          className={`nav-item ${activeView === 'repairs' ? 'active' : ''}`}
          onClick={() => handleNavClick('repairs')}
        >
          <Wrench size={18} />
          <span>Repairs Workbench</span>
        </button>

        <div className="nav-section-title">Inventory Control</div>
        <button
          className={`nav-item ${activeView === 'inventory' ? 'active' : ''}`}
          onClick={() => handleNavClick('inventory')}
        >
          <Boxes size={18} />
          <span>Parts & Stock</span>
        </button>

        <button
          className={`nav-item ${activeView === 'audit-logs' ? 'active' : ''}`}
          onClick={() => handleNavClick('audit-logs')}
        >
          <History size={18} />
          <span>Audit Ledger</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-widget">
          <div
            className="status-dot"
            style={{
              background:
                systemStatus.status === 'UP'
                  ? 'var(--accent-emerald)'
                  : systemStatus.status === 'DOWN'
                  ? 'var(--accent-rose)'
                  : 'var(--accent-amber)',
            }}
          />
          <div className="status-info">
            <span className="label">Backend Platform</span>
            <span className="value">{systemStatus.database || 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
