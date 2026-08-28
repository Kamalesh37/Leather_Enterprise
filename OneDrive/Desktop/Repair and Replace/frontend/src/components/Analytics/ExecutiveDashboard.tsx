import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { AnalyticsData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  Building,
  TrendingDown,
  Wrench,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await Api.getAnalyticsDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">Factory Analytics Suite</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user?.block?.name || 'Alpha Leather Tannery & Complex'}
            </span>
          </div>
          <h1 className="section-title">
            <LayoutDashboard size={26} color="var(--primary)" />
            <span>Plant Maintenance & Downtime Oversight</span>
          </h1>
          <p className="section-description">
            Aggregated factory metrics, line bottleneck indicators, Mean Time to Repair (MTTR), and failure analysis across all plant equipment.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchAnalytics}>
          <RefreshCw size={16} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading factory analytics...
        </div>
      ) : data ? (
        <>
          {/* Top High-Level Metrics */}
          <div className="dashboard-stats-grid">
            <div className="stat-card">
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--accent-emerald-light)' }}>
                  {data.overview.availability_pct}%
                </div>
                <div className="stat-label">Plant Machinery Availability</div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}
              >
                <AlertTriangle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--accent-rose-light)' }}>
                  {data.overview.breakdown_count}
                </div>
                <div className="stat-label">Active Breakdown Bottlenecks</div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}
              >
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--primary-light)' }}>
                  {data.overview.mttr_minutes} min
                </div>
                <div className="stat-label">MTTR (Mean Time to Repair)</div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}
              >
                <Activity size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--accent-amber-light)' }}>
                  {data.overview.total_downtime_minutes} min
                </div>
                <div className="stat-label">Cumulative Downtime Total</div>
              </div>
            </div>
          </div>

          {/* Line Performance Breakdown & Bottlenecks */}
          <div className="card">
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Floor & Line Bottleneck Tracking
                </h3>
              </div>
              <span className="badge badge-cyan">{data.line_metrics.length} Monitored Lines</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Line Name & Code</th>
                    <th>Floor Level</th>
                    <th>Complex Block</th>
                    <th>Installed Machinery</th>
                    <th>Active Breakdowns</th>
                    <th>Cumulative Downtime</th>
                    <th>Operational Health</th>
                  </tr>
                </thead>
                <tbody>
                  {data.line_metrics.map((lm) => (
                    <tr key={lm.line_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lm.line_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                          {lm.line_code}
                        </div>
                      </td>
                      <td>{lm.floor_name}</td>
                      <td>{lm.block_name}</td>
                      <td>{lm.total_machines} units</td>
                      <td>
                        {lm.open_breakdowns > 0 ? (
                          <span className="badge badge-rose">{lm.open_breakdowns} Bottlenecks</span>
                        ) : (
                          <span className="badge badge-emerald">0 Breakdowns</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{lm.total_downtime_minutes} mins</strong>
                      </td>
                      <td>
                        {lm.open_breakdowns > 0 ? (
                          <span className="status-pill status-breakdown">Bottleneck</span>
                        ) : (
                          <span className="status-pill status-operational">Optimal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Machine Reliability Frequency */}
          <div className="card">
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Machinery Reliability & Failure Frequency by Model
              </h3>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Machinery Model</th>
                    <th>Equipment Model No</th>
                    <th>Breakdown Incidents</th>
                    <th>Cumulative Downtime</th>
                    <th>Reliability Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.failures_by_model.map((fm, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fm.machine_name}</div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{fm.model_number}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{fm.ticket_count} incidents</strong>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                          {fm.downtime_sum || 0} minutes
                        </span>
                      </td>
                      <td>
                        <span className="status-pill status-operational">Commercial Grade</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
