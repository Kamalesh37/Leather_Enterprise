import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { User, Role } from '../../types';
import {
  Shield,
  Building,
  Layers,
  MapPin,
  Users,
  Wrench,
  Sparkles,
  ArrowDown,
  ArrowRight,
  UserCheck,
  Phone,
  Mail,
  Activity,
  Award,
} from 'lucide-react';

interface ReportingHierarchyTreeProps {
  onSelectUser?: (user: User) => void;
}

export const ReportingHierarchyTree: React.FC<ReportingHierarchyTreeProps> = ({ onSelectUser }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Api.getReportingHierarchy()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        Loading enterprise reporting structure...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No reporting structure data available.
      </div>
    );
  }

  const { plant_director, block_managers, floor_managers, line_supervisors, mechanics, specialists, summary } = data;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Banner */}
      <div
        className="card"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Shield size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Enterprise Reporting Chain & Hierarchy Matrix
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
              Multi-tier chain of command. Every floor has a dedicated <strong>Floor Manager</strong>, lines are managed by <strong>Line Supervisors</strong>, and all shopfloor technicians report to their designated higher officials.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '8px 14px', textAlign: 'center', background: 'var(--bg-card-solid)' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {summary.floor_managers_count}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>FLOOR MANAGERS</div>
            </div>

            <div className="card" style={{ padding: '8px 14px', textAlign: 'center', background: 'var(--bg-card-solid)' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {summary.line_supervisors_count}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>LINE SUPERVISORS</div>
            </div>

            <div className="card" style={{ padding: '8px 14px', textAlign: 'center', background: 'var(--bg-card-solid)' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                {summary.mechanics_count}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TECHNICIANS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier 1: Plant Director & Executive Leadership */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: '0.05em', marginBottom: '8px' }}>
          LEVEL 1: PLANT LEADERSHIP & EXECUTIVE DIRECTOR
        </div>

        {plant_director && (
          <div
            className="card"
            style={{
              padding: '16px 24px',
              minWidth: '320px',
              maxWidth: '440px',
              textAlign: 'center',
              border: '2px solid var(--primary)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
              cursor: onSelectUser ? 'pointer' : 'default',
            }}
            onClick={() => onSelectUser && onSelectUser(plant_director)}
          >
            <div style={{ display: 'inline-block', padding: '6px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', marginBottom: '8px' }}>
              <Award size={24} color="var(--primary-light)" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{plant_director.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '6px' }}>
              {plant_director.email} &bull; {plant_director.phone}
            </div>
            <span className="badge badge-primary">Plant Director & General Operations Admin</span>
          </div>
        )}

        <ArrowDown size={22} color="var(--primary)" style={{ margin: '8px 0' }} />
      </div>

      {/* Tier 2: Block Operations & Specialists */}
      <div>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '10px' }}>
          LEVEL 2: COMPLEX BLOCK MANAGERS & SPECIALIZED FUNCTIONAL LEADS (REPORT TO PLANT DIRECTOR)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Block A Manager */}
          {block_managers?.map((bm: User) => (
            <div
              key={bm.id}
              className="card"
              style={{
                padding: '16px',
                border: '1px solid var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.04)',
                cursor: onSelectUser ? 'pointer' : 'default',
              }}
              onClick={() => onSelectUser && onSelectUser(bm)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>{bm.name}</span>
                </div>
                <span className="badge badge-cyan">{bm.block?.name || 'Block Manager'}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {bm.email} &bull; {bm.phone}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Reports to: <strong>Arthur Vance (Plant Director)</strong>
              </div>
            </div>
          ))}

          {/* Tech Lead & Spare Head */}
          {specialists?.tech_leads?.map((tl: User) => (
            <div
              key={tl.id}
              className="card"
              style={{
                padding: '16px',
                border: '1px solid var(--accent-purple)',
                background: 'rgba(168, 85, 247, 0.04)',
                cursor: onSelectUser ? 'pointer' : 'default',
              }}
              onClick={() => onSelectUser && onSelectUser(tl)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--accent-purple)" />
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>{tl.name}</span>
                </div>
                <span className="badge badge-purple">Chief Diagnostics Lead</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {tl.email} &bull; {tl.phone}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Technical Authority &bull; Reports to: <strong>Arthur Vance (Plant Director)</strong>
              </div>
            </div>
          ))}

          {specialists?.spare_heads?.map((sh: User) => (
            <div
              key={sh.id}
              className="card"
              style={{
                padding: '16px',
                border: '1px solid var(--accent-indigo)',
                background: 'rgba(99, 102, 241, 0.04)',
                cursor: onSelectUser ? 'pointer' : 'default',
              }}
              onClick={() => onSelectUser && onSelectUser(sh)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>{sh.name}</span>
                </div>
                <span className="badge badge-indigo">Warehouse & Spares Lead</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {sh.email} &bull; {sh.phone}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Inventory Custodian &bull; Reports to: <strong>Arthur Vance (Plant Director)</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 3: Floor Operations Managers (Every Floor has a dedicated Floor Manager) */}
      <div>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', letterSpacing: '0.05em', marginBottom: '12px' }}>
          LEVEL 3: DESIGNATED FLOOR MANAGERS (FOR EVERY FLOOR &bull; REPORT TO BLOCK MANAGER)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {floor_managers?.map((fm: User) => {
            // Find lines under this floor
            const linesUnderFloor = line_supervisors?.filter(
              (ls: User) => ls.floor_id === fm.floor_id || ls.floor?.id === fm.floor_id
            );

            return (
              <div
                key={fm.id}
                className="card"
                style={{
                  padding: '16px',
                  border: '1px solid var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={16} color="var(--accent-emerald)" />
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{fm.name}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '2px' }}>
                      {fm.floor?.name || `Floor ${fm.floor_id}`} Manager
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {fm.email} &bull; {fm.phone}
                    </div>
                  </div>
                  <span className="badge badge-emerald">Floor Manager</span>
                </div>

                <div style={{ padding: '8px 10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Reports to: <strong>{fm.manager?.name || 'Dominic Sterling (Block Manager)'}</strong>
                </div>

                {/* Subordinate Lines under this Floor Manager */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Lines Supervised under this Floor ({linesUnderFloor?.length || 0}):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {linesUnderFloor?.map((ls: User) => {
                      const mechanicsOnLine = mechanics?.filter(
                        (m: User) => m.line_id === ls.line_id || m.line?.id === ls.line_id
                      );

                      return (
                        <div
                          key={ls.id}
                          style={{
                            background: 'var(--bg-card)',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={13} color="var(--accent-amber)" />
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {ls.name}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                ({ls.line?.name || `Line ${ls.line_id}`})
                              </span>
                            </div>
                            <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>Supervisor</span>
                          </div>

                          {/* Mechanics on this Line */}
                          {mechanicsOnLine && mechanicsOnLine.length > 0 && (
                            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed rgba(255, 255, 255, 0.06)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Technicians: </span>
                              {mechanicsOnLine.map((tech: User) => tech.name).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
