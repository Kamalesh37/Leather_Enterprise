import React, { useState, useEffect, useCallback } from 'react';
import { Api } from '../../api/client';
import { AnalyticsData, Block, Floor, Line, NavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BreakdownMachineriesModal } from './BreakdownMachineriesModal';
import { AvailabilityDrilldownModal } from './AvailabilityDrilldownModal';
import { MTTRDrilldownModal } from './MTTRDrilldownModal';
import { ModelReliabilityModal } from './ModelReliabilityModal';
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
  Filter,
  Calendar,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MousePointerClick,
  Shield,
  Lock,
  Package,
  CheckSquare,
  Boxes,
  Target,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  onNavigateTab?: (tab: NavTab, params?: any) => void;
  onOpenBreakdown?: (machine?: any) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateTab,
  onOpenBreakdown,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hierarchy options for filtering
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lines, setLines] = useState<Line[]>([]);

  // Filter state
  const [timeFrame, setTimeFrame] = useState<string>('all');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Modals state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState<boolean>(false);
  const [breakdownLineId, setBreakdownLineId] = useState<number | null>(null);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState<boolean>(false);
  const [mttrModalOpen, setMttrModalOpen] = useState<boolean>(false);
  const [modelModalOpen, setModelModalOpen] = useState<boolean>(false);
  const [selectedModelData, setSelectedModelData] = useState<any | null>(null);

  // Fetch hierarchy options on mount
  useEffect(() => {
    Api.getHierarchyOptions().then((res) => {
      if (res.success && res.data) {
        setBlocks(res.data.blocks || []);
        setFloors(res.data.floors || []);
        setLines(res.data.lines || []);
      }
    });
  }, []);

  // Initialize filters based on user's role and designated scope
  useEffect(() => {
    if (user) {
      if (user.role === 'block_manager' && user.block_id) {
        setSelectedBlockId(String(user.block_id));
      } else if (user.role === 'floor_manager' && user.floor_id) {
        setSelectedFloorId(String(user.floor_id));
        if (user.block_id) setSelectedBlockId(String(user.block_id));
      } else if ((user.role === 'line_supervisor' || user.role === 'mechanic') && user.line_id) {
        setSelectedLineId(String(user.line_id));
        if (user.floor_id) setSelectedFloorId(String(user.floor_id));
        if (user.block_id) setSelectedBlockId(String(user.block_id));
      }
    }
  }, [user?.id, user?.role]);

  // Filter available floors and lines based on selection and user role
  const isBlockRestricted = user?.role === 'block_manager' || user?.role === 'floor_manager' || user?.role === 'line_supervisor';
  const isFloorRestricted = user?.role === 'floor_manager' || user?.role === 'line_supervisor';
  const isLineRestricted = user?.role === 'line_supervisor' || user?.role === 'mechanic';

  const effectiveBlockId = user?.role === 'block_manager' && user.block_id ? String(user.block_id) : selectedBlockId;
  const effectiveFloorId = user?.role === 'floor_manager' && user.floor_id ? String(user.floor_id) : selectedFloorId;
  const effectiveLineId = (user?.role === 'line_supervisor' || user?.role === 'mechanic') && user.line_id ? String(user.line_id) : selectedLineId;

  const filteredFloors = floors.filter(
    (f) => !effectiveBlockId || f.block_id === Number(effectiveBlockId)
  );
  const filteredLines = lines.filter((l) => {
    if (effectiveFloorId) return l.floor_id === Number(effectiveFloorId);
    if (effectiveBlockId) {
      const parentFloor = floors.find((f) => f.id === l.floor_id);
      return parentFloor && parentFloor.block_id === Number(effectiveBlockId);
    }
    return true;
  });

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await Api.getAnalyticsDashboard({
        block_id: effectiveBlockId ? Number(effectiveBlockId) : undefined,
        floor_id: effectiveFloorId ? Number(effectiveFloorId) : undefined,
        line_id: effectiveLineId ? Number(effectiveLineId) : undefined,
        time_frame: timeFrame !== 'all' ? timeFrame : undefined,
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [effectiveBlockId, effectiveFloorId, effectiveLineId, timeFrame]);

  // Load analytics when filters change
  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Auto-refresh interval (every 20s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  const handleOpenBreakdowns = (lineId?: number) => {
    setBreakdownLineId(lineId || null);
    setBreakdownModalOpen(true);
  };

  const handleNavigateToCatalog = (searchQuery?: string, status?: string) => {
    if (onNavigateTab) {
      onNavigateTab('machines', {
        search: searchQuery,
        status: status || undefined,
        line_id: breakdownLineId || undefined,
      });
    }
  };

  const handleNavigateToSupervisor = (lineId?: number) => {
    if (onNavigateTab) {
      onNavigateTab('supervisor', { line_id: lineId });
    }
  };

  const scope = data?.scope_info;

  const getScopeBadgeStyle = (level?: string) => {
    switch (level) {
      case 'enterprise':
        return { bg: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', border: '1px solid rgba(99, 102, 241, 0.3)' };
      case 'block':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'floor':
        return { bg: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' };
      case 'line':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'engineering':
        return { bg: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'warehouse':
        return { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.1)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' };
    }
  };

  return (
    <div className="section-container">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">Official Analytics Suite</span>
            {scope && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  background: getScopeBadgeStyle(scope.scope_level).bg,
                  color: getScopeBadgeStyle(scope.scope_level).color,
                  border: getScopeBadgeStyle(scope.scope_level).border,
                }}
              >
                {scope.official_title}
              </span>
            )}
            {autoRefresh && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-emerald)',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                Live 20s Sync
              </span>
            )}
          </div>
          <h1 className="section-title">
            <LayoutDashboard size={26} color="var(--primary)" />
            <span>Plant Maintenance & Machinery Analytics</span>
          </h1>
          <p className="section-description">
            Tailored operational intelligence, real-time breakdown drilldowns, MTTR metrics, and equipment reliability scoped to your designated role.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onOpenBreakdown && (
            <button
              className="btn btn-primary"
              onClick={() => onOpenBreakdown()}
            >
              <Plus size={16} />
              <span>Report Breakdown</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => fetchAnalytics(true)}
            disabled={loading}
            title="Refresh current metrics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Official Scope & Jurisdiction Banner */}
      {scope && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            marginBottom: '18px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '50%', background: getScopeBadgeStyle(scope.scope_level).bg }}>
              <Shield size={20} color={getScopeBadgeStyle(scope.scope_level).color} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ACTIVE OFFICIAL ANALYTICS SCOPE
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Official: <strong style={{ color: '#fff' }}>{scope.official_name}</strong>
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginTop: '2px' }}>
                {scope.scope_name}
              </div>
              {scope.location_context && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Assigned Plant Node: {scope.location_context}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {scope.is_restricted ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent-amber)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <Lock size={13} />
                <span>Designated Scope Enforced</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <Sparkles size={13} />
                <span>Enterprise Global Visibility</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Control Bar (Timeframe, Filters, Live Sync) */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Timeframe selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Calendar size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
            Timeframe:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'month', label: 'Last 30 Days' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'today', label: 'Today' },
          ].map((tf) => (
            <button
              key={tf.id}
              className={`btn btn-sm ${timeFrame === tf.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setTimeFrame(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Hierarchy Filters & Auto-Refresh Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--text-muted)" />
            
            {/* Block Select */}
            <select
              className="form-select"
              style={{
                width: '150px',
                fontSize: '0.82rem',
                padding: '6px 10px',
                opacity: isBlockRestricted ? 0.75 : 1,
                cursor: isBlockRestricted ? 'not-allowed' : 'pointer',
              }}
              value={effectiveBlockId}
              disabled={isBlockRestricted}
              onChange={(e) => {
                setSelectedBlockId(e.target.value);
                setSelectedFloorId('');
                setSelectedLineId('');
              }}
            >
              {!isBlockRestricted && <option value="">All Blocks</option>}
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {isBlockRestricted ? '(Assigned)' : ''}
                </option>
              ))}
            </select>

            {/* Floor Select */}
            <select
              className="form-select"
              style={{
                width: '150px',
                fontSize: '0.82rem',
                padding: '6px 10px',
                opacity: isFloorRestricted ? 0.75 : 1,
                cursor: isFloorRestricted ? 'not-allowed' : 'pointer',
              }}
              value={effectiveFloorId}
              disabled={isFloorRestricted}
              onChange={(e) => {
                setSelectedFloorId(e.target.value);
                setSelectedLineId('');
              }}
            >
              {!isFloorRestricted && <option value="">All Floors</option>}
              {filteredFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {isFloorRestricted ? '(Assigned)' : ''}
                </option>
              ))}
            </select>

            {/* Line Select */}
            <select
              className="form-select"
              style={{
                width: '170px',
                fontSize: '0.82rem',
                padding: '6px 10px',
                opacity: isLineRestricted ? 0.75 : 1,
                cursor: isLineRestricted ? 'not-allowed' : 'pointer',
              }}
              value={effectiveLineId}
              disabled={isLineRestricted}
              onChange={(e) => setSelectedLineId(e.target.value)}
            >
              {!isLineRestricted && <option value="">All Lines</option>}
              {filteredLines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.line_code} - {l.name} {isLineRestricted ? '(Assigned)' : ''}
                </option>
              ))}
            </select>

            {!scope?.is_restricted && (selectedBlockId || selectedFloorId || selectedLineId || timeFrame !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                onClick={() => {
                  setSelectedBlockId('');
                  setSelectedFloorId('');
                  setSelectedLineId('');
                  setTimeFrame('all');
                }}
              >
                Reset
              </button>
            )}
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              borderLeft: '1px solid var(--border-color)',
              paddingLeft: '12px',
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto Sync</span>
          </label>
        </div>
      </div>

      {loading && !data ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading factory analytics engine...</div>
        </div>
      ) : data ? (
        <>
          {/* Interactive KPI Metrics Banner */}
          <div className="dashboard-stats-grid" style={{ marginBottom: '24px' }}>
            {/* Card 1: Availability */}
            <div
              className="stat-card clickable-card"
              onClick={() => setAvailabilityModalOpen(true)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              title="Click to view full equipment fleet availability and health breakdown"
            >
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="stat-value" style={{ color: 'var(--accent-emerald-light)' }}>
                    {data.overview.availability_pct}%
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    {data.overview.operational_count}/{data.overview.total_machines} Ready
                  </span>
                </div>
                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Plant Machinery Availability</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span>Inspect</span> &rsaquo;
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Active Breakdowns (THE CORE REQUEST) */}
            <div
              className="stat-card clickable-card"
              onClick={() => handleOpenBreakdowns()}
              style={{
                cursor: 'pointer',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                background: 'linear-gradient(135deg, rgba(30, 20, 35, 0.8) 0%, rgba(15, 23, 42, 0.85) 100%)',
                boxShadow: data.overview.breakdown_count > 0 ? '0 0 20px rgba(244, 63, 94, 0.15)' : undefined,
                transition: 'all 0.25s ease',
              }}
              title="Click to view list of broken down machineries and active repair tickets"
            >
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}
              >
                <AlertTriangle size={24} style={{ animation: data.overview.breakdown_count > 0 ? 'pulse 2s infinite' : 'none' }} />
              </div>
              <div className="stat-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="stat-value" style={{ color: 'var(--accent-rose-light)' }}>
                    {data.overview.breakdown_count}
                  </div>
                  {data.overview.breakdown_count > 0 ? (
                    <span className="badge badge-rose" style={{ fontSize: '0.72rem', animation: 'pulse 2s infinite' }}>
                      🔥 Open Machineries
                    </span>
                  ) : (
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                      0 Bottlenecks
                    </span>
                  )}
                </div>
                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Active Breakdown Bottlenecks</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span>Click to view machines</span> &rsaquo;
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: MTTR */}
            <div
              className="stat-card clickable-card"
              onClick={() => setMttrModalOpen(true)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              title="Click to inspect Mean Time to Repair benchmarks and recent tickets"
            >
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}
              >
                <Clock size={24} />
              </div>
              <div className="stat-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="stat-value" style={{ color: 'var(--primary-light)' }}>
                    {data.overview.mttr_minutes} <span style={{ fontSize: '1rem', fontWeight: 600 }}>min</span>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {data.overview.completed_tickets} Fixed
                  </span>
                </div>
                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>MTTR (Mean Time to Repair)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span>Trends</span> &rsaquo;
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Cumulative Downtime */}
            <div
              className="stat-card clickable-card"
              onClick={() => setMttrModalOpen(true)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              title="Click to inspect cumulative factory downtime and line bottlenecks"
            >
              <div
                className="stat-icon-wrapper"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}
              >
                <Activity size={24} />
              </div>
              <div className="stat-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="stat-value" style={{ color: 'var(--accent-amber-light)' }}>
                    {data.overview.total_downtime_minutes} <span style={{ fontSize: '1rem', fontWeight: 600 }}>min</span>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                    {Math.round((data.overview.total_downtime_minutes / 60) * 10) / 10} hrs
                  </span>
                </div>
                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Cumulative Downtime Total</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span>Details</span> &rsaquo;
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Specialized Role-Tailored Panel 1: Tech Lead Diagnostics Suite */}
          {data.tech_lead_metrics && (
            <div
              className="card"
              style={{
                marginBottom: '24px',
                padding: '18px 22px',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckSquare size={22} color="var(--accent-purple)" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                      Chief Diagnostics & Engineering Quality Assurance
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Diagnostic queue velocity, root cause failure categorization, and BOM authorization SLA
                    </div>
                  </div>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  Tech Lead Engineering Suite
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Diagnostic Approvals</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: data.tech_lead_metrics.pending_diagnostic_approvals > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '2px' }}>
                    {data.tech_lead_metrics.pending_diagnostic_approvals} Tickets
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Awaiting BOM parts authorization</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Verification Sign-offs</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>
                    {data.tech_lead_metrics.pending_sign_offs} Restored
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Awaiting engineering sign-off</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Diagnostic Review SLA</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {data.tech_lead_metrics.avg_approval_turnaround_min} min
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Fast-track triage standard</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Root Cause Diagnostic Categorization Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {data.tech_lead_metrics.root_cause_breakdown.map((rc, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                        <span>{rc.category}</span>
                        <span style={{ color: 'var(--accent-purple)' }}>{rc.pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${rc.pct}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specialized Role-Tailored Panel 2: Spare Head Warehouse Suite */}
          {data.spare_head_metrics && (
            <div
              className="card"
              style={{
                marginBottom: '24px',
                padding: '18px 22px',
                border: '1px solid rgba(236, 72, 153, 0.35)',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={22} color="#f472b6" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                      Central Warehouse & Spare Parts Replenishment Analytics
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Inventory valuation, critical safety thresholds, and technician workbench dispatch SLA
                    </div>
                  </div>
                </div>
                <span className="badge badge-purple" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                  Spare Parts Command
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low Stock Bottlenecks</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: data.spare_head_metrics.low_stock_parts_count > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', marginTop: '2px' }}>
                    {data.spare_head_metrics.low_stock_parts_count} Part SKUs
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Below safety threshold level</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Warehouse Dispatches</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {data.spare_head_metrics.pending_dispatches_count} Orders
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Ready for atomic bin picking</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatch SLA Compliance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {data.spare_head_metrics.dispatch_sla_compliance_pct}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Within 15 min workbench target</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Inventory Valuation</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
                    ${Number(data.spare_head_metrics.inventory_valuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Across {data.spare_head_metrics.total_part_skus} managed SKUs</div>
                </div>
              </div>
            </div>
          )}

          {/* Specialized Role-Tailored Panel 3: Mechanic Maintenance Console */}
          {data.mechanic_metrics && (
            <div
              className="card"
              style={{
                marginBottom: '24px',
                padding: '18px 22px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wrench size={22} color="var(--accent-emerald)" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                      Technician Workbench & Maintenance Velocity
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Personal repair throughput, first-time fix rate, and station equipment health
                    </div>
                  </div>
                </div>
                <span className="badge badge-emerald">Technician Console</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Assigned Breakdowns</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '2px' }}>
                    {data.mechanic_metrics.my_active_repairs} Open
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Assigned to your queue</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repairs Restored to Production</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {data.mechanic_metrics.my_completed_repairs} Completed
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Signed off & operational</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personal MTTR Velocity</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
                    {data.mechanic_metrics.my_avg_repair_time_min} min
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Average breakdown resolution time</div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>First-Time Fix Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {data.mechanic_metrics.first_time_fix_rate_pct}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Zero rework precision</div>
                </div>
              </div>
            </div>
          )}

          {/* Line Performance Breakdown & Bottlenecks */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} color="var(--accent-cyan)" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Floor & Line Bottleneck Tracking
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Click on any line row to inspect machinery breakdowns and line availability
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-cyan">{data.line_metrics.length} Monitored Lines</span>
              </div>
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
                    <th>Interactive Drilldown</th>
                  </tr>
                </thead>
                <tbody>
                  {data.line_metrics.map((lm) => (
                    <tr
                      key={lm.line_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenBreakdowns(lm.line_id)}
                      className="table-row-hover"
                    >
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
                          <span
                            className="badge badge-rose"
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBreakdowns(lm.line_id);
                            }}
                          >
                            {lm.open_breakdowns} Bottlenecks &rsaquo;
                          </span>
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
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBreakdowns(lm.line_id);
                          }}
                        >
                          <span>Inspect Line</span>
                          <ChevronRight size={13} />
                        </button>
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Machinery Reliability & Failure Frequency by Model
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Click any model row to view failure history, root cause analyses, and equipment serials
                </div>
              </div>
              <span className="badge badge-primary">{data.failures_by_model.length} Models Analyzed</span>
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.failures_by_model.map((fm, idx) => (
                    <tr
                      key={idx}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedModelData(fm);
                        setModelModalOpen(true);
                      }}
                      className="table-row-hover"
                    >
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
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModelData(fm);
                            setModelModalOpen(true);
                          }}
                        >
                          <span>Model Profile</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Drilldown Modals */}
      {data && (
        <>
          {/* 1. Breakdown Machineries Modal */}
          <BreakdownMachineriesModal
            isOpen={breakdownModalOpen}
            onClose={() => setBreakdownModalOpen(false)}
            machines={data.breakdown_machines || []}
            lines={lines}
            initialLineId={breakdownLineId}
            onNavigateToCatalog={handleNavigateToCatalog}
            onNavigateToSupervisor={handleNavigateToSupervisor}
            onOpenReportBreakdown={onOpenBreakdown ? () => onOpenBreakdown() : undefined}
          />

          {/* 2. Availability Drilldown Modal */}
          <AvailabilityDrilldownModal
            isOpen={availabilityModalOpen}
            onClose={() => setAvailabilityModalOpen(false)}
            data={data}
            onOpenBreakdowns={(lineId) => handleOpenBreakdowns(lineId)}
          />

          {/* 3. MTTR Drilldown Modal */}
          <MTTRDrilldownModal
            isOpen={mttrModalOpen}
            onClose={() => setMttrModalOpen(false)}
            data={data}
            onOpenBreakdowns={(lineId) => handleOpenBreakdowns(lineId)}
          />

          {/* 4. Model Reliability Modal */}
          <ModelReliabilityModal
            isOpen={modelModalOpen}
            onClose={() => setModelModalOpen(false)}
            modelData={selectedModelData}
            onNavigateToCatalog={(searchQuery) => handleNavigateToCatalog(searchQuery)}
          />
        </>
      )}
    </div>
  );
};

