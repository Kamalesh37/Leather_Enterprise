import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Api } from '../../api/client';
import { User, Role } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Lock,
  Mail,
  Shield,
  Building,
  Layers,
  MapPin,
  LogIn,
  Key,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, switchUser, user: currentUser } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState<string>('admin@leathermfg.com');
  const [password, setPassword] = useState<string>('password123');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'quick_accounts'>('quick_accounts');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      Api.listCrew().then((res) => {
        if (res.success && res.data) {
          setAllUsers(res.data);
        }
      });
    }
  }, [isOpen]);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success(`Successfully authenticated as ${email}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSwitch = async (user: User) => {
    setSubmitting(true);
    try {
      await switchUser(user.id);
      toast.success(`Switched active portal to ${user.name} (${user.role})`);
      onClose();
    } catch (err: any) {
      toast.error('Failed to switch user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const autofillCredentials = (user: User) => {
    setEmail(user.email);
    setPassword('password123');
    setActiveTab('credentials');
    toast.info(`Filled credentials for ${user.name}`);
  };

  // Group users by App Categories
  const adminUsers = allUsers.filter((u) => u.role === 'admin' || u.role === 'block_manager');
  const floorManagers = allUsers.filter((u) => u.role === 'floor_manager');
  const lineSupervisors = allUsers.filter((u) => u.role === 'line_supervisor');
  const mechanics = allUsers.filter((u) => u.role === 'mechanic');
  const specialists = allUsers.filter((u) => u.role === 'tech_lead' || u.role === 'spare_head');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-primary">Plant Director</span>;
      case 'block_manager':
        return <span className="badge badge-cyan">Block Manager</span>;
      case 'floor_manager':
        return <span className="badge badge-emerald">Floor Manager</span>;
      case 'line_supervisor':
        return <span className="badge badge-amber">Line Supervisor</span>;
      case 'mechanic':
        return <span className="badge badge-rose">Technician</span>;
      case 'tech_lead':
        return <span className="badge badge-purple">Tech Lead</span>;
      case 'spare_head':
        return <span className="badge badge-indigo">Spare Head</span>;
      default:
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={22} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              Portal Authentication & App Account Switcher
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Sign in with credentials or instantly launch dedicated apps for Admin, Floor Managers, Line Supervisors & Mechanics
            </div>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Default test password for all seeded users: <code style={{ color: 'var(--accent-cyan)' }}>password123</code>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'quick_accounts' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '0.82rem', padding: '8px' }}
            onClick={() => setActiveTab('quick_accounts')}
          >
            <Users size={15} />
            <span>Select App Portal / User Account ({allUsers.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'credentials' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '0.82rem', padding: '8px' }}
            onClick={() => setActiveTab('credentials')}
          >
            <Key size={15} />
            <span>Sign In with Email & Password</span>
          </button>
        </div>

        {activeTab === 'credentials' ? (
          /* Real Credential Login Form */
          <form onSubmit={handleCredentialLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', background: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Corporate Email Address *</label>
                  <div className="input-group">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. admin@leathermfg.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Security Password *</label>
                  <div className="input-group">
                    <Lock size={16} className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', marginTop: '6px', justifyContent: 'center' }}
                  disabled={submitting}
                >
                  <LogIn size={16} />
                  <span>{submitting ? 'Authenticating...' : 'Sign In & Launch Scoped App'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Categorized User Account Directory */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {/* 1. Admin & Operations Leadership */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} />
                <span>ENTERPRISE ADMIN & PLANT LEADERSHIP APPS</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {adminUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    style={{
                      background: currentUser?.id === u.id ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-input)',
                      border: currentUser?.id === u.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = currentUser?.id === u.id ? 'var(--primary)' : 'var(--border-color)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{u.name}</span>
                        {currentUser?.id === u.id && <span className="status-dot online"></span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Floor Managers */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} />
                <span>FLOOR OPERATIONS MANAGER APPS (DEDICATED PER FLOOR)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {floorManagers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    style={{
                      background: currentUser?.id === u.id ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-input)',
                      border: currentUser?.id === u.id ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-emerald)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = currentUser?.id === u.id ? 'var(--accent-emerald)' : 'var(--border-color)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{u.name}</span>
                        {currentUser?.id === u.id && <span className="status-dot online"></span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {u.floor?.name || `Floor ${u.floor_id}`} Manager
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Line Supervisors */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-amber)', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} />
                <span>LINE PRODUCTION SUPERVISOR APPS (STATIONS 1 TO 6)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {lineSupervisors.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    style={{
                      background: currentUser?.id === u.id ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-input)',
                      border: currentUser?.id === u.id ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-amber)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = currentUser?.id === u.id ? 'var(--accent-amber)' : 'var(--border-color)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{u.name}</span>
                        {currentUser?.id === u.id && <span className="status-dot online"></span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                        {u.line?.name || `Line ${u.line_id}`} &bull; {u.floor?.name || 'Floor'}
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Maintenance Technicians */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-rose)', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} />
                <span>SHOPFLOOR MAINTENANCE TECHNICIAN APPS</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {mechanics.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    style={{
                      background: currentUser?.id === u.id ? 'rgba(244, 63, 94, 0.18)' : 'var(--bg-input)',
                      border: currentUser?.id === u.id ? '1px solid var(--accent-rose)' : '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-rose)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = currentUser?.id === u.id ? 'var(--accent-rose)' : 'var(--border-color)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{u.name}</span>
                        {currentUser?.id === u.id && <span className="status-dot online"></span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Assigned: {u.line?.name || 'Line'}
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Specialized Engineering Wings */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-purple)', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} />
                <span>SPECIALIZED ENGINEERING & WAREHOUSE PORTALS</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {specialists.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    style={{
                      background: currentUser?.id === u.id ? 'rgba(168, 85, 247, 0.18)' : 'var(--bg-input)',
                      border: currentUser?.id === u.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-purple)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = currentUser?.id === u.id ? 'var(--accent-purple)' : 'var(--border-color)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{u.name}</span>
                        {currentUser?.id === u.id && <span className="status-dot online"></span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
