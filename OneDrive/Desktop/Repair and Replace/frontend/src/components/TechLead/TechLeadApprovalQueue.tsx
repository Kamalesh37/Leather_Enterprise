import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { RepairLog, RepairSpareRequest } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  Cpu,
  Clock,
  Send,
  RefreshCw,
  MapPin,
  FileCheck,
} from 'lucide-react';

export const TechLeadApprovalQueue: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'spare_approvals' | 'sign_off'>('spare_approvals');
  const [pendingApprovals, setPendingApprovals] = useState<RepairLog[]>([]);
  const [pendingSignOffs, setPendingSignOffs] = useState<RepairLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairLog | null>(null);
  const [techLeadNotes, setTechLeadNotes] = useState<string>('');
  const [partsApprovalMap, setPartsApprovalMap] = useState<
    Record<number, { approved_quantity: number; status: 'APPROVED' | 'REJECTED'; notes: string }>
  >({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const [apprRes, signOffRes] = await Promise.all([
        Api.listPendingApprovals(),
        Api.listTickets({ status: 'PENDING_SIGN_OFF' }),
      ]);

      if (apprRes.success && apprRes.data) {
        setPendingApprovals(apprRes.data);
      }
      if (signOffRes.success && signOffRes.data) {
        setPendingSignOffs(signOffRes.data);
      }
    } catch (err: any) {
      toast.error('Failed to load Tech Lead queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const handleOpenApprovalModal = (ticket: RepairLog) => {
    setSelectedTicket(ticket);
    setTechLeadNotes('');

    const initialMap: Record<
      number,
      { approved_quantity: number; status: 'APPROVED' | 'REJECTED'; notes: string }
    > = {};

    if (ticket.spare_requests) {
      ticket.spare_requests.forEach((req) => {
        initialMap[req.id] = {
          approved_quantity: req.approved_quantity ?? req.requested_quantity,
          status: req.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
          notes: req.tech_lead_notes || '',
        };
      });
    }

    setPartsApprovalMap(initialMap);
    setApprovalModalOpen(true);
  };

  const handleUpdateApprovalItem = (
    reqId: number,
    field: 'approved_quantity' | 'status' | 'notes',
    value: any
  ) => {
    setPartsApprovalMap((prev) => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [field]: value,
      },
    }));
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      const partsPayload = Object.entries(partsApprovalMap).map(([reqId, val]) => ({
        request_id: Number(reqId),
        approved_quantity: val.approved_quantity,
        status: val.status,
        notes: val.notes,
      }));

      await Api.approveSpareRequest(selectedTicket.id, {
        tech_lead_notes: techLeadNotes,
        parts_approval: partsPayload,
      });

      toast.success(`Approval registered. Requisition dispatched to Spare Head warehouse queue.`);
      setApprovalModalOpen(false);
      fetchQueues();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve spare parts.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOff = async (ticketId: number) => {
    try {
      const res = await Api.signOffRepair(ticketId);
      if (res.success) {
        toast.success(res.message || 'Repair signed off and machine restored to OPERATIONAL.');
        fetchQueues();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign off repair.');
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <CheckSquare size={24} color="var(--primary)" />
            <span>Tech Lead Engineering & Approval Queue</span>
          </h2>
          <p className="section-description">
            Validate mechanic root-cause diagnoses, verify machine spec compatibility, approve/modify BOM part quantities, and perform final sign-off.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchQueues}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-pill-container" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-pill ${activeTab === 'spare_approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('spare_approvals')}
        >
          <span>Pending Diagnostic & Spare Approvals</span>
          <span className="badge badge-purple">{pendingApprovals.length}</span>
        </button>

        <button
          className={`tab-pill ${activeTab === 'sign_off' ? 'active' : ''}`}
          onClick={() => setActiveTab('sign_off')}
        >
          <span>Final Repair Sign-Off & Verification</span>
          <span className="badge badge-emerald">{pendingSignOffs.length}</span>
        </button>
      </div>

      {/* Tab 1: Spare Approvals */}
      {activeTab === 'spare_approvals' && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Awaiting Technical Diagnosis Verification</h3>
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>Loading pending reviews...</div>
          ) : pendingApprovals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <div style={{ fontWeight: 600 }}>All Technical Diagnoses Reviewed</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No pending spare parts requisitions waiting in the queue.
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Machine Asset</th>
                    <th>Mechanic Diagnosis</th>
                    <th>BOM Items Requested</th>
                    <th>Priority</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="ticket-id-badge">{t.ticket_number}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.machine?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {t.machine?.machine_code} ({t.machine?.model_number})
                        </div>
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.mechanic?.name || 'Mechanic'}:
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>{t.diagnosis_notes}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {t.spare_requests?.map((sr) => (
                            <span key={sr.id} className="badge badge-secondary" style={{ width: 'fit-content' }}>
                              {sr.requested_quantity}x {sr.part?.name} (Bin: {sr.part?.location_bin})
                            </span>
                          ))}
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
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenApprovalModal(t)}
                        >
                          <CheckSquare size={14} />
                          <span>Review & Approve BOM</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Final Sign-off */}
      {activeTab === 'sign_off' && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Completed Mechanic Repairs Awaiting Sign-Off
            </h3>
          </div>

          {pendingSignOffs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No completed repairs currently pending final sign-off.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Machine</th>
                    <th>Location</th>
                    <th>Mechanic</th>
                    <th>Spare Parts Consumed</th>
                    <th>Elapsed Downtime</th>
                    <th style={{ textAlign: 'right' }}>Verification Sign-Off</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSignOffs.map((t) => (
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
                      <td>{t.machine?.line?.name}</td>
                      <td>{t.mechanic?.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                          {t.spare_requests
                            ?.filter((sr) => sr.status === 'DISPATCHED')
                            .map((sr) => (
                              <span key={sr.id}>
                                • {sr.dispatched_quantity}x {sr.part?.name}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)' }}>
                          <Clock size={13} />
                          Active Breakdown
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleSignOff(t.id)}
                        >
                          <FileCheck size={14} />
                          <span>Verify & Mark OPERATIONAL</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Approval & Modification Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={20} color="var(--primary)" />
            <span>Tech Lead Requisition Review & BOM Approval</span>
          </div>
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setApprovalModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmitApproval} disabled={submitting}>
              <Send size={15} />
              <span>{submitting ? 'Saving...' : 'Authorize Requisition for Dispatch'}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitApproval} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Machine & Diagnosis Summary */}
          <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {selectedTicket?.machine?.name} ({selectedTicket?.machine?.machine_code})
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <strong>Mechanic Diagnosis:</strong> {selectedTicket?.diagnosis_notes}
            </div>
          </div>

          {/* Parts Approval Grid */}
          <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              MODIFY / APPROVE REQUESTED SPARE PARTS
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Part Name & Bin</th>
                    <th>Available Stock</th>
                    <th>Req Qty</th>
                    <th>Approved Qty</th>
                    <th>Decision</th>
                    <th>Tech Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTicket?.spare_requests?.map((sr) => {
                    const currentVal = partsApprovalMap[sr.id] || {
                      approved_quantity: sr.requested_quantity,
                      status: 'APPROVED',
                      notes: '',
                    };

                    return (
                      <tr key={sr.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{sr.part?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                            Bin: {sr.part?.location_bin} | {sr.part?.part_number}
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              (sr.part?.stock_quantity ?? 0) < sr.requested_quantity
                                ? 'badge badge-rose'
                                : 'badge badge-emerald'
                            }
                          >
                            {sr.part?.stock_quantity} in bin
                          </span>
                        </td>
                        <td>{sr.requested_quantity}</td>
                        <td style={{ width: '90px' }}>
                          <input
                            type="number"
                            className="form-input form-input-sm"
                            min={0}
                            max={sr.part?.stock_quantity || 50}
                            value={currentVal.approved_quantity}
                            onChange={(e) =>
                              handleUpdateApprovalItem(
                                sr.id,
                                'approved_quantity',
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            disabled={currentVal.status === 'REJECTED'}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={currentVal.status}
                            onChange={(e) =>
                              handleUpdateApprovalItem(
                                sr.id,
                                'status',
                                e.target.value as 'APPROVED' | 'REJECTED'
                              )
                            }
                          >
                            <option value="APPROVED">Approve</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            placeholder="Optional remark..."
                            value={currentVal.notes}
                            onChange={(e) =>
                              handleUpdateApprovalItem(sr.id, 'notes', e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tech Lead Guidance Note */}
          <div>
            <label className="form-label">Tech Lead Engineering Guidance / Directive</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Ensure timing gap is measured with micrometer feeler gauge before tightening rotary hook clamp..."
              value={techLeadNotes}
              onChange={(e) => setTechLeadNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
