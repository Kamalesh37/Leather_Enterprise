import React, { useState, useMemo } from 'react';
import { BreakdownMachineItem, Line } from '../../types';
import { Modal } from '../Common/Modal';
import {
  AlertTriangle,
  Clock,
  Wrench,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Cpu,
  UserCheck,
  CheckCircle2,
  Plus,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';


interface BreakdownMachineriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: BreakdownMachineItem[];
  lines: Line[];
  initialLineId?: number | null;
  onNavigateToCatalog?: (machineCode?: string, status?: string) => void;
  onNavigateToSupervisor?: (lineId?: number) => void;
  onOpenReportBreakdown?: () => void;
}

export const BreakdownMachineriesModal: React.FC<BreakdownMachineriesModalProps> = ({
  isOpen,
  onClose,
  machines,
  lines,
  initialLineId = null,
  onNavigateToCatalog,
  onNavigateToSupervisor,
  onOpenReportBreakdown,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>(
    initialLineId ? String(initialLineId) : ''
  );
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Sync initialLineFilter if prop changes
  React.useEffect(() => {
    if (initialLineId) {
      setSelectedLineFilter(String(initialLineId));
    } else {
      setSelectedLineFilter('');
    }
  }, [initialLineId, isOpen]);

  const normalizeText = (text?: string | null): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Filtered breakdown machines - instantly hides all non-matching machines
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      // 1. Search Query Filter (Case-insensitive, letters/tokens, accent-tolerant)
      if (search.trim()) {
        const terms = normalizeText(search).split(/\s+/).filter(Boolean);
        const searchableFields = [
          m.machine_code,
          m.name,
          m.model_number,
          m.vendor?.name,
          m.block?.name,
          m.floor?.name,
          m.line?.name,
          m.line?.line_code,
          m.active_ticket?.reported_issue,
          m.active_ticket?.ticket_number,
          m.active_ticket?.mechanic?.name,
          m.active_ticket?.reporter?.name,
        ]
          .map(normalizeText)
          .join(' ');

        const matchesAllTerms = terms.every((term) => searchableFields.includes(term));
        if (!matchesAllTerms) return false;
      }

      // 2. Line filter
      if (selectedLineFilter) {
        if (m.line?.id !== Number(selectedLineFilter)) {
          return false;
        }
      }

      // 3. Priority filter
      if (selectedPriorityFilter) {
        if (m.active_ticket?.priority !== selectedPriorityFilter) {
          return false;
        }
      }

      // 4. Status filter
      if (selectedStatusFilter) {
        if (m.status !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [machines, search, selectedLineFilter, selectedPriorityFilter, selectedStatusFilter]);

  // Summary counts
  const criticalCount = machines.filter((m) => m.active_ticket?.priority === 'CRITICAL').length;
  const unassignedCount = machines.filter((m) => !m.active_ticket?.mechanic).length;
  const totalDowntimeSum = machines.reduce((acc, m) => acc + (m.active_ticket?.elapsed_downtime_minutes || 0), 0);


  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="badge badge-rose" style={{ animation: 'pulse 2s infinite' }}>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return <span className="badge badge-amber">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-cyan">MEDIUM</span>;
      case 'LOW':
        return <span className="badge badge-secondary">LOW</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BREAKDOWN':
        return <span className="status-pill status-breakdown">Breakdown Bottleneck</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="status-pill status-waiting">Routine Maintenance</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  const highlightMatch = (text: string, query: string) => {

    if (!query.trim() || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: 'rgba(99, 102, 241, 0.45)',
            color: '#fff',
            borderRadius: '2px',
            padding: '0 2px',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (



    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.18)',
              color: 'var(--accent-rose)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              Active Breakdown Machineries
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
              Live equipment bottlenecks requiring immediate mechanic dispatch & diagnostic intervention
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredMachines.length}</strong> of {machines.length} active breakdown units
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {onOpenReportBreakdown && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenReportBreakdown();
                }}
              >
                <Plus size={15} />
                <span>Report Breakdown</span>
              </button>
            )}
            {onNavigateToCatalog && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateToCatalog(undefined, 'BREAKDOWN');
                }}
              >
                <span>View in Machinery Registry</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* KPI Mini Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose-light)', fontWeight: 600 }}>
              TOTAL BREAKDOWNS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              {machines.length}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber-light)', fontWeight: 600 }}>
              CRITICAL SEVERITY
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {criticalCount}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              UNASSIGNED CREW
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {unassignedCount}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan-light)', fontWeight: 600 }}>
              ACTIVE DOWNTIME SUM
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {totalDowntimeSum} <span style={{ fontSize: '0.9rem' }}>mins</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'var(--bg-input)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="input-group" style={{ flex: '1 1 220px', position: 'relative' }}>
            <Search size={15} className="input-icon" />
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.85rem', padding: '8px 32px 8px 36px' }}
              placeholder="Search by code, machine name, issue, or ticket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="form-select"
            style={{ width: '180px', fontSize: '0.85rem', padding: '8px 12px' }}
            value={selectedLineFilter}
            onChange={(e) => setSelectedLineFilter(e.target.value)}
          >
            <option value="">All Production Lines</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.line_code} - {l.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '150px', fontSize: '0.85rem', padding: '8px 12px' }}
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {(search || selectedLineFilter || selectedPriorityFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setSearch('');
                setSelectedLineFilter('');
                setSelectedPriorityFilter('');
                setSelectedStatusFilter('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Machinery Cards List */}
        {filteredMachines.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'var(--bg-input)',
            }}
          >
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              No breakdown machinery matching filter
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              All monitored units in this scope are running at optimal operational status.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredMachines.map((m) => {
              const ticket = m.active_ticket;
              return (
                <div
                  key={m.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(24, 34, 56, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {/* Top row: Machine Code, Name, Status & Priority */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span className="machine-code-badge">{highlightMatch(m.machine_code, search)}</span>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                          {highlightMatch(m.name, search)}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ({highlightMatch(m.model_number, search)})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} color="var(--accent-cyan)" />
                        <span>
                          {m.block?.name || 'Block A'} &rsaquo; {m.floor?.name || 'Floor 1'} &rsaquo;{' '}
                          <strong style={{ color: 'var(--accent-cyan-light)' }}>
                            {m.line?.name || 'Production Line'} ({m.line?.line_code})
                          </strong>
                        </span>
                      </div>
                    </div>


                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {ticket && getPriorityBadge(ticket.priority)}
                      {getStatusBadge(m.status)}
                    </div>
                  </div>

                  {/* Active Ticket Banner */}
                  {ticket ? (
                    <div
                      style={{
                        background: 'rgba(12, 19, 34, 0.8)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Active Ticket & Problem
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                            {ticket.ticket_number}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                            {ticket.reported_issue}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Assigned Mechanic
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {ticket.mechanic ? (
                            <>
                              <UserCheck size={15} color="var(--accent-emerald)" />
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {ticket.mechanic.name}
                              </span>
                              {ticket.mechanic.phone && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ({ticket.mechanic.phone})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                              ⚠️ Unassigned Mechanic
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Downtime Elapsed
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Clock size={15} color="var(--accent-rose)" />
                          <span style={{ fontWeight: 700, color: 'var(--accent-rose-light)', fontSize: '0.9rem' }}>
                            {ticket.elapsed_downtime_minutes} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(12, 19, 34, 0.6)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Machinery flagged as non-operational. No ticket currently active.
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '4px',
                    }}
                  >
                    {m.line && onNavigateToSupervisor && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => {
                          onClose();
                          onNavigateToSupervisor(m.line?.id);
                        }}
                      >
                        <Wrench size={13} />
                        <span>Open Line Station</span>
                      </button>
                    )}

                    {onNavigateToCatalog && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => {
                          onClose();
                          onNavigateToCatalog(m.machine_code, 'BREAKDOWN');
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Inspect in Catalog</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
