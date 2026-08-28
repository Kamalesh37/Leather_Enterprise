import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Machine, RepairLog, ServiceCatalogItem, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { QRScannerModal } from './QRScannerModal';
import { BreakdownIntakeModal } from './BreakdownIntakeModal';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  QrCode,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  UserCheck,
  Cpu,
  MapPin,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const LineDashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeTickets, setActiveTickets] = useState<RepairLog[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [qrScannerOpen, setQrScannerOpen] = useState<boolean>(false);
  const [intakeModalOpen, setIntakeModalOpen] = useState<boolean>(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [suggestedServices, setSuggestedServices] = useState<ServiceCatalogItem[]>([]);

  // Assign Mechanic Modal
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [ticketToAssign, setTicketToAssign] = useState<RepairLog | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');

  const fetchLineData = async () => {
    setLoading(true);
    try {
      const lineId = user?.line_id || undefined;

      const [machinesRes, ticketsRes, mechRes] = await Promise.all([
        Api.listMachines({ line_id: lineId }),
        Api.listTickets({ line_id: lineId }),
        Api.getActiveMechanics(),
      ]);

      if (machinesRes.success && machinesRes.data) {
        setMachines(machinesRes.data);
      }
      if (ticketsRes.success && ticketsRes.data) {
        // filter out closed / operational tickets
        const open = ticketsRes.data.filter(
          (t) => t.status !== 'OPERATIONAL' && t.status !== 'CLOSED'
        );
        setActiveTickets(open);
      }
      if (mechRes.success && mechRes.data) {
        setMechanics(mechRes.data);
        if (mechRes.data.length > 0) setSelectedMechanicId(String(mechRes.data[0].id));
      }
    } catch (err: any) {
      toast.error('Failed to load line station data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineData();
  }, [user]);

  const handleQRScanSuccess = async (qrHash: string) => {
    try {
      const res = await Api.lookupMachineByQR(qrHash);
      if (res.success && res.data) {
        setSelectedMachine(res.data.machine);
        setSuggestedServices(res.data.suggested_services || []);
        setIntakeModalOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || `No machinery found with QR Hash [${qrHash}]`);
    }
  };

  const handleOpenManualBreakdown = (machine: Machine) => {
    setSelectedMachine(machine);
    setIntakeModalOpen(true);
  };

  const handleAssignMechanicSubmit = async () => {
    if (!ticketToAssign || !selectedMechanicId) return;

    try {
      await Api.assignMechanic(ticketToAssign.id, Number(selectedMechanicId));
      toast.success(`Assigned mechanic to ticket ${ticketToAssign.ticket_number}.`);
      setAssignModalOpen(false);
      fetchLineData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign mechanic.');
    }
  };

  const totalLineMachines = machines.length;
  const breakdownCount = machines.filter((m) => m.status === 'BREAKDOWN').length;
  const operationalCount = machines.filter((m) => m.status === 'OPERATIONAL').length;
  const availabilityPct =
    totalLineMachines > 0 ? Math.round((operationalCount / totalLineMachines) * 100) : 100;

  return (
    <div className="section-container">
      {/* Line Supervisor Station Header */}
      <div className="line-supervisor-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-amber">Line Supervisor Station</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user?.line?.name || 'Production Line 01 (Alpha)'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Plant Floor Breakdown & Intake Dispatch
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchLineData} title="Refresh Line Data">
            <RefreshCw size={16} />
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontSize: '1rem', boxShadow: '0 0 20px var(--primary-glow)' }}
            onClick={() => setQrScannerOpen(true)}
          >
            <QrCode size={20} />
            <span>Scan Machine QR Code</span>
          </button>
        </div>
      </div>

      {/* Line KPI Overview Cards */}
      <div className="dashboard-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Cpu size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalLineMachines}</div>
            <div className="stat-label">Total Assigned Line Machines</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
              {breakdownCount}
            </div>
            <div className="stat-label">Active Breakdown Bottlenecks</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
              {availabilityPct}%
            </div>
            <div className="stat-label">Line Operational Efficiency</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}
          >
            <Wrench size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
              {activeTickets.length}
            </div>
            <div className="stat-label">Active Repair Tickets</div>
          </div>
        </div>
      </div>

      {/* Active Breakdown Tickets Board */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Active Breakdown Tickets on Line</h3>
          </div>
          <span className="badge badge-rose">{activeTickets.length} Open</span>
        </div>

        {activeTickets.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <div style={{ fontWeight: 600 }}>All Line Machinery Operating Normally</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No active breakdowns. Scan QR code above if a machine halts.
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Machine Asset</th>
                  <th>Priority</th>
                  <th>Status Pipeline</th>
                  <th>Assigned Mechanic</th>
                  <th>Reported Issue</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="ticket-id-badge">{t.ticket_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.machine?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {t.machine?.machine_code}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.priority === 'CRITICAL'
                            ? 'badge-rose'
                            : t.priority === 'HIGH'
                            ? 'badge-amber'
                            : 'badge-secondary'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${t.status.toLowerCase().replace(/_/g, '-')}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {t.mechanic ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserCheck size={14} color="var(--accent-emerald)" />
                          <span style={{ fontWeight: 600 }}>{t.mechanic.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.reported_issue}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTicketToAssign(t);
                          if (t.mechanic_id) setSelectedMechanicId(String(t.mechanic_id));
                          setAssignModalOpen(true);
                        }}
                      >
                        <UserCheck size={14} />
                        <span>{t.mechanic ? 'Reassign' : 'Assign Mechanic'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Line Machine Quick Grid */}
      <div className="section-header" style={{ marginTop: '30px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Line Machinery Live Status</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Direct one-click breakdown report for any line equipment.
          </p>
        </div>
      </div>

      <div className="machine-grid">
        {machines.map((m) => (
          <div key={m.id} className="machine-card">
            <div className="machine-card-header">
              <div>
                <div className="machine-code-badge">{m.machine_code}</div>
                <div className="machine-name">{m.name}</div>
              </div>
              <span className={`status-pill status-${m.status.toLowerCase().replace(/_/g, '-')}`}>
                {m.status}
              </span>
            </div>

            <div className="machine-meta-grid">
              <div>
                <span className="meta-label">Model:</span> {m.model_number}
              </div>
              <div>
                <span className="meta-label">Serial:</span> {m.serial_number}
              </div>
            </div>

            <div className="machine-card-footer">
              <button
                className={`btn btn-sm ${m.status === 'BREAKDOWN' ? 'btn-danger' : 'btn-primary'}`}
                style={{ width: '100%' }}
                onClick={() => handleOpenManualBreakdown(m)}
              >
                <AlertTriangle size={14} />
                <span>Report Breakdown / Service</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      <BreakdownIntakeModal
        isOpen={intakeModalOpen}
        onClose={() => setIntakeModalOpen(false)}
        onSuccess={fetchLineData}
        machine={selectedMachine}
        suggestedServices={suggestedServices}
      />

      {/* Assign Mechanic Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="var(--primary)" />
            <span>Assign Mechanic to Ticket {ticketToAssign?.ticket_number}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAssignMechanicSubmit}>
              Confirm Assignment
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Machine: <strong>{ticketToAssign?.machine?.name}</strong> ({ticketToAssign?.machine?.machine_code})
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Issue: {ticketToAssign?.reported_issue}
            </div>
          </div>

          <div>
            <label className="form-label">Select Active Mechanic</label>
            <select
              className="form-select"
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
            >
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.active_repairs_count ?? 0} active tickets)
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
