import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { RepairLog, RepairSpareRequest } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Package,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Truck,
  Layers,
  MapPin,
  RefreshCw,
  Send,
  Lock,
} from 'lucide-react';

export const SpareHeadDispatchStation: React.FC = () => {
  const toast = useToast();

  const [pendingDispatches, setPendingDispatches] = useState<RepairLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Dispatch Confirmation Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairLog | null>(null);
  const [dispatchRemarks, setDispatchRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await Api.listPendingDispatches();
      if (res.success && res.data) {
        setPendingDispatches(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load dispatch queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  const handleOpenDispatchModal = (ticket: RepairLog) => {
    setSelectedTicket(ticket);
    setDispatchRemarks(`Dispatched for line maintenance ticket ${ticket.ticket_number}`);
    setDispatchModalOpen(true);
  };

  const handleExecuteAtomicDispatch = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      const res = await Api.dispatchSpares(selectedTicket.id, {
        remarks: dispatchRemarks,
      });

      if (res.success) {
        toast.success(
          `Atomic dispatch completed! Inventory stock decremented from storage bins and recorded in immutable audit log.`
        );
        setDispatchModalOpen(false);
        fetchDispatches();
      }
    } catch (err: any) {
      toast.error(err.message || 'Dispatch failed: Check bin inventory levels.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Package size={24} color="var(--accent-rose)" />
            <span>Spare Head Warehouse Dispatch Station</span>
          </h2>
          <p className="section-description">
            Fulfill Tech Lead-approved spare part requisitions with pessimistic row-locking (<code style={{ color: 'var(--accent-cyan)' }}>lockForUpdate</code>) and atomic database transactions.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchDispatches}>
          <RefreshCw size={16} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="card">
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
            <Boxes size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Approved Requisitions Ready for Warehouse Fulfillment
            </h3>
          </div>
          <span className="badge badge-rose">{pendingDispatches.length} Awaiting Dispatch</span>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>Loading dispatch queue...</div>
        ) : pendingDispatches.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <div style={{ fontWeight: 600 }}>All Approved Spare Parts Dispatched</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No outstanding warehouse requisitions pending fulfillment.
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Machine Asset</th>
                  <th>Delivery Location</th>
                  <th>Tech Lead Approved Spares</th>
                  <th>Assigned Mechanic</th>
                  <th style={{ textAlign: 'right' }}>Atomic Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {pendingDispatches.map((t) => (
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
                        {t.machine?.line?.name} ({t.machine?.floor?.name})
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {t.spare_requests
                          ?.filter((sr) => sr.status === 'APPROVED')
                          .map((sr) => (
                            <div key={sr.id} style={{ fontSize: '0.8rem' }}>
                              <strong style={{ color: 'var(--accent-amber)' }}>
                                {sr.approved_quantity}x
                              </strong>{' '}
                              {sr.part?.name} &mdash;{' '}
                              <span className="badge badge-secondary">Bin: {sr.part?.location_bin}</span>
                            </div>
                          ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.mechanic?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Phone: {t.mechanic?.phone || 'On Line'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ boxShadow: '0 0 15px var(--primary-glow)' }}
                        onClick={() => handleOpenDispatchModal(t)}
                      >
                        <Send size={14} />
                        <span>Fulfill & Dispatch</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Atomic Dispatch Confirmation Modal */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--accent-cyan)" />
            <span>Confirm Atomic Inventory Dispatch (Pessimistic Lock)</span>
          </div>
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDispatchModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExecuteAtomicDispatch}
              disabled={submitting}
            >
              {submitting ? 'Executing DB Transaction...' : 'Confirm Atomic Stock Deduction'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Ticket Details */}
          <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
            <div style={{ fontWeight: 700 }}>
              Dispatching for Ticket: {selectedTicket?.ticket_number}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Destination: {selectedTicket?.machine?.name} ({selectedTicket?.machine?.line?.name}) &bull; Handover to Mechanic: <strong>{selectedTicket?.mechanic?.name}</strong>
            </div>
          </div>

          {/* Storage Bins & Stock Deduction Preview */}
          <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              STORAGE BINS & STOCK DEDUCTION SCHEDULE
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Storage Bin</th>
                    <th>Part Name</th>
                    <th>Current Bin Stock</th>
                    <th>Deduction</th>
                    <th>Stock After Dispatch</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTicket?.spare_requests
                    ?.filter((sr) => sr.status === 'APPROVED')
                    .map((sr) => {
                      const curr = sr.part?.stock_quantity ?? 0;
                      const ded = sr.approved_quantity ?? 0;
                      const after = curr - ded;

                      return (
                        <tr key={sr.id}>
                          <td>
                            <span className="badge badge-primary">{sr.part?.location_bin}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{sr.part?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {sr.part?.part_number}
                            </div>
                          </td>
                          <td>{curr} units</td>
                          <td>
                            <strong style={{ color: 'var(--accent-rose)' }}>-{ded} units</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: after < 5 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                              }}
                            >
                              {after} units
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="form-label">Warehouse Handover Remarks / Audit Note</label>
            <input
              type="text"
              className="form-input"
              value={dispatchRemarks}
              onChange={(e) => setDispatchRemarks(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
