import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { InventoryAuditLog } from '../../types';
import { useToast } from '../Common/Toast';
import {
  ScrollText,
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Calendar,
  Clock,
  User,
  Package,
} from 'lucide-react';

export const AuditLedgerView: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<InventoryAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await Api.getAuditLogs({
        change_type: selectedType || undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load inventory audit ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedType]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DISPATCH':
        return (
          <span className="badge badge-rose" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownLeft size={12} />
            <span>DISPATCH</span>
          </span>
        );
      case 'RESTOCK':
        return (
          <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={12} />
            <span>RESTOCK</span>
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sliders size={12} />
            <span>AUDIT ADJ</span>
          </span>
        );
      default:
        return <span className="badge badge-secondary">{type}</span>;
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <ScrollText size={24} color="var(--primary)" />
            <span>Immutable Inventory Audit Ledger</span>
          </h2>
          <p className="section-description">
            Complete cryptographic & transaction audit log of all warehouse dispatches, restocks, and manual cycle count adjustments.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={16} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: '220px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Transaction Types</option>
            <option value="DISPATCH">Dispatches (Repair Outflow)</option>
            <option value="RESTOCK">Restocks (Warehouse Inflow)</option>
            <option value="ADJUSTMENT">Audit Adjustments</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Transaction</th>
              <th>Spare Part & Bin</th>
              <th>Quantity Delta</th>
              <th>Balance (Before &rarr; After)</th>
              <th>Ticket # / Location</th>
              <th>Authorized Custodian</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                  Loading ledger transactions...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No audit log entries recorded.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>{getTypeBadge(log.change_type)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.part?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                      {log.part?.part_number} &bull; Bin: {log.part?.location_bin}
                    </div>
                  </td>
                  <td>
                    <strong
                      style={{
                        color:
                          log.quantity_delta < 0
                            ? 'var(--accent-rose)'
                            : 'var(--accent-emerald)',
                      }}
                    >
                      {log.quantity_delta > 0 ? `+${log.quantity_delta}` : log.quantity_delta}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>
                      {log.balance_before} &rarr; <strong>{log.balance_after}</strong>
                    </span>
                  </td>
                  <td>
                    {log.repair_log ? (
                      <div>
                        <span className="ticket-id-badge">{log.repair_log.ticket_number}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {log.repair_log.machine?.name}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Warehouse Direct</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <User size={13} color="var(--primary)" />
                      <span>{log.user?.name || 'System Custodian'}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '200px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.remarks || 'Standard transaction'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
