import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Part, RepairLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Package,
  Boxes,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  MapPin,
  Send,
  Cpu,
  Search,
  Check,
} from 'lucide-react';

export const MechanicWorkbench: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [tickets, setTickets] = useState<RepairLog[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<Part[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Diagnosis / BOM Modal State
  const [diagModalOpen, setDiagModalOpen] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<RepairLog | null>(null);
  const [diagnosisNotes, setDiagnosisNotes] = useState<string>('');
  const [requestedParts, setRequestedParts] = useState<Array<{ part_id: number; quantity: number }>>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [partSearch, setPartSearch] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchWorkbenchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, partsRes] = await Promise.all([
        Api.listTickets({
          mechanic_id: user?.role === 'mechanic' ? user.id : undefined,
        }),
        Api.listParts(),
      ]);

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data);
      }
      if (partsRes.success && partsRes.data) {
        setPartsCatalog(partsRes.data);
        if (partsRes.data.length > 0) setSelectedPartId(String(partsRes.data[0].id));
      }
    } catch (err: any) {
      toast.error('Failed to load mechanic workbench.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkbenchData();
  }, [user]);

  const handleOpenDiagnosisModal = (ticket: RepairLog) => {
    setActiveTicket(ticket);
    setDiagnosisNotes(ticket.diagnosis_notes || '');
    if (ticket.spare_requests && ticket.spare_requests.length > 0) {
      setRequestedParts(
        ticket.spare_requests.map((r) => ({
          part_id: r.part_id,
          quantity: r.requested_quantity,
        }))
      );
    } else {
      setRequestedParts([]);
    }
    setDiagModalOpen(true);
  };

  const handleAddPartToBOM = () => {
    if (!selectedPartId) return;
    const partId = Number(selectedPartId);
    const existingIndex = requestedParts.findIndex((p) => p.part_id === partId);

    if (existingIndex > -1) {
      const updated = [...requestedParts];
      updated[existingIndex].quantity += selectedQty;
      setRequestedParts(updated);
    } else {
      setRequestedParts([...requestedParts, { part_id: partId, quantity: selectedQty }]);
    }
    setSelectedQty(1);
  };

  const handleRemovePartFromBOM = (partId: number) => {
    setRequestedParts(requestedParts.filter((p) => p.part_id !== partId));
  };

  const handleSubmitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    if (!diagnosisNotes.trim()) {
      toast.error('Please provide diagnostic inspection notes.');
      return;
    }

    setSubmitting(true);
    try {
      await Api.submitDiagnosis(activeTicket.id, {
        diagnosis_notes: diagnosisNotes,
        spare_parts: requestedParts,
      });

      toast.success(
        requestedParts.length > 0
          ? `Diagnostic report & BOM requisition submitted to Tech Lead for approval.`
          : `Diagnostic assessment saved. Machine moved to active repair.`
      );
      setDiagModalOpen(false);
      fetchWorkbenchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit diagnosis.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRepair = async (ticketId: number) => {
    try {
      await Api.completeRepair(ticketId);
      toast.success('Repair work marked complete. Routed to Tech Lead for final verification & sign-off.');
      fetchWorkbenchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete repair.');
    }
  };

  const activeMyJobs = tickets.filter(
    (t) => t.status !== 'OPERATIONAL' && t.status !== 'CLOSED'
  );

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Wrench size={24} color="var(--accent-rose)" />
            <span>Mechanic Technical Workbench</span>
          </h2>
          <p className="section-description">
            Inspect machines on the line, diagnose root causes, construct Bill of Materials (BOM) requisitions, and log completed repairs.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchWorkbenchData}>
          <RefreshCw size={16} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Active Jobs Queue */}
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
            <Wrench size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Assigned Breakdown & Maintenance Tasks</h3>
          </div>
          <span className="badge badge-primary">{activeMyJobs.length} Active</span>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>Loading tasks...</div>
        ) : activeMyJobs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pending repairs assigned to your queue.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Machine Asset</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Reported Problem</th>
                  <th>BOM Parts Requested</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeMyJobs.map((t) => (
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
                      <div style={{ fontSize: '0.85rem' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {t.machine?.line?.name}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${t.status.toLowerCase().replace(/_/g, '-')}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.reported_issue}
                      </div>
                    </td>
                    <td>
                      {t.spare_requests && t.spare_requests.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {t.spare_requests.map((sr) => (
                            <span key={sr.id} style={{ fontSize: '0.75rem' }}>
                              • {sr.requested_quantity}x {sr.part?.name} (
                              <span
                                className={`badge badge-sm ${
                                  sr.status === 'DISPATCHED'
                                    ? 'badge-emerald'
                                    : sr.status === 'APPROVED'
                                    ? 'badge-purple'
                                    : 'badge-secondary'
                                }`}
                              >
                                {sr.status}
                              </span>
                              )
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {/* Diagnose or edit BOM */}
                        {(t.status === 'REPORTED' || t.status === 'DIAGNOSING' || t.status === 'IN_REPAIR') && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenDiagnosisModal(t)}
                          >
                            <Wrench size={14} />
                            <span>{t.diagnosis_notes ? 'Update BOM' : 'Diagnose & BOM'}</span>
                          </button>
                        )}

                        {/* Complete Repair button */}
                        {t.status === 'IN_REPAIR' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleCompleteRepair(t.id)}
                            title="Mark Repair Finished"
                          >
                            <Check size={14} />
                            <span>Complete Work</span>
                          </button>
                        )}

                        {t.status === 'PENDING_TECH_APPROVAL' && (
                          <span className="badge badge-purple">Pending Tech Lead</span>
                        )}

                        {t.status === 'PENDING_SPARE_DISPATCH' && (
                          <span className="badge badge-rose">Pending Warehouse</span>
                        )}

                        {t.status === 'PENDING_SIGN_OFF' && (
                          <span className="badge badge-amber">Waiting Sign-Off</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diagnosis & Bill of Materials (BOM) Requisition Modal */}
      <Modal
        isOpen={diagModalOpen}
        onClose={() => setDiagModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} color="var(--primary)" />
            <span>Inspection Diagnosis & Spare Parts Requisition (BOM)</span>
          </div>
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDiagModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmitDiagnosis} disabled={submitting}>
              <Send size={15} />
              <span>{submitting ? 'Submitting...' : 'Submit to Tech Lead'}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitDiagnosis} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Machine & Symptoms */}
          <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              MACHINE UNDER INSPECTION
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
              {activeTicket?.machine?.name} ({activeTicket?.machine?.machine_code})
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', marginTop: '4px' }}>
              <strong>Reported Failure:</strong> {activeTicket?.reported_issue}
            </div>
          </div>

          {/* Diagnostic Inspection Findings */}
          <div>
            <label className="form-label">Mechanic Inspection & Fault Diagnosis *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detail root causes identified during physical inspection (e.g. Needle bar deflected, hydraulic valve coil blown, feed teeth stripped)..."
              value={diagnosisNotes}
              onChange={(e) => setDiagnosisNotes(e.target.value)}
              required
            />
          </div>

          {/* Bill of Materials (BOM) Builder */}
          <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              BILL OF MATERIALS (BOM) REQUISITION
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Search Spare Part Catalog</label>
                <select
                  className="form-select"
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                >
                  {partsCatalog.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.part_number}] — Bin: {p.location_bin} (Stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={50}
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddPartToBOM}
                style={{ height: '42px' }}
              >
                <Plus size={16} />
                <span>Add Part</span>
              </button>
            </div>

            {/* Added BOM Parts Table */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Requested Replacement Items:
              </div>

              {requestedParts.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No spare parts added. (Submit empty if only manual calibration/adjustment is needed).
                </div>
              ) : (
                <div className="table-container" style={{ background: 'var(--bg-card)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Part Item</th>
                        <th>Bin Location</th>
                        <th>Available Stock</th>
                        <th>Req Qty</th>
                        <th>Unit Cost</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestedParts.map((rp) => {
                        const partObj = partsCatalog.find((p) => p.id === rp.part_id);
                        return (
                          <tr key={rp.part_id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{partObj?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {partObj?.part_number}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-secondary">{partObj?.location_bin}</span>
                            </td>
                            <td>{partObj?.stock_quantity} units</td>
                            <td>
                              <strong style={{ color: 'var(--accent-amber)' }}>{rp.quantity}</strong>
                            </td>
                            <td>${Number(partObj?.unit_cost || 0).toFixed(2)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ color: 'var(--accent-rose)', padding: '4px 8px' }}
                                onClick={() => handleRemovePartFromBOM(rp.part_id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
