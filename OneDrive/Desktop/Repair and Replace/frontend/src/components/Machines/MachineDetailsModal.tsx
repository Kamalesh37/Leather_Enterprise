import React, { useState, useEffect, useMemo } from 'react';
import { Api } from '../../api/client';
import { Machine, RepairLog, AuthorityHandledRecord, MachineServiceStats } from '../../types';
import { Modal } from '../Common/Modal';
import {
  Cpu,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  QrCode,
  ShieldCheck,
  Package,
  Calendar,
  Phone,
  Mail,
  Activity,
  History,
  Users,
  Check,
  Printer,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  FileSpreadsheet,
} from 'lucide-react';

interface MachineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number | null;
  onOpenBreakdown?: (machine: Machine) => void;
  onOpenQRTag?: (machine: Machine) => void;
}

export const MachineDetailsModal: React.FC<MachineDetailsModalProps> = ({
  isOpen,
  onClose,
  machineId,
  onOpenBreakdown,
  onOpenQRTag,
}) => {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [serviceStats, setServiceStats] = useState<MachineServiceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'services' | 'authorities' | 'specs'>('services');

  // Interactive filtering inside Service History Tab
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [expandedLogIds, setExpandedLogIds] = useState<number[]>([]);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && machineId) {
      setLoading(true);
      Api.getMachineById(machineId)
        .then((res: any) => {
          if (res.success && res.data) {
            setMachine(res.data);
            if (res.service_stats) {
              setServiceStats(res.service_stats);
            }
            // By default expand all service ticket cards for full visibility
            const logs: RepairLog[] = res.data.repair_logs || res.data.repairLogs || [];
            setExpandedLogIds(logs.map((l: RepairLog) => l.id));
          }
        })
        .catch((err) => {
          console.error('Failed to load machine details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setMachine(null);
      setServiceStats(null);
      setActiveTab('services');
      setSearchFilter('');
      setStatusFilter('ALL');
      setTypeFilter('ALL');
      setPriorityFilter('ALL');
    }
  }, [isOpen, machineId]);

  if (!isOpen) return null;

  const rawLogs: RepairLog[] = (machine?.repair_logs || (machine as any)?.repairLogs || []) as RepairLog[];

  // Filtered & searched repair logs
  const filteredLogs = rawLogs.filter((log) => {
    // Status filter
    if (statusFilter === 'COMPLETED' && !(log.status === 'OPERATIONAL' || log.status === 'CLOSED')) return false;
    if (statusFilter === 'OPEN' && (log.status === 'OPERATIONAL' || log.status === 'CLOSED')) return false;

    // Type filter
    if (typeFilter !== 'ALL' && log.ticket_type !== typeFilter) return false;

    // Priority filter
    if (priorityFilter !== 'ALL' && log.priority !== priorityFilter) return false;

    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const searchable = [
        log.ticket_number,
        log.reported_issue,
        log.diagnosis_notes,
        log.ticket_type,
        log.status,
        log.priority,
        log.reporter?.name,
        log.mechanic?.name,
        log.tech_lead?.name,
        log.spare_head?.name,
        ...(log.spare_requests?.map((sr) => sr.part?.name || sr.part?.part_number || '') || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  const toggleExpandLog = (id: number) => {
    setExpandedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    setExpandedLogIds(rawLogs.map((l) => l.id));
  };

  const handleCollapseAll = () => {
    setExpandedLogIds([]);
  };

  const handleCopyQRHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getMachineImageUrl = (imageUrl?: string | null, name?: string, model?: string): string => {
    if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
    const lower = `${name || ''} ${model || ''}`.toLowerCase();
    if (lower.includes('cutter') || lower.includes('atom') || lower.includes('cnc')) {
      return '/assets/machines/cutter.jpg';
    }
    if (lower.includes('skiv') || lower.includes('fortuna') || lower.includes('split') || lower.includes('camoga')) {
      return '/assets/machines/skiver.jpg';
    }
    if (lower.includes('press') || lower.includes('emboss') || lower.includes('tori')) {
      return '/assets/machines/press.jpg';
    }
    return '/assets/machines/stitcher.jpg';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="status-pill status-operational" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} />
            <span>Operational</span>
          </span>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <span className="status-pill status-waiting" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} />
            <span>Routine Maintenance</span>
          </span>
        );
      case 'BREAKDOWN':
        return (
          <span className="status-pill status-breakdown" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={13} />
            <span>Active Breakdown</span>
          </span>
        );
      case 'PENDING_TECH_APPROVAL':
        return (
          <span className="status-pill status-waiting" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} />
            <span>Pending Tech Approval</span>
          </span>
        );
      case 'PENDING_SPARE_DISPATCH':
        return (
          <span className="status-pill status-waiting" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Package size={13} />
            <span>Pending Spare Dispatch</span>
          </span>
        );
      case 'IN_REPAIR':
        return (
          <span className="status-pill status-breakdown" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Wrench size={13} />
            <span>In Repair</span>
          </span>
        );
      case 'DECOMMISSIONED':
        return <span className="status-pill status-decommissioned">Decommissioned</span>;
      default:
        return <span className="status-pill">{status.replace(/_/g, ' ')}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="badge badge-danger" style={{ fontSize: '0.72rem', fontWeight: 800 }}>CRITICAL PRIORITY</span>;
      case 'HIGH':
        return <span className="badge badge-danger" style={{ fontSize: '0.72rem', fontWeight: 700 }}>HIGH PRIORITY</span>;
      case 'MEDIUM':
        return <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>MEDIUM PRIORITY</span>;
      default:
        return <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>LOW PRIORITY</span>;
    }
  };

  const formatRoleName = (role?: string) => {
    if (!role) return 'Official';
    return role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Calculate total spares value consumed
  const totalSparesValue = rawLogs.reduce((acc, log) => {
    const sr = log.spare_requests || [];
    return (
      acc +
      sr.reduce((sum, r) => {
        const qty = r.dispatched_quantity || r.approved_quantity || r.requested_quantity || 0;
        const cost = r.unit_cost_at_dispatch || r.part?.unit_cost || 0;
        return sum + qty * cost;
      }, 0)
    );
  }, 0);

  const totalSparesCount = rawLogs.reduce((acc, log) => {
    return acc + (log.spare_requests?.length || 0);
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      allowMaximize={true}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.82rem', fontWeight: 800, padding: '3px 9px' }}>
                {machine?.machine_code || 'MAC-ASSET'}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.01em' }}>
                {machine?.name || 'Machinery Asset Details & Complete Service History'}
              </span>
              {machine && getStatusBadge(machine.status)}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Complete Service History</span>
              <span>&bull;</span>
              <span>Full Authority Custody Audit</span>
              <span>&bull;</span>
              <span>Parts Ledger & Technical Blueprints</span>
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <QrCode size={16} color="var(--accent-cyan)" />
            <span>QR Passport: <code style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{machine?.qr_code_hash || 'QR-N/A'}</code></span>
            {machine?.qr_code_hash && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                onClick={() => handleCopyQRHash(machine.qr_code_hash)}
                title="Copy QR Hash to clipboard"
              >
                {copiedHash ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                <span>{copiedHash ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {machine && onOpenQRTag && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenQRTag(machine);
                }}
              >
                <Printer size={15} />
                <span>View / Print QR Passport</span>
              </button>
            )}

            {machine && onOpenBreakdown && (
              <button
                type="button"
                className={`btn ${machine.status === 'BREAKDOWN' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  onClose();
                  onOpenBreakdown(machine);
                }}
              >
                <AlertTriangle size={15} />
                <span>Report Breakdown / Service</span>
              </button>
            )}

            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={36} className="animate-spin" style={{ margin: '0 auto 14px', color: 'var(--accent-cyan)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Loading Entire Service History & Authority Chain...</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Fetching complete machine passport, spare parts ledger, diagnostic notes, and custody records.
          </div>
        </div>
      ) : !machine ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={36} color="var(--accent-rose)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>Machine Record Not Found</div>
          <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>The requested machinery identifier could not be retrieved from the central registry.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ================= 1. TOP PROFILE SUMMARY BANNER ================= */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(26, 31, 56, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', gap: '22px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* High-Resolution Machine Photo */}
              <div
                style={{
                  width: '160px',
                  height: '125px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  background: '#090d16',
                  position: 'relative',
                }}
              >
                <img
                  src={getMachineImageUrl(machine.image_url, machine.name, machine.model_number)}
                  alt={machine.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: 'rgba(11, 17, 30, 0.8)',
                    backdropFilter: 'blur(6px)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                  }}
                >
                  HD Asset
                </div>
              </div>

              {/* Equipment Metadata Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', flex: 1 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Model & Serial Number
                  </span>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem', marginTop: '2px' }}>
                    {machine.model_number}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 600 }}>
                    SN: {machine.serial_number}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Supplying OEM Vendor
                  </span>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.98rem', marginTop: '2px' }}>
                    {machine.vendor?.name || 'OEM Direct Manufacturer'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {machine.vendor?.email || machine.vendor?.phone || 'Authorized Factory Partner'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Production Floor Location
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    <MapPin size={15} color="var(--accent-cyan)" />
                    <span>{machine.block?.name || 'Block A'} &rsaquo; {machine.floor?.name || 'Floor 1'} &rsaquo; <strong style={{ color: 'var(--accent-emerald)' }}>{machine.line?.name || 'Main Line'}</strong></span>
                  </div>
                  {machine.installed_at && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Commissioned: {new Date(machine.installed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= 2. EXPANDED SERVICE KPI METRICS RIBBON ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Total Services Done
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {serviceStats?.total_services_done ?? rawLogs.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Lifetime logged events</div>
            </div>

            <div className="card" style={{ padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Completed & Closed
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                {serviceStats?.completed_services ?? rawLogs.filter((r) => r.status === 'OPERATIONAL' || r.status === 'CLOSED').length}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Restored to line</div>
            </div>

            <div className="card" style={{ padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Active Tickets
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (serviceStats?.open_services ?? rawLogs.filter((r) => r.status !== 'OPERATIONAL' && r.status !== 'CLOSED').length) > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)', marginTop: '2px' }}>
                {serviceStats?.open_services ?? rawLogs.filter((r) => r.status !== 'OPERATIONAL' && r.status !== 'CLOSED').length}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>In repair / triage</div>
            </div>

            <div className="card" style={{ padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Cumulative Downtime
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>
                {serviceStats?.total_downtime_minutes ? `${Math.round((serviceStats.total_downtime_minutes / 60) * 10) / 10}h` : '0h'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {serviceStats?.total_downtime_minutes || 0} minutes logged
              </div>
            </div>

            <div className="card" style={{ padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Authorities Involved
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
                {serviceStats?.unique_authorities_count || serviceStats?.authorities_roster?.length || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Custody personnel</div>
            </div>

            <div className="card" style={{ padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Parts Consumed
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '2px' }}>
                {totalSparesCount}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                ${totalSparesValue.toFixed(2)} total value
              </div>
            </div>
          </div>

          {/* ================= 3. NAVIGATION TABS WITH LIVE COUNTS ================= */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '9px 18px', fontSize: '0.88rem', fontWeight: 700 }}
              onClick={() => setActiveTab('services')}
            >
              <History size={17} />
              <span>Complete Service & Breakdown History ({rawLogs.length})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'authorities' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '9px 18px', fontSize: '0.88rem', fontWeight: 700 }}
              onClick={() => setActiveTab('authorities')}
            >
              <Users size={17} />
              <span>Authorities Handled & Custody Chain ({serviceStats?.authorities_roster?.length || 0})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'specs' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '9px 18px', fontSize: '0.88rem', fontWeight: 700 }}
              onClick={() => setActiveTab('specs')}
            >
              <Cpu size={17} />
              <span>Technical Specifications & QR Blueprint</span>
            </button>
          </div>

          {/* ================= TAB 1: COMPLETE SERVICES & REPAIRS (EXPANDED SERVICE HISTORY CARD) ================= */}
          {activeTab === 'services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Interactive Search & Filter Controls */}
              <div
                className="card"
                style={{
                  padding: '14px 18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '220px' }}>
                  <div className="input-group" style={{ width: '100%' }}>
                    <Search size={15} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search tickets, symptoms, diagnosis, mechanic, spares..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      style={{ fontSize: '0.85rem', paddingLeft: '34px' }}
                    />
                  </div>
                </div>

                {/* Filter Pills & Selectors */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Status Filter */}
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 12px', background: 'var(--bg-input)' }}
                  >
                    <option value="ALL">All Statuses ({rawLogs.length})</option>
                    <option value="COMPLETED">Completed & Operational</option>
                    <option value="OPEN">Active / In Progress</option>
                  </select>

                  {/* Type Filter */}
                  <select
                    className="form-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 12px', background: 'var(--bg-input)' }}
                  >
                    <option value="ALL">All Service Types</option>
                    <option value="ROUTINE_SERVICE">Routine Maintenance</option>
                    <option value="BREAKDOWN_REPAIR">Breakdown Repair</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    className="form-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 12px', background: 'var(--bg-input)' }}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>

                  {/* Expand All / Collapse All */}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={expandedLogIds.length === rawLogs.length ? handleCollapseAll : handleExpandAll}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {expandedLogIds.length === rawLogs.length ? (
                      <>
                        <ChevronUp size={14} />
                        <span>Collapse All</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        <span>Expand All Details</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Service Cards List */}
              {filteredLogs.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={38} color="var(--accent-emerald)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                    {searchFilter || statusFilter !== 'ALL' || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
                      ? 'No Service Logs Match the Current Filter'
                      : 'Zero Breakdowns / Services Logged for this Unit'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '500px', margin: '6px auto 0' }}>
                    {searchFilter || statusFilter !== 'ALL' || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
                      ? 'Try clearing the search query or adjusting your filters above to see the full service records.'
                      : 'This machinery unit is fully operational with no historical breakdown logs recorded yet.'}
                  </div>
                </div>
              ) : (
                filteredLogs.map((log: RepairLog, sIdx: number) => {
                  const isExpanded = expandedLogIds.includes(log.id);
                  const isCompleted = log.status === 'OPERATIONAL' || log.status === 'CLOSED';
                  const techLead = log.tech_lead || (log as any).techLead;
                  const spareHead = log.spare_head || (log as any).spareHead;
                  const spareRequests = log.spare_requests || (log as any).spareRequests || [];
                  const auditLogs = log.audit_logs || (log as any).auditLogs || [];

                  return (
                    <div
                      key={log.id}
                      className="card"
                      style={{
                        padding: '20px 22px',
                        background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.9) 0%, rgba(11, 17, 30, 0.95) 100%)',
                        border: log.ticket_type === 'BREAKDOWN_REPAIR' || (log.status !== 'OPERATIONAL' && log.status !== 'CLOSED') ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Service Card Header & Summary Bar */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '12px',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleExpandLog(log.id)}
                      >
                        <div style={{ flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.82rem', fontWeight: 800, padding: '3px 8px' }}>
                              Service #{rawLogs.length - sIdx} &bull; {log.ticket_number}
                            </span>
                            <span className="badge badge-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                              {log.ticket_type ? log.ticket_type.replace(/_/g, ' ') : 'SERVICE'}
                            </span>
                            {getPriorityBadge(log.priority)}
                            {getStatusBadge(log.status)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Calendar size={14} color="var(--accent-cyan)" />
                              Reported: {new Date(log.created_at || log.breakdown_start_time).toLocaleDateString()} at {new Date(log.created_at || log.breakdown_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {log.breakdown_end_time && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-emerald)' }}>
                                <CheckCircle2 size={14} />
                                Resolved: {new Date(log.breakdown_end_time).toLocaleDateString()}
                              </span>
                            )}

                            {log.total_downtime_minutes ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-amber)', fontWeight: 700 }}>
                                <Clock size={14} />
                                Downtime: {log.total_downtime_minutes} mins ({Math.round((log.total_downtime_minutes / 60) * 10) / 10} hrs)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandLog(log.id);
                            }}
                          >
                            {isExpanded ? (
                              <>
                                <span>Collapse</span>
                                <ChevronUp size={15} />
                              </>
                            ) : (
                              <>
                                <span>Expand Details</span>
                                <ChevronDown size={15} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Full Content */}
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                          {/* 1. Reported Issue & Engineering Diagnosis Analysis */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                            <div
                              style={{
                                background: 'rgba(244, 63, 94, 0.06)',
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(244, 63, 94, 0.3)',
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={15} />
                                <span>Reported Issue & Production Floor Symptoms</span>
                              </div>
                              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                {log.reported_issue}
                              </div>
                            </div>

                            <div
                              style={{
                                background: 'rgba(6, 182, 212, 0.06)',
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Wrench size={15} />
                                <span>Technical Diagnosis & Engineering Actions Taken</span>
                              </div>
                              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                {log.diagnosis_notes || 'Preliminary diagnosis logged. Awaiting technical sign-off.'}
                              </div>
                            </div>
                          </div>

                          {/* 2. Complete 4-Tier Authority Handling Chain */}
                          <div
                            style={{
                              padding: '16px 18px',
                              background: 'rgba(15, 23, 42, 0.85)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}
                          >
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ShieldCheck size={17} color="var(--accent-cyan)" />
                              <span>Complete History of Authorities Handled this Service Ticket</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                              {/* 1. Reporting Supervisor */}
                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 800, textTransform: 'uppercase' }}>
                                  Stage 1 &bull; Reporting Authority
                                </div>
                                <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem', marginTop: '3px' }}>
                                  {log.reporter?.name || 'Line Supervisor'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {formatRoleName(log.reporter?.role || 'LINE_SUPERVISOR')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  {log.reporter?.email || 'supervisor@leathermfg.com'}
                                </div>
                                {log.reporter?.phone && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Tel: {log.reporter.phone}
                                  </div>
                                )}
                              </div>

                              {/* 2. Servicing Mechanic */}
                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>
                                  Stage 2 &bull; Assigned Servicing Mechanic
                                </div>
                                <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem', marginTop: '3px' }}>
                                  {log.mechanic?.name || 'Primary Technician'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {formatRoleName(log.mechanic?.role || 'MECHANIC')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  {log.mechanic?.email || 'mechanic@leathermfg.com'}
                                </div>
                                {log.mechanic?.phone && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Tel: {log.mechanic.phone}
                                  </div>
                                )}
                              </div>

                              {/* 3. Tech Lead Approver */}
                              {techLead && (
                                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 800, textTransform: 'uppercase' }}>
                                    Stage 3 &bull; Diagnostic Approver
                                  </div>
                                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem', marginTop: '3px' }}>
                                    {techLead.name}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {formatRoleName(techLead.role)}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {techLead.email}
                                  </div>
                                  {techLead.phone && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      Tel: {techLead.phone}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 4. Spare Head Dispatcher */}
                              {spareHead && (
                                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
                                    Stage 4 &bull; Warehouse Spares Authority
                                  </div>
                                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem', marginTop: '3px' }}>
                                    {spareHead.name}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {formatRoleName(spareHead.role)}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {spareHead.email}
                                  </div>
                                  {spareHead.phone && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      Tel: {spareHead.phone}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 3. Replaced Spares & Parts Dispatched Table */}
                          {spareRequests && spareRequests.length > 0 && (
                            <div style={{ padding: '14px 18px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Package size={16} />
                                  <span>Spare Parts Consumed / Dispatched for this Service ({spareRequests.length} Line Items)</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Inventory Deductions Reconciled
                                </span>
                              </div>

                              <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                      <th style={{ padding: '8px 10px' }}>Part Details</th>
                                      <th style={{ padding: '8px 10px' }}>Part Number</th>
                                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty Dispatched</th>
                                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Cost</th>
                                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Value</th>
                                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dispatch Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {spareRequests.map((sr: any) => {
                                      const qty = sr.dispatched_quantity || sr.approved_quantity || sr.requested_quantity || 1;
                                      const unitCost = sr.unit_cost_at_dispatch || sr.part?.unit_cost || 0;
                                      const lineTotal = qty * unitCost;

                                      return (
                                        <tr key={sr.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#fff' }}>
                                            {sr.part?.name || `Part #${sr.part_id}`}
                                          </td>
                                          <td style={{ padding: '8px 10px', color: 'var(--accent-cyan)' }}>
                                            <code>{sr.part?.part_number || 'PN-N/A'}</code>
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                            <span className="badge badge-secondary" style={{ fontWeight: 800 }}>
                                              {qty} unit{qty > 1 ? 's' : ''}
                                            </span>
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            ${Number(unitCost).toFixed(2)}
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                                            ${lineTotal.toFixed(2)}
                                          </td>
                                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                            <span className={`badge ${sr.status === 'DISPATCHED' ? 'badge-success' : sr.status === 'APPROVED' ? 'badge-primary' : 'badge-warning'}`}>
                                              {sr.status}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* 4. Audit Trail & Sign-off History */}
                          {auditLogs && auditLogs.length > 0 && (
                            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                                Audit Ledger Verification Signatures
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {auditLogs.map((a: any) => (
                                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>&bull; {a.remarks || `${a.change_type} recorded`}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                      {new Date(a.timestamp || a.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= TAB 2: CUMULATIVE AUTHORITIES ROSTER ================= */}
          {activeTab === 'authorities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                Complete chain of custody record for all engineers, technicians, and supervisory officials who have handled, repaired, inspected, or dispatched parts for <strong>{machine.machine_code}</strong>:
              </div>

              {!serviceStats?.authorities_roster || serviceStats.authorities_roster.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                  <div>No authority handling history recorded yet for this asset.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                  {serviceStats.authorities_roster.map((auth: AuthorityHandledRecord, aIdx: number) => (
                    <div
                      key={auth.user?.id || aIdx}
                      className="card"
                      style={{
                        padding: '18px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                            {auth.user?.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '2px' }}>
                            {formatRoleName(auth.role || auth.user?.role)}
                          </div>
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px' }}>
                          {auth.interventions_count} Event{auth.interventions_count > 1 ? 's' : ''} Handled
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} color="var(--text-muted)" />
                          <span>{auth.user?.email}</span>
                        </div>
                        {auth.user?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} color="var(--text-muted)" />
                            <span>{auth.user?.phone}</span>
                          </div>
                        )}
                        {auth.last_activity_at && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                            <Clock size={14} />
                            <span>Last Handled: {new Date(auth.last_activity_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Action types */}
                      <div style={{ marginTop: '2px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
                          Handling Roles on this Machine:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {auth.action_types?.map((act, i) => (
                            <span key={i} className="badge badge-secondary" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: SPECIFICATIONS & METADATA ================= */}
          {activeTab === 'specs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.04em' }}>
                  Complete Technical Specifications Dictionary
                </div>

                {machine.specifications && Object.keys(machine.specifications).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {Object.entries(machine.specifications).map(([k, v]) => {
                      if (!v || typeof v === 'object') return null;
                      return (
                        <div key={k} style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {k.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: '3px' }}>
                            {String(v)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No technical specifications provided for this machine.
                  </div>
                )}
              </div>

              {/* QR Code Passport Info */}
              <div className="card" style={{ padding: '18px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={18} />
                  <span>Encrypted QR Passport Hash</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  This machine's shopfloor physical tag is encoded with: <code style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{machine.qr_code_hash}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
