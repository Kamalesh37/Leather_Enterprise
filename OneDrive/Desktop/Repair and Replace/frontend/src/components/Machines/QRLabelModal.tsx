import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Machine } from '../../types';
import { Modal } from '../Common/Modal';
import { Printer, QrCode, Building, Layers, MapPin, Cpu } from 'lucide-react';

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine | null;
}

export const QRLabelModal: React.FC<QRLabelModalProps> = ({ isOpen, onClose, machine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen && machine && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        machine.qr_code_hash,
        {
          width: 220,
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
  }, [isOpen, machine]);

  if (!machine) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={20} color="var(--primary)" />
          <span>Machine Asset QR Passport Tag</span>
        </div>
      }
      isPrintable={true}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print QR Label</span>
          </button>
        </div>
      }
    >
      <div className="printable-qr-card" id="printable-qr-tag">
        {/* Printable Label Header */}
        <div className="qr-label-header">
          <div className="qr-label-brand">
            <Cpu size={24} color="#000000" />
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
                <Building size={14} />
                <span>{machine.block?.name || 'Block Alpha'}</span>
              </div>
              <div className="qr-loc-item">
                <Layers size={14} />
                <span>{machine.floor?.name || 'Level 1'}</span>
              </div>
              <div className="qr-loc-item">
                <MapPin size={14} />
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
    </Modal>
  );
};
