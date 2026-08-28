import React, { useState, useEffect } from 'react';
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

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<Role>('line_supervisor');

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

  // Fetch hierarchy options
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
        .catch((err) => toast.error('Failed to load factory hierarchy structure.'));
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
          block_id: selectedBlockId ? Number(selectedBlockId) : null,
          floor_id: selectedFloorId ? Number(selectedFloorId) : null,
          line_id: selectedLineId ? Number(selectedLineId) : null,
          phone,
          permissions,
        };
        await Api.updateCrew(initialUser.id, payload);
        toast.success(`Updated permissions & assignment for ${name}.`);
      } else {
        // Create new
        const payload = {
          name,
          email,
          password: password || 'password123',
          role,
          block_id: selectedBlockId ? Number(selectedBlockId) : null,
          floor_id: selectedFloorId ? Number(selectedFloorId) : null,
          line_id: selectedLineId ? Number(selectedLineId) : null,
          phone,
          permissions,
        };
        await Api.storeCrew(payload);
        toast.success(`Crew member ${name} provisioned successfully.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save crew member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={20} color="var(--primary)" />
          <span>{initialUser ? 'Edit Crew Member & Permissions' : 'Provision Crew Member (Admin Panel)'}</span>
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
            2. ORGANIZATIONAL HIERARCHY & ROLE
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">System Role *</label>
              <select className="form-select" value={role} onChange={handleRoleChange}>
                <option value="admin">Admin (Global)</option>
                <option value="block_manager">Block Manager</option>
                <option value="floor_manager">Floor Manager</option>
                <option value="line_supervisor">Line Supervisor</option>
                <option value="mechanic">Mechanic</option>
                <option value="tech_lead">Tech Lead</option>
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
                <option value="">-- None (Global) --</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.name})
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
                    {l.line_code} - {l.name}
                  </option>
                ))}
              </select>
            </div>
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
              3. GRANULAR OPERATIONAL PERMISSION MATRIX
            </div>
            <span className="badge badge-primary">Dynamic Override</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={permissions.can_manage_vendors}
                onChange={() => togglePermission('can_manage_vendors')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_manage_vendors</div>
                <div className="checkbox-desc">Register machinery suppliers, contracts, and categories</div>
              </div>
            </label>

            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={permissions.can_edit_machines}
                onChange={() => togglePermission('can_edit_machines')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_edit_machines</div>
                <div className="checkbox-desc">Register leather machines, update specs, generate QR tags</div>
              </div>
            </label>

            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={permissions.can_assign_mechanics}
                onChange={() => togglePermission('can_assign_mechanics')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_assign_mechanics</div>
                <div className="checkbox-desc">Assign mechanics to active breakdown tickets on the line</div>
              </div>
            </label>

            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={permissions.can_approve_diagnostics}
                onChange={() => togglePermission('can_approve_diagnostics')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_approve_diagnostics (Tech Lead)</div>
                <div className="checkbox-desc">Verify diagnoses, adjust BOM parts, and authorize sign-off</div>
              </div>
            </label>

            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={permissions.can_dispatch_spares}
                onChange={() => togglePermission('can_dispatch_spares')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_dispatch_spares (Spare Head)</div>
                <div className="checkbox-desc">Fulfill approved BOMs and trigger atomic stock deduction</div>
              </div>
            </label>

            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={permissions.can_adjust_inventory_stock}
                onChange={() => togglePermission('can_adjust_inventory_stock')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_adjust_inventory_stock</div>
                <div className="checkbox-desc">Restock bins, modify unit costs, and adjust inventory levels</div>
              </div>
            </label>

            <label className="checkbox-card" style={{ gridColumn: 'span 2' }}>
              <input
                type="checkbox"
                checked={permissions.can_view_analytics}
                onChange={() => togglePermission('can_view_analytics')}
              />
              <div className="checkbox-card-content">
                <div className="checkbox-title">can_view_analytics</div>
                <div className="checkbox-desc">Access factory downtime aggregations, MTTR metrics, and bottleneck reports</div>
              </div>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};
