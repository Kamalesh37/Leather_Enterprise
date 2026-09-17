import React from 'react';
import { User, ReportingChainNode } from '../../types';
import { Modal } from '../Common/Modal';
import {
  Shield,
  Building,
  Layers,
  MapPin,
  Mail,
  Phone,
  ArrowUp,
  UserCheck,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';

interface ReportingChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ReportingChainModal: React.FC<ReportingChainModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!user) return null;

  const chain = user.reporting_chain || [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-primary">Plant Director / Admin</span>;
      case 'block_manager':
        return <span className="badge badge-cyan">Block Manager</span>;
      case 'floor_manager':
        return <span className="badge badge-emerald">Floor Manager</span>;
      case 'line_supervisor':
        return <span className="badge badge-amber">Line Supervisor</span>;
      case 'mechanic':
        return <span className="badge badge-rose">Maintenance Technician</span>;
      case 'tech_lead':
        return <span className="badge badge-purple">Chief Diagnostics Lead</span>;
      case 'spare_head':
        return <span className="badge badge-indigo">Spare Parts Lead</span>;
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
          <Shield size={20} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
              Chain of Command & Reporting Escalation
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Official reporting line from {user.name} to Executive Leadership
            </div>
          </div>
        </div>
      }
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Selected Employee Card */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="user-avatar-md">{user.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                {user.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.phone}</div>}
              </div>
            </div>
            {getRoleBadge(user.role)}
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Location Assignment:</span>
            <span>
              {user.block?.name || 'Block A'} &rsaquo; {user.floor?.name || 'Floor 1'} {user.line?.name ? `› ${user.line.name}` : ''}
            </span>
          </div>
        </div>

        {/* Chain of Command Flow */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowUp size={15} />
            <span>REPORTING HIERARCHY & ESCALATION LINE ({chain.length} TIERS)</span>
          </div>

          {chain.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              👑 This employee is at the top of the organizational structure (Plant Director / Executive Admin).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chain.map((official, idx) => (
                <div key={official.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: idx === 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      boxShadow: idx === 0 ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: idx === 0 ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: 700 }}>
                            LEVEL {idx + 1}: {idx === 0 ? 'DIRECT SUPERVISOR' : 'ESCALATION OFFICIAL'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {official.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {official.email} {official.phone ? `• ${official.phone}` : ''}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {getRoleBadge(official.role)}
                        {official.floor && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {official.floor} {official.line ? `• ${official.line}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {idx < chain.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ArrowUp size={14} color="var(--primary)" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
