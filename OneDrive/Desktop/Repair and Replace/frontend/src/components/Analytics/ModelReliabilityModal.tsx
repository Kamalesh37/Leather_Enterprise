import React from 'react';
import { Modal } from '../Common/Modal';
import {
  Cpu,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface ModelReliabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelData: {
    machine_name: string;
    model_number: string;
    ticket_count: number;
    downtime_sum: number;
    affected_machines_count?: number;
  } | null;
  onNavigateToCatalog?: (searchQuery?: string, status?: string) => void;
}

export const ModelReliabilityModal: React.FC<ModelReliabilityModalProps> = ({
  isOpen,
  onClose,
  modelData,
  onNavigateToCatalog,
}) => {
  if (!modelData) return null;

  const avgDowntimePerIncident = modelData.ticket_count > 0
    ? Math.round((modelData.downtime_sum || 0) / modelData.ticket_count)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.18)',
              color: 'var(--accent-cyan)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
              {modelData.machine_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Model: {modelData.model_number}
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Historical Reliability Profile
          </span>
          {onNavigateToCatalog && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onNavigateToCatalog(modelData.model_number);
              }}
            >
              <span>View Units in Registry</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Metric Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
          }}
        >
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose-light)', fontWeight: 600 }}>
              TOTAL INCIDENTS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose-light)' }}>
              {modelData.ticket_count}
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
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber-light)', fontWeight: 600 }}>
              TOTAL DOWNTIME
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {modelData.downtime_sum || 0} <span style={{ fontSize: '0.8rem' }}>min</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              AVG MTTR / TICKET
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {avgDowntimePerIncident} <span style={{ fontSize: '0.8rem' }}>min</span>
            </div>
          </div>
        </div>

        {/* Reliability Rating & Engineering Notes */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Commercial Reliability Evaluation
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            This heavy-duty leather manufacturing model is engineered for continuous production shifts.
            Reported downtime incidents generally correlate with needle tension jams, hydraulic pump seal wear, or routine lubrication cycles.
          </p>
        </div>

        {/* Quick action info */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              Inspect Registered Units of this Model
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              View QR codes, operational status, serials, and scheduled maintenance
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
