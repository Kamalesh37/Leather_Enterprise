import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { User, Role } from '../../types';
import { CrewManagementModal } from './CrewManagementModal';
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
} from 'lucide-react';

export const CrewList: React.FC = () => {
  const toast = useToast();
  const [crew, setCrew] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchCrew = async () => {
    setLoading(true);
    try {
      const res = await Api.listCrew({
        search: search || undefined,
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
    fetchCrew();
  }, [selectedRole]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCrew();
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-primary">Admin (Global)</span>;
      case 'block_manager':
        return <span className="badge badge-cyan">Block Manager</span>;
      case 'floor_manager':
        return <span className="badge badge-emerald">Floor Manager</span>;
      case 'line_supervisor':
        return <span className="badge badge-amber">Line Supervisor</span>;
      case 'mechanic':
        return <span className="badge badge-rose">Mechanic</span>;
      case 'tech_lead':
        return <span className="badge badge-purple">Tech Lead</span>;
      case 'spare_head':
        return <span className="badge badge-indigo">Spare Head</span>;
      default:
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Users size={24} color="var(--primary)" />
            <span>Crew Management & RBAC Hierarchy</span>
          </h2>
          <p className="section-description">
            Assign crew members to Block, Floor, and Line organizational nodes and configure granular operational matrix permissions.
          </p>
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

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: '1 1 300px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '200px' }}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="block_manager">Block Manager</option>
            <option value="floor_manager">Floor Manager</option>
            <option value="line_supervisor">Line Supervisor</option>
            <option value="mechanic">Mechanic</option>
            <option value="tech_lead">Tech Lead</option>
            <option value="spare_head">Spare Head</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
          <button type="button" className="btn btn-ghost" onClick={fetchCrew} title="Refresh list">
            <RefreshCw size={16} />
          </button>
        </form>
      </div>

      {/* Crew Table */}
      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Crew Member</th>
              <th>Role</th>
              <th>Hierarchy Node</th>
              <th>Permission Matrix Summary</th>
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
              crew.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar-sm">{member.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.email}</div>
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
                        <span style={{ color: 'var(--text-muted)' }}>Global HQ</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '360px' }}>
                      {member.role === 'admin' ? (
                        <span className="badge badge-primary">Full Root Superuser</span>
                      ) : (
                        <>
                          {member.permission?.can_manage_vendors && (
                            <span className="badge badge-secondary" title="can_manage_vendors">
                              Vendors
                            </span>
                          )}
                          {member.permission?.can_edit_machines && (
                            <span className="badge badge-secondary" title="can_edit_machines">
                              Machines
                            </span>
                          )}
                          {member.permission?.can_assign_mechanics && (
                            <span className="badge badge-secondary" title="can_assign_mechanics">
                              Assign
                            </span>
                          )}
                          {member.permission?.can_approve_diagnostics && (
                            <span className="badge badge-purple" title="can_approve_diagnostics">
                              Approve Tech
                            </span>
                          )}
                          {member.permission?.can_dispatch_spares && (
                            <span className="badge badge-rose" title="can_dispatch_spares">
                              Dispatch Spares
                            </span>
                          )}
                          {member.permission?.can_adjust_inventory_stock && (
                            <span className="badge badge-amber" title="can_adjust_inventory_stock">
                              Stock Adj
                            </span>
                          )}
                          {member.permission?.can_view_analytics && (
                            <span className="badge badge-cyan" title="can_view_analytics">
                              Analytics
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    {member.status === 'active' ? (
                      <span className="status-pill status-operational">Active</span>
                    ) : (
                      <span className="status-pill status-decommissioned">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CrewManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCrew}
        initialUser={editingUser}
      />
    </div>
  );
};
