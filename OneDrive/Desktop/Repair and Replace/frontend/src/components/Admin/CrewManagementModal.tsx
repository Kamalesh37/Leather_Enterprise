import React, { useState, useEffect, useMemo } from 'react';
import { Api } from '../../api/client';
import { Block, Floor, Line, Role, User } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  UserPlus,
  Shield,
  Layers,
  Building,
  MapPin,
  Check,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowUp,
} from 'lucide-react';

interface CrewManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUser?: User | null;
}

export const CrewManagementModal: React.FC<CrewManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialUser,
}) => {
  const toast = useToast();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [allCrew, setAllCrew] = useState<User[]>([]);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<Role>('line_supervisor');

  // Direct Higher Official
  const [managerId, setManagerId] = useState<string>('');

  // Hierarchical Node State (Cascading)
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedLineId, setSelectedLineId] = useState<string>('');

  // Granular Permission Checkbox Matrix
  const [permissions, setPermissions] = useState<{
    can_manage_vendors: boolean;
    can_edit_machines: boolean;
    can_assign_mechanics: boolean;
    can_approve_diagnostics: boolean;
    can_dispatch_spares: boolean;
    can_adjust_inventory_stock: boolean;
    can_view_analytics: boolean;
  }>({
    can_manage_vendors: false,
    can_edit_machines: false,
    can_assign_mechanics: true,
    can_approve_diagnostics: false,
    can_dispatch_spares: false,
    can_adjust_inventory_stock: false,
    can_view_analytics: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch hierarchy options & crew for manager selection
  useEffect(() => {
    if (isOpen) {
      Api.getHierarchyOptions()
        .then((res) => {
          if (res.success && res.data) {
            setBlocks(res.data.blocks);
            setFloors(res.data.floors);
            setLines(res.data.lines);
          }
        })
        .catch(() => toast.error('Failed to load factory hierarchy structure.'));

      Api.listCrew().then((res) => {
        if (res.success && res.data) {
          setAllCrew(res.data);
        }
      });
    }
  }, [isOpen]);

  // Set initial form state or defaults
  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name);
      setEmail(initialUser.email);
      setPassword('');
      setPhone(initialUser.phone || '');
      setRole(initialUser.role);
      setManagerId(initialUser.manager_id ? String(initialUser.manager_id) : '');
      setSelectedBlockId(initialUser.block_id ? String(initialUser.block_id) : '');
      setSelectedFloorId(initialUser.floor_id ? String(initialUser.floor_id) : '');
      setSelectedLineId(initialUser.line_id ? String(initialUser.line_id) : '');

      if (initialUser.permission) {
        setPermissions({
          can_manage_vendors: Boolean(initialUser.permission.can_manage_vendors),
          can_edit_machines: Boolean(initialUser.permission.can_edit_machines),
          can_assign_mechanics: Boolean(initialUser.permission.can_assign_mechanics),
          can_approve_diagnostics: Boolean(initialUser.permission.can_approve_diagnostics),
          can_dispatch_spares: Boolean(initialUser.permission.can_dispatch_spares),
          can_adjust_inventory_stock: Boolean(initialUser.permission.can_adjust_inventory_stock),
          can_view_analytics: Boolean(initialUser.permission.can_view_analytics),
        });
      }
    } else {
      resetForm();
    }
  }, [initialUser, isOpen]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('password123');
    setPhone('');
    setRole('line_supervisor');
    setManagerId('');
    setSelectedBlockId('1');
    setSelectedFloorId('1');
    setSelectedLineId('1');
    applyRoleDefaults('line_supervisor');
  };

  const applyRoleDefaults = (newRole: Role) => {
    switch (newRole) {
      case 'admin':
        setPermissions({
          can_manage_vendors: true,
          can_edit_machines: true,
          can_assign_mechanics: true,
          can_approve_diagnostics: true,
          can_dispatch_spares: true,
          can_adjust_inventory_stock: true,
          can_view_analytics: true,
        });
        break;
      case 'block_manager':
      case 'floor_manager':
        setPermissions({
          can_manage_vendors: false,
          can_edit_machines: true,
          can_assign_mechanics: true,
          can_approve_diagnostics: false,
          can_dispatch_spares: false,
          can_adjust_inventory_stock: false,
          can_view_analytics: true,
        });
        break;
      case 'line_supervisor':
        setPermissions({
          can_manage_vendors: false,
          can_edit_machines: false,
          can_assign_mechanics: true,
          can_approve_diagnostics: false,
          can_dispatch_spares: false,
          can_adjust_inventory_stock: false,
          can_view_analytics: true,
        });
        break;
      case 'tech_lead':
        setPermissions({
          can_manage_vendors: false,
          can_edit_machines: true,
          can_assign_mechanics: true,
          can_approve_diagnostics: true,
          can_dispatch_spares: false,
          can_adjust_inventory_stock: false,
          can_view_analytics: true,
        });
        break;
      case 'spare_head':
        setPermissions({
          can_manage_vendors: true,
          can_edit_machines: false,
          can_assign_mechanics: false,
          can_approve_diagnostics: false,
          can_dispatch_spares: true,
          can_adjust_inventory_stock: true,
          can_view_analytics: true,
        });
        break;
      case 'mechanic':
        setPermissions({
          can_manage_vendors: false,
          can_edit_machines: false,
          can_assign_mechanics: false,
          can_approve_diagnostics: false,
          can_dispatch_spares: false,
          can_adjust_inventory_stock: false,
          can_view_analytics: false,
        });
        break;
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as Role;
    setRole(selected);
    applyRoleDefaults(selected);
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter cascading floors based on selected block
  const filteredFloors = floors.filter(
    (f) => !selectedBlockId || String(f.block_id) === selectedBlockId
  );

  // Filter cascading lines based on selected floor
  const filteredLines = lines.filter(
    (l) => !selectedFloorId || String(l.floor_id) === selectedFloorId
  );

  // Potential higher officials (Managers / Supervisors)
  const availableManagers = useMemo(() => {
    return allCrew.filter((c) => {
      if (initialUser && c.id === initialUser.id) return false;
      return ['admin', 'block_manager', 'floor_manager', 'line_supervisor'].includes(c.role);
    });
  }, [allCrew, initialUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (initialUser) {
        // Update
        const payload: any = {
          role,
          manager_id: managerId ? Number(managerId) : null,
          block_id: selectedBlockId ? Number(selectedBlockId) : null,
          floor_id: selectedFloorId ? Number(selectedFloorId) : null,
          line_id: selectedLineId ? Number(selectedLineId) : null,
          phone,
          permissions,
        };
        await Api.updateCrew(initialUser.id, payload);
        toast.success(`Updated reporting structure & permissions for ${name}.`);
      } else {
        // Create new
        const payload = {
          name,
          email,
          password: password || 'password123',
          role,
          manager_id: managerId ? Number(managerId) : null,
          block_id: selectedBlockId ? Number(selectedBlockId) : null,
          floor_id: selectedFloorId ? Number(selectedFloorId) : null,
          line_id: selectedLineId ? Number(selectedLineId) : null,
          phone,
          permissions,
        };
        await Api.storeCrew(payload);
        toast.success(`Provisioned crew member ${name} in reporting hierarchy.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save crew member.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleTitle = (r: string) => {
    switch (r) {
      case 'admin':
        return 'Plant Director';
      case 'block_manager':
        return 'Block Manager';
      case 'floor_manager':
        return 'Floor Manager';
      case 'line_supervisor':
        return 'Line Supervisor';
      default:
        return r;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={20} color="var(--primary)" />
          <span>{initialUser ? 'Edit Crew Member & Reporting Chain' : 'Provision Crew Member (Admin Panel)'}</span>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : initialUser ? 'Save Changes' : 'Provision Crew Member'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic Credentials */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            1. IDENTIFICATION & CREDENTIALS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Full Name *</label>
              <div className="input-group">
                <UserIcon size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Klaus Schneider"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Corporate Email *</label>
              <div className="input-group">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. kschneider@leathermfg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={Boolean(initialUser)}
                  required
                />
              </div>
            </div>

            {!initialUser && (
              <div>
                <label className="form-label">Password *</label>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Contact Phone</label>
              <div className="input-group">
                <Phone size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role & Cascading Hierarchy Assignment */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            2. ORGANIZATIONAL ROLE, LOCATION & HIGHER OFFICIAL
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">System Role *</label>
              <select className="form-select" value={role} onChange={handleRoleChange}>
                <option value="admin">Admin (Plant Director)</option>
                <option value="block_manager">Block Manager</option>
                <option value="floor_manager">Floor Manager</option>
                <option value="line_supervisor">Line Supervisor</option>
                <option value="mechanic">Maintenance Technician</option>
                <option value="tech_lead">Chief Tech Lead</option>
                <option value="spare_head">Spare Head (Custodian)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Assigned Block</label>
              <select
                className="form-select"
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(e.target.value);
                  setSelectedFloorId('');
                  setSelectedLineId('');
                }}
              >
                <option value="">-- None (Global HQ) --</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Assigned Floor</label>
              <select
                className="form-select"
                value={selectedFloorId}
                onChange={(e) => {
                  setSelectedFloorId(e.target.value);
                  setSelectedLineId('');
                }}
                disabled={!selectedBlockId}
              >
                <option value="">-- None (Block Wide) --</option>
                {filteredFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Assigned Line</label>
              <select
                className="form-select"
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                disabled={!selectedFloorId}
              >
                <option value="">-- None (Floor Wide) --</option>
                {filteredLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Higher Official / Manager Selector */}
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Reports To (Direct Higher Official)</label>
              <select
                className="form-select"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                <option value="">-- Auto-Assign based on Hierarchy --</option>
                {availableManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({getRoleTitle(m.role)}) {m.floor ? `• ${m.floor.name}` : ''} {m.line ? `• ${m.line.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUp size={12} />
            <span>
              All shopfloor technicians report to Line Supervisors &rarr; Floor Managers &rarr; Block Managers &rarr; Plant Director.
            </span>
          </div>
        </div>

        {/* Granular Permission Checkbox Matrix */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              3. GRANULAR RBAC OPERATIONAL PERMISSIONS
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => applyRoleDefaults(role)}
            >
              Reset to Role Defaults
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_manage_vendors}
                onChange={() => togglePermission('can_manage_vendors')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Manage Vendors & OEMs</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Can add, edit, and evaluate OEM vendors
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_edit_machines}
                onChange={() => togglePermission('can_edit_machines')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Manage Machinery Catalog</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Register machines and print QR code passports
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_assign_mechanics}
                onChange={() => togglePermission('can_assign_mechanics')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Assign Mechanics (Supervisor)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Dispatch mechanics to active breakdowns
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_approve_diagnostics}
                onChange={() => togglePermission('can_approve_diagnostics')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Approve Spares (Tech Lead)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Validate root cause BOM & authorize spare parts
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_dispatch_spares}
                onChange={() => togglePermission('can_dispatch_spares')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dispatch Spares (Warehouse)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Atomic stock deductions and bin dispatching
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_adjust_inventory_stock}
                onChange={() => togglePermission('can_adjust_inventory_stock')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adjust Inventory Ledger</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Stock restock, manual adjustment, scrap
                </div>
              </div>
            </label>

            <label
              style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.can_view_analytics}
                onChange={() => togglePermission('can_view_analytics')}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Access Executive Analytics & MTTR</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  View downtime metrics, availability rates, and model reliability rankings
                </div>
              </div>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};
