import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Api } from '../../api/client';
import { WorkReport } from '../../types';
import { WorkReportModal } from './WorkReportModal';
import { useToast } from '../Common/Toast';
import {
  FileText,
  Inbox,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUp,
  User,
  Shield,
  Layers,
  MapPin,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const WorkReportsView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const isMechanic = user?.role === 'mechanic';
  const [activeTab, setActiveTab] = useState<'inbox' | 'my_submissions'>(isMechanic ? 'my_submissions' : 'inbox');
  const [inboxReports, setInboxReports] = useState<WorkReport[]>([]);
  const [myReports, setMyReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subordinateRoleFilter, setSubordinateRoleFilter] = useState<string>('');

  // Expanded report cards
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  // Modal State
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  // Acknowledging State
  const [acknowledgingReportId, setAcknowledgingReportId] = useState<number | null>(null);
  const [ackNotes, setAckNotes] = useState<string>('Reviewed and approved. Operations verified.');
  const [ackSubmitting, setAckSubmitting] = useState<boolean>(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [inboxRes, myRes] = await Promise.all([
        Api.getSubordinateWorkReports(),
        Api.getMyWorkReports(),
      ]);

      if (inboxRes.success && inboxRes.data) {
        setInboxReports(inboxRes.data);
      }
      if (myRes.success && myRes.data) {
        setMyReports(myRes.data);
      }
    } catch (err) {
      toast.error('Failed to load work reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'mechanic') {
      setActiveTab('my_submissions');
    } else {
      setActiveTab('inbox');
    }
    fetchReports();
  }, [user?.id, user?.role]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAcknowledge = async (reportId: number) => {
    setAckSubmitting(true);
    try {
      const res = await Api.acknowledgeWorkReport(reportId, {
        status: 'acknowledged',
        acknowledgement_notes: ackNotes,
      });

      if (res.success) {
        toast.success('Work report acknowledged with your official feedback notes!');
        setAcknowledgingReportId(null);
        fetchReports();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge report.');
    } finally {
      setAckSubmitting(false);
    }
  };

  const displayedList = activeTab === 'inbox' ? inboxReports : myReports;

  const filteredList = displayedList.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.manager?.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchRole = !subordinateRoleFilter || r.user?.role === subordinateRoleFilter;

    return matchSearch && matchStatus && matchRole;
  });

  const pendingInboxCount = inboxReports.filter((r) => r.status === 'submitted').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="badge badge-amber">Awaiting Review</span>;
      case 'reviewed':
        return <span className="badge badge-cyan">Reviewed</span>;
      case 'acknowledged':
        return <span className="badge badge-emerald">Acknowledged & Signed Off</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case 'morning':
        return <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Morning Shift</span>;
      case 'evening':
        return <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>Evening Shift</span>;
      case 'night':
        return <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>Night Shift</span>;
      default:
        return <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>General</span>;
    }
  };

  return (
    <div className="section-container">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">Designated Reporting System</span>
            {user && (
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Logged in as: {user.name} ({user.role.toUpperCase()})
              </span>
            )}
          </div>
          <h2 className="section-title">
            <FileText size={24} color="var(--primary)" />
            <span>Work Done Reporting & Higher Official Review</span>
          </h2>
          <p className="section-description">
            Strict hierarchical reporting: subordinates submit shift reports to their designated higher official, while officials review, give feedback, and sign off on reports within their designated scope.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setReportModalOpen(true)}
          >
            <Send size={16} />
            <span>Submit Shift Work Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Counters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {!isMechanic && (
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'inbox' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('inbox')}
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <Inbox size={15} />
                <span>Incoming Subordinate Reports</span>
                {pendingInboxCount > 0 && (
                  <span className="badge badge-rose" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
                    {pendingInboxCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'my_submissions' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('my_submissions')}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <Send size={15} />
              <span>My Submitted Reports ({myReports.length})</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ width: '220px' }}>
              <Search size={15} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {activeTab === 'inbox' && (
              <select
                className="form-select"
                style={{ width: '160px', fontSize: '0.85rem' }}
                value={subordinateRoleFilter}
                onChange={(e) => setSubordinateRoleFilter(e.target.value)}
              >
                <option value="">All Subordinates</option>
                <option value="mechanic">Technicians / Mechanics</option>
                <option value="line_supervisor">Line Supervisors</option>
                <option value="floor_manager">Floor Managers</option>
                <option value="tech_lead">Tech Leads</option>
              </select>
            )}

            <select
              className="form-select"
              style={{ width: '160px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="submitted">Awaiting Review</option>
              <option value="acknowledged">Acknowledged & Signed Off</option>
            </select>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={fetchReports}
              title="Refresh reports"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading work reports...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {activeTab === 'inbox'
              ? 'No incoming subordinate work reports found in this inbox.'
              : 'You have not submitted any work reports yet.'}
          </div>
        ) : (
          filteredList.map((report) => {
            const isExpanded = expandedIds.includes(report.id);
            const isAcknowledging = acknowledgingReportId === report.id;

            return (
              <div
                key={report.id}
                className="card"
                style={{
                  padding: '18px 20px',
                  background: report.status === 'submitted' ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-card)',
                  border: report.status === 'submitted' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
                  boxShadow: report.status === 'submitted' ? '0 4px 16px rgba(99, 102, 241, 0.08)' : 'none',
                }}
              >
                {/* Top Row: Author / Title / Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="user-avatar-md">{report.user?.name.charAt(0) || 'U'}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', margin: 0 }}>
                          {report.title}
                        </h4>
                        {getShiftBadge(report.shift)}
                        {getStatusBadge(report.status)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span>Author: <strong style={{ color: 'var(--text-primary)' }}>{report.user?.name}</strong> ({report.user?.role?.toUpperCase()})</span>
                        <span>&bull;</span>
                        <span>
                          {report.user?.line?.name ? (
                            <span style={{ color: 'var(--accent-cyan)' }}><MapPin size={12} /> {report.user.line.name}</span>
                          ) : report.user?.floor?.name ? (
                            <span style={{ color: 'var(--accent-emerald)' }}><Layers size={12} /> {report.user.floor.name}</span>
                          ) : (
                            <span>Global Operations</span>
                          )}
                        </span>
                        <span>&bull;</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.12)', padding: '1px 8px', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--primary-light)' }}>
                          <ArrowUp size={11} />
                          <span>Designated Recipient: <strong>{report.manager?.name || 'Higher Official'}</strong> ({report.manager?.role?.replace(/_/g, ' ') || 'Admin'})</span>
                        </div>
                        <span>&bull;</span>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(report.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Acknowledge Button for Higher Official */}
                    {activeTab === 'inbox' && report.status === 'submitted' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setAcknowledgingReportId(report.id);
                          if (!isExpanded) toggleExpand(report.id);
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Acknowledge & Sign Off</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleExpand(report.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} />
                          <span>Collapse</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          <span>View Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary Snippet */}
                <div style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {report.summary}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Tasks Completed Checklist */}
                    {report.tasks_completed && report.tasks_completed.length > 0 && (
                      <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Specific Tasks Completed ({report.tasks_completed.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {report.tasks_completed.map((task, tIdx) => (
                            <div
                              key={tIdx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--bg-card)',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={14} color="var(--accent-emerald)" />
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                  {task.title}
                                </span>
                                {task.details && (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    &bull; {task.details}
                                  </span>
                                )}
                              </div>
                              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantitative Metrics Grid */}
                    {report.metrics && Object.keys(report.metrics).length > 0 && (
                      <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Quantitative Performance Metrics
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                          {Object.entries(report.metrics).map(([mKey, mVal]) => (
                            <div
                              key={mKey}
                              style={{
                                background: 'var(--bg-card)',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {mKey.replace(/_/g, ' ')}
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                                {String(mVal)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blockers & Recommendations */}
                    {(report.blockers_and_delays || report.recommendations) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {report.blockers_and_delays && (
                          <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                              Blockers / Delays Noted:
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {report.blockers_and_delays}
                            </div>
                          </div>
                        )}

                        {report.recommendations && (
                          <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                              Recommendations for Leadership:
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {report.recommendations}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Official Higher Official Feedback & Acknowledgement */}
                    {report.status === 'acknowledged' && (
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={15} color="var(--accent-emerald)" />
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                              Manager Review & Official Sign-off
                            </span>
                          </div>
                          {report.acknowledged_at && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Signed off: {new Date(report.acknowledged_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                          "{report.acknowledgement_notes || 'Approved.'}"
                        </div>
                      </div>
                    )}

                    {/* Acknowledging Form Inline Box */}
                    {isAcknowledging && (
                      <div
                        style={{
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid var(--primary)',
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          marginTop: '8px',
                        }}
                      >
                        <label className="form-label" style={{ color: 'var(--primary-light)' }}>
                          Supervisor Feedback Notes & Acknowledgement Remarks:
                        </label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={ackNotes}
                          onChange={(e) => setAckNotes(e.target.value)}
                          placeholder="Add feedback remarks for the subordinate..."
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setAcknowledgingReportId(null)}
                            disabled={ackSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcknowledge(report.id)}
                            disabled={ackSubmitting}
                          >
                            <Check size={14} />
                            <span>{ackSubmitting ? 'Recording Sign-off...' : 'Confirm Sign-off & Feedback'}</span>
                          </button>
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

      {/* Work Report Submission Modal */}
      <WorkReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={fetchReports}
      />
    </div>
  );
};
