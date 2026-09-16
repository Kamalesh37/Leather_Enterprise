import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Machine } from '../../types';
import { Modal } from '../Common/Modal';
import { Printer, QrCode, Building, Layers, MapPin, Cpu, ChevronLeft, ChevronRight, Grid, Copy } from 'lucide-react';

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine?: Machine | null;
  machines?: Machine[] | null;
}

const SingleQRTag: React.FC<{ machine: Machine; isBatchItem?: boolean }> = ({ machine, isBatchItem = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (machine && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        machine.qr_code_hash,
        {
          width: isBatchItem ? 160 : 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [machine, isBatchItem]);

  return (
    <div
      className="printable-qr-card"
      id={`printable-qr-tag-${machine.id}`}
      style={{
        margin: isBatchItem ? '0' : '0 auto',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Printable Label Header */}
      <div className="qr-label-header">
        <div className="qr-label-brand">
          <Cpu size={22} color="#000000" />
          <div>
            <div className="qr-brand-title">LEATHERTECH ASSET PASSPORT</div>
            <div className="qr-brand-sub">Enterprise Machinery Maintenance System</div>
          </div>
        </div>
        <div className="qr-asset-code">{machine.machine_code}</div>
      </div>

      {/* QR & Core Info Section */}
      <div className="qr-label-body">
        <div className="qr-canvas-wrapper">
          <canvas ref={canvasRef} />
          <div className="qr-hash-text">{machine.qr_code_hash}</div>
        </div>

        <div className="qr-meta-details">
          <div className="qr-machine-name">{machine.name}</div>
          <div className="qr-data-row">
            <span className="qr-label">Model:</span>
            <span className="qr-val">{machine.model_number}</span>
          </div>
          <div className="qr-data-row">
            <span className="qr-label">Serial No:</span>
            <span className="qr-val">{machine.serial_number}</span>
          </div>
          <div className="qr-data-row">
            <span className="qr-label">Vendor:</span>
            <span className="qr-val">{machine.vendor?.name || 'Authorized OEM'}</span>
          </div>

          <div className="qr-divider"></div>

          <div className="qr-location-box">
            <div className="qr-loc-item">
              <Building size={13} />
              <span>{machine.block?.name || 'Block Alpha'}</span>
            </div>
            <div className="qr-loc-item">
              <Layers size={13} />
              <span>{machine.floor?.name || 'Level 1'}</span>
            </div>
            <div className="qr-loc-item">
              <MapPin size={13} />
              <span>{machine.line?.name || 'Main Line'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Summary */}
      {machine.specifications && (
        <div className="qr-specs-footer">
          <div className="qr-specs-grid">
            {machine.specifications.motor_specs && (
              <div>
                <strong>Motor:</strong> {machine.specifications.motor_specs}
              </div>
            )}
            {machine.specifications.needle_type && (
              <div>
                <strong>Needle:</strong> {machine.specifications.needle_type}
              </div>
            )}
            {machine.specifications.hydraulic_rating && (
              <div>
                <strong>Hydraulic:</strong> {machine.specifications.hydraulic_rating}
              </div>
            )}
            {machine.specifications.air_pressure_bar && (
              <div>
                <strong>Air Pressure:</strong> {machine.specifications.air_pressure_bar}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="qr-security-footer">
        Scan QR with Line Supervisor App to report breakdown or view maintenance history.
      </div>
    </div>
  );
};

export const QRLabelModal: React.FC<QRLabelModalProps> = ({ isOpen, onClose, machine, machines }) => {
  const allMachines = machines && machines.length > 0 ? machines : machine ? [machine] : [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'batch_sheet'>('single');

  useEffect(() => {
    if (isOpen) {
      if (machine) {
        const foundIdx = allMachines.findIndex((m) => m.id === machine.id);
        setCurrentIndex(foundIdx >= 0 ? foundIdx : 0);
      } else {
        setCurrentIndex(0);
      }
      setViewMode(allMachines.length > 1 ? 'single' : 'single');
    }
  }, [isOpen, machine, machines]);

  if (!isOpen || allMachines.length === 0) return null;

  const currentMachine = allMachines[currentIndex] || allMachines[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <QrCode size={22} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
              Machine Asset QR Passport Tag {allMachines.length > 1 ? `(${allMachines.length} Units Available)` : ''}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Individual encrypted QR code for shopfloor scanner & breakdown reporting
            </div>
          </div>
        </div>
      }
      isPrintable={true}
      size={viewMode === 'batch_sheet' ? 'lg' : 'md'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
            ⚡ Verified QR Hash: {currentMachine.qr_code_hash}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>{viewMode === 'batch_sheet' ? `Print All ${allMachines.length} QR Labels` : 'Print QR Label'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Multi-Unit Navigator Bar */}
        {allMachines.length > 1 && (
          <div
            className="card"
            style={{
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-input)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                Physical Unit:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px' }}
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                <span
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  Unit {currentIndex + 1} of {allMachines.length} ({currentMachine.machine_code})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px' }}
                  disabled={currentIndex === allMachines.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(allMachines.length - 1, prev + 1))}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'single' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setViewMode('single')}
              >
                <QrCode size={13} />
                <span>Single Unit</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'batch_sheet' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setViewMode('batch_sheet')}
              >
                <Grid size={13} />
                <span>Batch Sheet ({allMachines.length} QR Tags)</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Display */}
        {viewMode === 'single' ? (
          <SingleQRTag machine={currentMachine} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {allMachines.map((m) => (
              <SingleQRTag key={m.id} machine={m} isBatchItem={true} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

