import React from 'react';
import { AnalyticsData, RepairLog } from '../../types';
import { Modal } from '../Common/Modal';
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Layers,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface MTTRDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsData;
  onOpenBreakdowns: (lineId?: number) => void;
}

export const MTTRDrilldownModal: React.FC<MTTRDrilldownModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenBreakdowns,
}) => {
  const { overview, line_metrics, recent_tickets = [] } = data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.18)',
              color: 'var(--primary)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              Mean Time to Repair (MTTR) & Downtime Analytics
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
              Resolution velocity, bottleneck duration benchmarks, and mechanic recovery performance
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Average Plant MTTR: <strong style={{ color: 'var(--primary-light)' }}>{overview.mttr_minutes} minutes</strong>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <span>Close Overview</span>
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* KPI Mini Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              PLANT AVG MTTR
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {overview.mttr_minutes} <span style={{ fontSize: '0.85rem' }}>min</span>
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
              CUMULATIVE DOWNTIME
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {overview.total_downtime_minutes} <span style={{ fontSize: '0.85rem' }}>min</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald-light)', fontWeight: 600 }}>
              RESOLVED TICKETS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald-light)' }}>
              {overview.completed_tickets}
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
              OPEN WORK ORDERS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
              {overview.open_tickets}
            </div>
          </div>
        </div>

        {/* Line MTTR Comparison */}
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
              <Layers size={16} color="var(--primary)" />
              <span>Production Line MTTR & Downtime Impact</span>
            </div>
            <span className="badge badge-primary">{line_metrics.length} Lines Monitored</span>
          </div>

          <div className="table-container" style={{ maxHeight: '25vh', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Production Line</th>
                  <th>Complex Block</th>
                  <th>Active Breakdowns</th>
                  <th>Total Downtime</th>
                  <th>Avg MTTR</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {line_metrics.map((lm) => (
                  <tr key={lm.line_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lm.line_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{lm.line_code}</div>
                    </td>
                    <td>{lm.block_name} &rsaquo; {lm.floor_name}</td>
                    <td>
                      {lm.open_breakdowns > 0 ? (
                        <span className="badge badge-rose">{lm.open_breakdowns} Bottlenecks</span>
                      ) : (
                        <span className="badge badge-emerald">0</span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent-amber)' }}>{lm.total_downtime_minutes} min</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
                        {lm.avg_mttr_minutes || 0} min
                      </span>
                    </td>
                    <td>
                      {lm.open_breakdowns > 0 ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => {
                            onClose();
                            onOpenBreakdowns(lm.line_id);
                          }}
                        >
                          View Breakdown
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Healthy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Work Orders Table */}
        {recent_tickets.length > 0 && (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              <Wrench size={16} color="var(--accent-cyan)" />
              <span>Recent Repair Logs & Resolution Duration</span>
            </div>

            <div className="table-container" style={{ maxHeight: '25vh', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Machine</th>
                    <th>Reported Issue</th>
                    <th>Assigned Crew</th>
                    <th>Downtime Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="badge badge-primary">{t.ticket_number}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.machine?.name || 'Machine'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.machine?.machine_code}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{t.reported_issue}</span>
                      </td>
                      <td>
                        {t.mechanic ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                            <UserCheck size={13} color="var(--accent-emerald)" />
                            <span>{t.mechanic.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent-amber)' }}>
                          {t.total_downtime_minutes ? `${t.total_downtime_minutes} min` : 'In Progress'}
                        </strong>
                      </td>
                      <td>
                        <span className="status-pill">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
