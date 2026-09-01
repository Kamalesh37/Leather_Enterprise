import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role, User } from '../../types';
import { Api } from '../../api/client';
import { LoginModal } from '../Auth/LoginModal';
import { WorkReportModal } from '../WorkReports/WorkReportModal';
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
  LogIn,
  Key,
  Users,
  ArrowUp,
  Sparkles,
  Wrench,
  FileText,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchUser, switchDemoRole, logout, loading } = useAuth();
  const [dbStatus, setDbStatus] = useState<string>('CONNECTED');
  const [dbType, setDbType] = useState<string>('DB');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);


  useEffect(() => {
    Api.getHealth()
      .then((res) => {
        if (res.success && res.data) {
          setDbStatus(res.data.database || 'CONNECTED');
          if ((res.data as any).connection) {
            setDbType((res.data as any).connection);
          }
        }
      })
      .catch(() => setDbStatus('OFFLINE'));

    Api.listCrew().then((res) => {
      if (res.success && res.data) {
        setAllUsers(res.data);
      }
    });
  }, []);

  const getPortalTitle = (role?: Role) => {
    switch (role) {
      case 'admin':
        return 'Admin Suite';
      case 'block_manager':
        return 'Block Ops Portal';
      case 'floor_manager':
        return 'Floor Manager Portal';
      case 'line_supervisor':
        return 'Line Supervisor App';
      case 'mechanic':
        return 'Technician Workbench';
      case 'tech_lead':
        return 'Tech Lead App';
      case 'spare_head':
        return 'Warehouse App';
      default:
        return 'Plant Portal';
    }
  };

  const getPortalColor = (role?: Role) => {
    switch (role) {
      case 'admin':
        return '#818cf8';
      case 'block_manager':
        return '#38bdf8';
      case 'floor_manager':
        return '#34d399';
      case 'line_supervisor':
        return '#fbbf24';
      case 'mechanic':
        return '#fb923c';
      case 'tech_lead':
        return '#c084fc';
      case 'spare_head':
        return '#f43f5e';
      default:
        return '#818cf8';
    }
  };

  const adminUsers = allUsers.filter((u) => u.role === 'admin' || u.role === 'block_manager');
  const floorManagers = allUsers.filter((u) => u.role === 'floor_manager');
  const lineSupervisors = allUsers.filter((u) => u.role === 'line_supervisor');
  const mechanics = allUsers.filter((u) => u.role === 'mechanic');
  const specialists = allUsers.filter((u) => u.role === 'tech_lead' || u.role === 'spare_head');

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
          <span>{dbType}: {dbStatus}</span>
        </div>

        {user && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${getPortalColor(user.role)}40`,
              fontSize: '0.78rem',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: getPortalColor(user.role),
              }}
            ></span>
            <span style={{ fontWeight: 700, color: getPortalColor(user.role) }}>
              ACTIVE APP: {getPortalTitle(user.role)}
            </span>
          </div>
        )}
      </div>

      <div className="navbar-actions">
        {/* Quick Report Work Done Button */}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          onClick={() => setReportModalOpen(true)}
          title="Submit Shift & Work Done Report to Higher Official"
        >
          <FileText size={14} />
          <span>Report Work Done</span>
        </button>

        {/* Sign In with Credentials Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.8rem', padding: '6px 10px', border: '1px solid var(--border-color)' }}
          onClick={() => setLoginModalOpen(true)}
          title="Sign in with credentials"
        >
          <Key size={14} color="var(--accent-cyan)" />
          <span>Login / Switch App</span>
        </button>


        {/* User Account & App Persona Switcher */}
        <div className="role-switcher-container">
          <button
            className="role-switcher-btn"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            disabled={loading}
            title="Switch User Account & Scoped App"
            style={{ border: `1px solid ${getPortalColor(user?.role)}80` }}
          >
            <Shield size={16} color={getPortalColor(user?.role)} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff', lineHeight: 1.1 }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: getPortalColor(user?.role) }}>
                {getPortalTitle(user?.role)}
              </div>
            </div>
            <ChevronDown size={14} />
          </button>

          {roleDropdownOpen && (
            <div
              className="role-dropdown-menu"
              style={{
                width: '340px',
                maxHeight: '480px',
                overflowY: 'auto',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div className="role-dropdown-header" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                  SELECT ACTIVE USER / APP PORTAL
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Each user opens their designated scoped application
                </div>
              </div>

              {/* 1. Admin & Operations Leadership */}
              <div style={{ padding: '6px 12px 2px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase' }}>
                👑 Admin & Plant Leadership Suite
              </div>
              {adminUsers.map((u) => (
                <button
                  key={u.id}
                  className={`role-item ${user?.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u.id);
                    setRoleDropdownOpen(false);
                  }}
                  style={{ padding: '8px 12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u.role === 'admin' ? 'Plant Director / Executive' : u.block?.name || 'Block Manager'}</div>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>Admin</span>
                  </div>
                </button>
              ))}

              {/* 2. Floor Managers */}
              <div style={{ padding: '8px 12px 2px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                📐 Floor Operations Portals (Every Floor)
              </div>
              {floorManagers.map((u) => (
                <button
                  key={u.id}
                  className={`role-item ${user?.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u.id);
                    setRoleDropdownOpen(false);
                  }}
                  style={{ padding: '8px 12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>{u.floor?.name || `Floor ${u.floor_id}`} Manager</div>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>Floor Mgr</span>
                  </div>
                </button>
              ))}

              {/* 3. Line Supervisors */}
              <div style={{ padding: '8px 12px 2px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                ⚙️ Line Supervisor Stations (Lines 1 to 6)
              </div>
              {lineSupervisors.map((u) => (
                <button
                  key={u.id}
                  className={`role-item ${user?.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u.id);
                    setRoleDropdownOpen(false);
                  }}
                  style={{ padding: '8px 12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)' }}>{u.line?.name || `Line ${u.line_id}`} &bull; {u.floor?.name || 'Floor'}</div>
                    </div>
                    <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Supervisor</span>
                  </div>
                </button>
              ))}

              {/* 4. Maintenance Technicians */}
              <div style={{ padding: '8px 12px 2px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                🔧 Technician Mobile Workbenches
              </div>
              {mechanics.map((u) => (
                <button
                  key={u.id}
                  className={`role-item ${user?.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u.id);
                    setRoleDropdownOpen(false);
                  }}
                  style={{ padding: '8px 12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Assigned: {u.line?.name || 'Shopfloor'}</div>
                    </div>
                    <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>Technician</span>
                  </div>
                </button>
              ))}

              {/* 5. Specialists */}
              <div style={{ padding: '8px 12px 2px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                🔬 Specialized Leads
              </div>
              {specialists.map((u) => (
                <button
                  key={u.id}
                  className={`role-item ${user?.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u.id);
                    setRoleDropdownOpen(false);
                  }}
                  style={{ padding: '8px 12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-purple)' }}>{u.role === 'tech_lead' ? 'Tech Lead' : 'Spare Head'}</div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>Specialist</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Context Badge */}
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

      {/* Login & App Switcher Modal */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Work Report Submission Modal */}
      <WorkReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </header>
  );
};

