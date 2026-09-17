import React from 'react';
import { AnalyticsData, Line } from '../../types';
import { Modal } from '../Common/Modal';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface AvailabilityDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsData;
  onOpenBreakdowns: (lineId?: number) => void;
}

export const AvailabilityDrilldownModal: React.FC<AvailabilityDrilldownModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenBreakdowns,
}) => {
  const { overview, line_metrics, status_distribution } = data;

  const operational = status_distribution?.OPERATIONAL ?? overview.operational_count;
  const breakdown = status_distribution?.BREAKDOWN ?? overview.breakdown_count;
  const maintenance = status_distribution?.UNDER_MAINTENANCE ?? overview.maintenance_count ?? 0;
  const decommissioned = status_distribution?.DECOMMISSIONED ?? overview.decommissioned_count ?? 0;
  const total = overview.total_machines || 1;

  const operationalPct = Math.round((operational / total) * 100);
  const breakdownPct = Math.round((breakdown / total) * 100);
  const maintenancePct = Math.round((maintenance / total) * 100);
  const decommissionedPct = Math.round((decommissioned / total) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.18)',
              color: 'var(--accent-emerald)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              Fleet Availability & Equipment Health
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
              Live operational readiness and line-by-line uptime distribution across tannery blocks
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Plant Availability Index: <strong>{overview.availability_pct}%</strong>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              onOpenBreakdowns();
            }}
          >
            <span>View {overview.breakdown_count} Breakdown Bottlenecks</span>
            <ArrowRight size={15} />
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Status Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald-light)', fontWeight: 600 }}>
              OPERATIONAL
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald-light)' }}>
              {operational} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({operationalPct}%)</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose-light)', fontWeight: 600 }}>
              ACTIVE BREAKDOWNS
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
              {breakdown} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({breakdownPct}%)</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber-light)', fontWeight: 600 }}>
              ROUTINE MAINT
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {maintenance} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({maintenancePct}%)</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(100, 116, 139, 0.15)',
              border: '1px solid rgba(100, 116, 139, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              DECOMMISSIONED
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              {decommissioned} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({decommissionedPct}%)</span>
            </div>
          </div>
        </div>

        {/* Stacked Availability Bar */}
        <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600 }}>Overall Machinery Fleet Distribution</span>
            <span style={{ color: 'var(--accent-emerald-light)', fontWeight: 700 }}>
              {overview.total_machines} Registered Equipment
            </span>
          </div>
          <div
            style={{
              height: '14px',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              style={{
                width: `${operationalPct}%`,
                background: 'var(--accent-emerald)',
                transition: 'width 0.5s ease',
              }}
              title={`Operational: ${operational} (${operationalPct}%)`}
            />
            <div
              style={{
                width: `${breakdownPct}%`,
                background: 'var(--accent-rose)',
                transition: 'width 0.5s ease',
              }}
              title={`Breakdown: ${breakdown} (${breakdownPct}%)`}
            />
            <div
              style={{
                width: `${maintenancePct}%`,
                background: 'var(--accent-amber)',
                transition: 'width 0.5s ease',
              }}
              title={`Maintenance: ${maintenance} (${maintenancePct}%)`}
            />
            <div
              style={{
                width: `${decommissionedPct}%`,
                background: 'var(--text-muted)',
                transition: 'width 0.5s ease',
              }}
              title={`Decommissioned: ${decommissioned} (${decommissionedPct}%)`}
            />
          </div>
        </div>

        {/* Line by Line Breakdown Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Layers size={16} color="var(--accent-cyan)" />
              <span>Production Line Operational Breakdown</span>
            </div>
            <span className="badge badge-cyan">{line_metrics.length} Lines</span>
          </div>

          <div className="table-container" style={{ maxHeight: '35vh', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Production Line</th>
                  <th>Complex & Floor</th>
                  <th>Fleet Size</th>
                  <th>Operational Units</th>
                  <th>Breakdowns</th>
                  <th>Availability %</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {line_metrics.map((lm) => {
                  const lineOperational = lm.operational_machines ?? (lm.total_machines - lm.open_breakdowns);
                  const lineAvailPct = lm.total_machines > 0 ? Math.round((lineOperational / lm.total_machines) * 100) : 100;
                  return (
                    <tr key={lm.line_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lm.line_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{lm.line_code}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {lm.block_name} &rsaquo; {lm.floor_name}
                        </span>
                      </td>
                      <td>{lm.total_machines} units</td>
                      <td>
                        <span style={{ color: 'var(--accent-emerald-light)', fontWeight: 600 }}>
                          {lineOperational} units
                        </span>
                      </td>
                      <td>
                        {lm.open_breakdowns > 0 ? (
                          <span className="badge badge-rose">{lm.open_breakdowns} Active</span>
                        ) : (
                          <span className="badge badge-emerald">0</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: lineAvailPct < 85 ? 'var(--accent-rose)' : 'var(--accent-emerald-light)' }}>
                            {lineAvailPct}%
                          </span>
                          <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${lineAvailPct}%`,
                                height: '100%',
                                background: lineAvailPct < 85 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {lm.open_breakdowns > 0 ? (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => {
                              onClose();
                              onOpenBreakdowns(lm.line_id);
                            }}
                          >
                            <span>Inspect</span>
                            <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Optimal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
