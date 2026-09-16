import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { User, Role } from '../../types';
import { CrewManagementModal } from './CrewManagementModal';
import { ReportingChainModal } from './ReportingChainModal';
import { ReportingHierarchyTree } from './ReportingHierarchyTree';
import { useToast } from '../Common/Toast';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Building,
  Layers,
  MapPin,
  Edit2,
  RefreshCw,
  X,
  ArrowUp,
  GitBranch,
  Table,
} from 'lucide-react';

export const CrewList: React.FC = () => {
  const toast = useToast();
  const [crew, setCrew] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activeView, setActiveView] = useState<'directory' | 'hierarchy'>('directory');

  // Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [chainModalOpen, setChainModalOpen] = useState<boolean>(false);
  const [selectedChainUser, setSelectedChainUser] = useState<User | null>(null);

  const fetchCrew = async (searchQuery: string = search) => {
    setLoading(true);
    try {
      const res = await Api.listCrew({
        search: searchQuery || undefined,
        role: selectedRole || undefined,
      });
      if (res.success && res.data) {
        setCrew(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load crew members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCrew(search);
    }, 220);
    return () => clearTimeout(timer);
  }, [search, selectedRole]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: 'rgba(99, 102, 241, 0.45)',
            color: '#fff',
            borderRadius: '2px',
            padding: '0 2px',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getRoleBadge = (role: Role) => {
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
        return <span className="badge badge-rose">Maintenance Technician</span>;
      case 'tech_lead':
        return <span className="badge badge-purple">Tech Lead</span>;
      case 'spare_head':
        return <span className="badge badge-indigo">Spare Head</span>;
      default:
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  const handleOpenChain = (user: User) => {
    setSelectedChainUser(user);
    setChainModalOpen(true);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Users size={24} color="var(--primary)" />
            <span>Crew Management & Reporting Hierarchy</span>
          </h2>
          <p className="section-description">
            Multi-tier organizational chain of command. Every floor has a dedicated <strong>Floor Manager</strong>, lines are supervised by <strong>Line Supervisors</strong>, and all employees report to their higher officials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* View Switcher Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeView === 'directory' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveView('directory')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Table size={14} />
              <span>Crew Directory</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeView === 'hierarchy' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveView('hierarchy')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <GitBranch size={14} />
              <span>Chain of Command Tree</span>
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            <UserPlus size={16} />
            <span>Add Crew Member</span>
          </button>
        </div>
      </div>

      {activeView === 'hierarchy' ? (
        <ReportingHierarchyTree onSelectUser={(u) => handleOpenChain(u)} />
      ) : (
        <>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="input-group" style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingRight: search ? '36px' : '14px' }}
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                className="form-select"
                style={{ width: '200px' }}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin / Plant Director</option>
                <option value="block_manager">Block Manager</option>
                <option value="floor_manager">Floor Manager</option>
                <option value="line_supervisor">Line Supervisor</option>
                <option value="mechanic">Maintenance Technician</option>
                <option value="tech_lead">Tech Lead</option>
                <option value="spare_head">Spare Head</option>
              </select>

              {(search || selectedRole) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSelectedRole('');
                  }}
                >
                  Reset All
                </button>
              )}

              <button type="button" className="btn btn-ghost" onClick={() => fetchCrew()} title="Refresh list">
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>

            {/* Live Filter Indicator */}
            {(search || selectedRole) && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Available Crew: <strong style={{ color: 'var(--text-primary)' }}>{crew.length} members</strong></span>
                {search && <span className="badge badge-primary">Search: "{search}"</span>}
                {selectedRole && <span className="badge badge-cyan">Role: {selectedRole}</span>}
              </div>
            )}
          </div>

          {/* Crew Table */}
          <div className="card table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crew Member</th>
                  <th>Role</th>
                  <th>Location Node</th>
                  <th>Reports To (Higher Official)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                      Loading crew members...
                    </td>
                  </tr>
                ) : crew.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No crew members found matching criteria.
                    </td>
                  </tr>
                ) : (
                  crew.map((member) => {
                    const higherOfficial = member.higher_official || member.manager;

                    return (
                      <tr key={member.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="user-avatar-sm">{member.name.charAt(0)}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{highlightMatch(member.name, search)}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{highlightMatch(member.email, search)}</div>
                              {member.phone && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{highlightMatch(member.phone, search)}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>{getRoleBadge(member.role)}</td>

                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            {member.line?.name ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
                                <MapPin size={13} /> {member.line.name}
                              </span>
                            ) : member.floor?.name ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)' }}>
                                <Layers size={13} /> {member.floor.name}
                              </span>
                            ) : member.block?.name ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                                <Building size={13} /> {member.block.name}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Global Plant Operations</span>
                            )}
                          </div>
                        </td>

                        {/* Higher Official & Reporting Chain */}
                        <td>
                          {member.role === 'admin' ? (
                            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                              Top Official (Executive)
                            </span>
                          ) : higherOfficial ? (
                            <button
                              type="button"
                              onClick={() => handleOpenChain(member)}
                              style={{
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease',
                              }}
                              title="Click to view full escalation chain"
                            >
                              <ArrowUp size={12} color="var(--primary)" />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                  {higherOfficial.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {getRoleBadge(higherOfficial.role)}
                                </div>
                              </div>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Auto-assigned
                            </span>
                          )}
                        </td>

                        <td>
                          {member.status === 'active' ? (
                            <span className="status-pill status-operational">Active</span>
                          ) : (
                            <span className="status-pill status-decommissioned">Inactive</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              onClick={() => handleOpenChain(member)}
                              title="View Chain of Command"
                            >
                              <ArrowUp size={14} color="var(--accent-cyan)" />
                              <span>Chain</span>
                            </button>

                            <button
                              className="btn btn-ghost"
                              style={{ padding: '6px 10px' }}
                              onClick={() => {
                                setEditingUser(member);
                                setModalOpen(true);
                              }}
                              title="Edit Permissions & Assignment"
                            >
                              <Edit2 size={15} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit & Provisioning Modal */}
      <CrewManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCrew}
        initialUser={editingUser}
      />

      {/* Escalation & Reporting Chain Modal */}
      <ReportingChainModal
        isOpen={chainModalOpen}
        onClose={() => setChainModalOpen(false)}
        user={selectedChainUser}
      />
    </div>
  );
};
