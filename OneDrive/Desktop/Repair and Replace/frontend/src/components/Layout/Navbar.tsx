import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Api } from '../../api/client';
import {
  Shield,
  Layers,
  UserCheck,
  Zap,
  Activity,
  LogOut,
  ChevronDown,
  Building,
  MapPin,
  Cpu,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchDemoRole, logout, loading } = useAuth();
  const [dbStatus, setDbStatus] = useState<string>('CONNECTED');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    Api.getHealth()
      .then((res) => {
        if (res.success && res.data) {
          setDbStatus(res.data.database || 'CONNECTED');
        }
      })
      .catch(() => setDbStatus('OFFLINE'));
  }, []);

  const roles: { role: Role; label: string; desc: string; color: string }[] = [
    { role: 'admin', label: 'Admin', desc: 'Global Access & System Provisioning', color: '#818cf8' },
    { role: 'block_manager', label: 'Block Manager', desc: 'Block Aggregated Downtime & Performance', color: '#38bdf8' },
    { role: 'floor_manager', label: 'Floor Manager', desc: 'Floor Lines & Repair Bottlenecks', color: '#34d399' },
    { role: 'line_supervisor', label: 'Line Supervisor', desc: 'Line QR Breakdown Intake & Mechanic Assign', color: '#fbbf24' },
    { role: 'mechanic', label: 'Mechanic', desc: 'Line Diagnostics & BOM Requisitions', color: '#fb923c' },
    { role: 'tech_lead', label: 'Tech Lead', desc: 'Diagnostic Validation, BOM Approval & Sign-off', color: '#c084fc' },
    { role: 'spare_head', label: 'Spare Head', desc: 'Central Bins & Atomic Inventory Dispatch', color: '#f43f5e' },
  ];

  const currentRoleInfo = roles.find((r) => r.role === user?.role) || roles[0];

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo-icon">
          <Cpu size={22} color="#6366f1" />
        </div>
        <div>
          <div className="navbar-title">
            LEATHER<span style={{ color: 'var(--primary)' }}>TECH</span>
          </div>
          <div className="navbar-subtitle">Enterprise Asset Maintenance & Spare Parts</div>
        </div>
      </div>

      <div className="navbar-center">
        <div className="system-health-pill">
          <span className={`status-dot ${dbStatus === 'CONNECTED' ? 'online' : 'offline'}`}></span>
          <span>PostgreSQL DB: {dbStatus}</span>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Role Switcher */}
        <div className="role-switcher-container">
          <button
            className="role-switcher-btn"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            disabled={loading}
            title="Switch Persona / Simulated Role"
          >
            <Shield size={16} color={currentRoleInfo.color} />
            <span style={{ fontWeight: 600 }}>{currentRoleInfo.label}</span>
            <ChevronDown size={14} />
          </button>

          {roleDropdownOpen && (
            <div className="role-dropdown-menu">
              <div className="role-dropdown-header">
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Simulate Role (Instant Testing)
                </div>
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  className={`role-item ${user?.role === r.role ? 'active' : ''}`}
                  onClick={() => {
                    switchDemoRole(r.role);
                    setRoleDropdownOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: r.color,
                      }}
                    ></span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Context & Node */}
        {user && (
          <div className="user-profile-badge">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-node">
                {user.line?.name ? (
                  <span>
                    <MapPin size={11} /> {user.line.name}
                  </span>
                ) : user.floor?.name ? (
                  <span>
                    <Layers size={11} /> {user.floor.name}
                  </span>
                ) : user.block?.name ? (
                  <span>
                    <Building size={11} /> {user.block.name}
                  </span>
                ) : (
                  <span>Global HQ</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
