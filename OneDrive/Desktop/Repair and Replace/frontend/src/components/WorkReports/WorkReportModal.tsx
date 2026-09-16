import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Api } from '../../api/client';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  FileText,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUp,
  Shield,
  Layers,
  MapPin,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface WorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState<string>('');
  const [reportType, setReportType] = useState<string>('daily_work_done');
  const [shift, setShift] = useState<'morning' | 'evening' | 'night' | 'general'>('morning');
  const [summary, setSummary] = useState<string>('');
  const [tasks, setTasks] = useState<Array<{ title: string; status: 'completed' | 'in_progress' | 'pending'; details?: string }>>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [blockers, setBlockers] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(false);
  const [selectedManagerId, setSelectedManagerId] = useState<number | string>('');

  // Reporting chain of higher officials
  const reportingChain = user?.reporting_chain || [];
  const defaultHigherOfficial = user?.higher_official || user?.manager || (reportingChain.length > 0 ? reportingChain[0] : null);

  useEffect(() => {
    if (defaultHigherOfficial && !selectedManagerId) {
      setSelectedManagerId(defaultHigherOfficial.id);
    }
  }, [defaultHigherOfficial, user?.id]);

  // Load tailored template on open
  useEffect(() => {
    if (isOpen) {
      setLoadingTemplate(true);
      if (defaultHigherOfficial) {
        setSelectedManagerId(defaultHigherOfficial.id);
      }
      Api.getWorkReportTemplates()
        .then((res) => {
          if (res.success && res.data) {
            const d = res.data;
            setTitle(d.title || 'Shift Work Done Report');
            setReportType(d.report_type || 'daily_work_done');
            setShift(d.shift || 'morning');
            setSummary(d.summary || '');
            setTasks(d.tasks_completed || []);
            setMetrics(d.metrics || {});
            setBlockers(d.blockers_and_delays || 'None. Standard operations maintained.');
            setRecommendations(d.recommendations || '');
          }
        })
        .catch(() => {
          setTitle(`Daily Work Done Report - ${new Date().toLocaleDateString()}`);
          setSummary('Completed daily shift assignments.');
        })
        .finally(() => setLoadingTemplate(false));
    }
  }, [isOpen, user?.id]);

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { title: '', status: 'completed', details: '' }]);
  };

  const handleRemoveTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTaskChange = (idx: number, field: string, val: any) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: val } : t))
    );
  };

  const handleMetricChange = (key: string, val: any) => {
    setMetrics((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) {
      toast.error('Title and Summary are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        report_type: reportType,
        shift,
        summary,
        manager_id: selectedManagerId ? Number(selectedManagerId) : undefined,
        tasks_completed: tasks.filter((t) => t.title.trim().length > 0),
        metrics,
        blockers_and_delays: blockers,
        recommendations,
      };

      const res = await Api.submitWorkReport(payload);
      if (res.success) {
        toast.success(`Work report successfully submitted to designated higher official!`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit work report.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentRecipient = reportingChain.find((o) => o.id === Number(selectedManagerId)) || defaultHigherOfficial;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={22} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              Report Work Done to Higher Official
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Submit daily shift handover, tasks completed, metrics & escalations
            </div>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
            ⚡ Direct submission recorded with immutable timestamp
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              <Send size={15} />
              <span>{submitting ? 'Submitting Report...' : 'Submit Report to Designated Official'}</span>
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Recipient Higher Official Banner */}
        <div
          className="card"
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
              <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '50%' }}>
                <ArrowUp size={18} color="var(--primary-light)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  DESIGNATED RECIPIENT OFFICIAL
                </div>
                {reportingChain.length > 1 ? (
                  <div style={{ marginTop: '4px' }}>
                    <select
                      className="form-select"
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      style={{ fontSize: '0.88rem', fontWeight: 700, padding: '4px 8px', background: 'var(--bg-card)' }}
                    >
                      {reportingChain.map((official) => (
                        <option key={official.id} value={official.id}>
                          {official.name} — {official.designation || official.role}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                    {currentRecipient ? currentRecipient.name : 'Arthur Vance (Plant Director)'}
                  </div>
                )}
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentRecipient ? `${currentRecipient.email} • ${(currentRecipient as any).designation || currentRecipient.role}` : 'Executive Operations'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Author / Submitting as:</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-emerald)' }}>
                {user?.name} ({user?.role?.toUpperCase()})
              </div>
            </div>
          </div>
        </div>

        {/* Report Overview & Metadata */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="form-label">Report Title *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Shift 1 Maintenance & Service Log"
                required
              />
            </div>

            <div>
              <label className="form-label">Report Type</label>
              <select
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="daily_work_done">Daily Work Done</option>
                <option value="shift_handover">Shift Handover</option>
                <option value="maintenance_summary">Maintenance Summary</option>
                <option value="line_performance">Line Performance</option>
                <option value="floor_operations">Floor Operations</option>
                <option value="incident_escalation">Incident Escalation</option>
              </select>
            </div>

            <div>
              <label className="form-label">Shift</label>
              <select
                className="form-select"
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
              >
                <option value="morning">Morning Shift (07:00 - 15:00)</option>
                <option value="evening">Evening Shift (15:00 - 23:00)</option>
                <option value="night">Night Shift (23:00 - 07:00)</option>
                <option value="general">General Full Day</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Executive Work Summary *</label>
            <textarea
              className="form-input"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the main work accomplished during this shift..."
              required
            />
          </div>
        </div>

        {/* Tasks Completed Section */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Specific Tasks & Work Completed ({tasks.length})
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddTask}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Plus size={14} />
              <span>Add Task Item</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((task, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: '1 1 40%' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Task title (e.g. Lubricated clicker press)"
                    value={task.title}
                    onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ flex: '1 1 40%' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Details / Results (e.g. pressure at 180 bar)"
                    value={task.details || ''}
                    onChange={(e) => handleTaskChange(idx, 'details', e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <select
                  className="form-select"
                  value={task.status}
                  onChange={(e) => handleTaskChange(idx, 'status', e.target.value)}
                  style={{ width: '130px', fontSize: '0.8rem' }}
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveTask(idx)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px', color: 'var(--accent-rose)' }}
                  title="Remove task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quantitative Metrics Matrix */}
        {Object.keys(metrics).length > 0 && (
          <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Shift Performance Metrics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key} style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={val}
                    onChange={(e) => handleMetricChange(key, e.target.value)}
                    style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockers & Recommendations */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Blockers / Spare Shortages / Delays</label>
            <textarea
              className="form-input"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any operational hindrances..."
            />
          </div>

          <div>
            <label className="form-label">Recommendations for Higher Officials</label>
            <textarea
              className="form-input"
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Suggestions for next shift or tooling improvements..."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
