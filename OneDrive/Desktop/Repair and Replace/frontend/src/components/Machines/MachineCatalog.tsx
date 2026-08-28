import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Machine, Line } from '../../types';
import { QRLabelModal } from './QRLabelModal';
import { MachineFormModal } from './MachineFormModal';
import { useToast } from '../Common/Toast';
import {
  Cpu,
  Plus,
  Search,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Building,
  Layers,
  MapPin,
  FileText,
  Activity,
  Filter,
} from 'lucide-react';

interface MachineCatalogProps {
  onOpenBreakdown?: (machine: Machine) => void;
}

export const MachineCatalog: React.FC<MachineCatalogProps> = ({ onOpenBreakdown }) => {
  const toast = useToast();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedLineId, setSelectedLineId] = useState<string>('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await Api.listMachines({
        search: search || undefined,
        status: selectedStatus || undefined,
        line_id: selectedLineId ? Number(selectedLineId) : undefined,
      });
      if (res.success && res.data) {
        setMachines(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load machinery catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
    Api.getHierarchyOptions().then((res) => {
      if (res.success && res.data) {
        setLines(res.data.lines);
      }
    });
  }, [selectedStatus, selectedLineId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMachines();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return <span className="status-pill status-operational">Operational</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="status-pill status-waiting">Routine Maint</span>;
      case 'BREAKDOWN':
        return <span className="status-pill status-diagnosing">Breakdown</span>;
      case 'DECOMMISSIONED':
        return <span className="status-pill status-decommissioned">Decommissioned</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Cpu size={24} color="var(--primary)" />
            <span>Leather Machinery & Asset QR Registry</span>
          </h2>
          <p className="section-description">
            Catalog of heavy leather stitchers, hydraulic clicking presses, skiving & splitting machines with indexed QR codes and full engineering specs.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setFormModalOpen(true)}>
          <Plus size={16} />
          <span>Register Machine</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: '1 1 280px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by code, model, serial or QR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>

          <select
            className="form-select"
            style={{ width: '220px' }}
            value={selectedLineId}
            onChange={(e) => setSelectedLineId(e.target.value)}
          >
            <option value="">All Production Lines</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.line_code} - {l.name}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Machine Grid Cards */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading machinery assets...
        </div>
      ) : machines.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No machines registered matching criteria.
        </div>
      ) : (
        <div className="machine-grid">
          {machines.map((m) => (
            <div key={m.id} className="machine-card">
              <div className="machine-card-header">
                <div>
                  <div className="machine-code-badge">{m.machine_code}</div>
                  <div className="machine-name">{m.name}</div>
                </div>
                {getStatusBadge(m.status)}
              </div>

              <div className="machine-meta-grid">
                <div>
                  <span className="meta-label">Model:</span> {m.model_number}
                </div>
                <div>
                  <span className="meta-label">Serial:</span> {m.serial_number}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="meta-label">Vendor:</span> {m.vendor?.name || 'OEM Direct'}
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {m.block?.name} &rsaquo; {m.floor?.name} &rsaquo; <strong>{m.line?.name}</strong>
                  </span>
                </div>
              </div>

              {/* JSON Specs Preview */}
              {m.specifications && (
                <div className="machine-specs-box">
                  <div className="specs-title">ENGINEERING SPECIFICATIONS</div>
                  <div className="specs-list">
                    {m.specifications.motor_specs && (
                      <div className="spec-item">
                        <span>Motor:</span> {m.specifications.motor_specs}
                      </div>
                    )}
                    {m.specifications.needle_type && (
                      <div className="spec-item">
                        <span>Tool/Needle:</span> {m.specifications.needle_type}
                      </div>
                    )}
                    {m.specifications.hydraulic_rating && (
                      <div className="spec-item">
                        <span>Rating:</span> {m.specifications.hydraulic_rating}
                      </div>
                    )}
                    {m.specifications.air_pressure_bar && (
                      <div className="spec-item">
                        <span>Air:</span> {m.specifications.air_pressure_bar}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="machine-card-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedMachine(m);
                    setQrModalOpen(true);
                  }}
                >
                  <QrCode size={14} />
                  <span>QR Tag</span>
                </button>

                {onOpenBreakdown && (
                  <button
                    className={`btn btn-sm ${m.status === 'BREAKDOWN' ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => onOpenBreakdown(m)}
                  >
                    <AlertTriangle size={14} />
                    <span>Report Breakdown</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <MachineFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchMachines}
      />

      <QRLabelModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        machine={selectedMachine}
      />
    </div>
  );
};
