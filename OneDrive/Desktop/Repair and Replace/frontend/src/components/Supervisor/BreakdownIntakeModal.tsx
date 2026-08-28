import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Machine, Priority, ServiceCatalogItem, TicketType, User } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  AlertTriangle,
  Wrench,
  Cpu,
  MapPin,
  Clock,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';

interface BreakdownIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  machine: Machine | null;
  suggestedServices?: ServiceCatalogItem[];
}

export const BreakdownIntakeModal: React.FC<BreakdownIntakeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  machine,
  suggestedServices = [],
}) => {
  const toast = useToast();

  const [ticketType, setTicketType] = useState<TicketType>('BREAKDOWN_REPAIR');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [reportedIssue, setReportedIssue] = useState<string>('');
  const [mechanicId, setMechanicId] = useState<string>('');
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      Api.getActiveMechanics().then((res) => {
        if (res.success && res.data) {
          setMechanics(res.data);
          if (res.data.length > 0) {
            setMechanicId(String(res.data[0].id));
          }
        }
      });
      setReportedIssue('');
      setTicketType('BREAKDOWN_REPAIR');
      setPriority('HIGH');
    }
  }, [isOpen]);

  if (!machine) return null;

  const handleApplyTemplate = (srv: ServiceCatalogItem) => {
    setTicketType('ROUTINE_SERVICE');
    setReportedIssue(`[Scheduled Routine Service: ${srv.title}]\n\nStandard Procedures:\n${srv.standard_procedures.map((p) => `• ${p}`).join('\n')}`);
    toast.info(`Applied service template: ${srv.title}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportedIssue.trim()) {
      toast.error('Please describe the breakdown symptoms or service requirements.');
      return;
    }

    setSubmitting(true);
    try {
      await Api.createTicket({
        machine_id: machine.id,
        ticket_type: ticketType,
        priority,
        reported_issue: reportedIssue,
        mechanic_id: mechanicId ? Number(mechanicId) : null,
      });

      toast.success(`Breakdown ticket created for ${machine.machine_code}. Machine marked as ${ticketType === 'BREAKDOWN_REPAIR' ? 'BREAKDOWN' : 'UNDER_MAINTENANCE'}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="var(--accent-rose)" />
          <span>Line Supervisor: Machine Breakdown & Intake</span>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating Ticket...' : 'Dispatch Breakdown Ticket'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Machine Identity Banner */}
        <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="user-avatar-sm" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}>
                <Cpu size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {machine.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Code: <strong>{machine.machine_code}</strong> | Serial: {machine.serial_number} | Model: {machine.model_number}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {machine.line?.name || 'Production Line'}
            </div>
          </div>
        </div>

        {/* Frequent Service Catalog Quick Select */}
        {suggestedServices && suggestedServices.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Sparkles size={14} color="var(--accent-amber)" />
              <span>Suggested Routine Service Templates:</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedServices.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  className="quick-service-pill"
                  onClick={() => handleApplyTemplate(srv)}
                >
                  <Clock size={12} />
                  <span>{srv.title}</span>
                  <span style={{ opacity: 0.7 }}>({srv.estimated_duration_minutes}m)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Type & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Ticket Type *</label>
            <select
              className="form-select"
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as TicketType)}
            >
              <option value="BREAKDOWN_REPAIR">Breakdown Repair (Unscheduled)</option>
              <option value="ROUTINE_SERVICE">Routine Maintenance / Calibration</option>
            </select>
          </div>

          <div>
            <label className="form-label">Urgency & Priority *</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="CRITICAL">Critical (Line Stoppage / Bottleneck)</option>
              <option value="HIGH">High (Immediate Action)</option>
              <option value="MEDIUM">Medium (Normal Queue)</option>
              <option value="LOW">Low (Minor Calibration)</option>
            </select>
          </div>
        </div>

        {/* Reported Issue */}
        <div>
          <label className="form-label">Breakdown Diagnosis / Failure Symptoms *</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Describe what occurred (e.g. Needle bar jammed, motor tripping breaker, hydraulic seal blown, unequal skiving cut)..."
            value={reportedIssue}
            onChange={(e) => setReportedIssue(e.target.value)}
            required
          />
        </div>

        {/* Assign Mechanic */}
        <div>
          <label className="form-label">Assign Active Line Mechanic</label>
          <div className="input-group">
            <UserCheck size={16} className="input-icon" />
            <select
              className="form-select"
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
            >
              <option value="">-- Unassigned (Mechanic Pool) --</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.active_repairs_count ?? 0} active tickets)
                </option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Assigning a mechanic immediately places the machine into DIAGNOSING status.
          </p>
        </div>
      </form>
    </Modal>
  );
};
