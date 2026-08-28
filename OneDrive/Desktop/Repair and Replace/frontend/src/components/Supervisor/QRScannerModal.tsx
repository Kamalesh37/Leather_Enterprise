import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import { QrCode, Camera, Upload, Keyboard, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (qrHash: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const toast = useToast();
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState<string>('QR-LM-ATOM888-001-ALPHA');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen && activeMode === 'camera') {
      setCameraError(null);
      const scannerElementId = 'reader';

      try {
        html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              // Successfully decoded QR
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  onScanSuccess(decodedText);
                  onClose();
                });
              } else {
                onScanSuccess(decodedText);
                onClose();
              }
            },
            (errorMessage) => {
              // Ignore standard frame scan errors
            }
          )
          .then(() => setIsScanning(true))
          .catch((err) => {
            console.warn('Camera scan start failed:', err);
            setCameraError(
              'Live webcam access unavailable or blocked by browser permissions. Use manual QR lookup below.'
            );
            setActiveMode('manual');
          });
      } catch (e: any) {
        setCameraError('Webcam initialization failed. Switching to manual QR input.');
        setActiveMode('manual');
      }
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, activeMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Please enter a valid QR Code Hash.');
      return;
    }
    onScanSuccess(manualCode.trim());
    onClose();
  };

  const sampleQRs = [
    { code: 'QR-LM-ATOM888-001-ALPHA', name: 'Atom CNC Leather Cutter (Line 01)' },
    { code: 'QR-LM-FORT50-001-ALPHA', name: 'Fortuna Leather Skiver (Line 02)' },
    { code: 'QR-LM-DA867-001-ALPHA', name: 'Dürkopp Adler Heavy Stitcher (Line 03)' },
    { code: 'QR-LM-TORITP40-001-ALPHA', name: 'Torielli 40-Ton Embossing Press' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={20} color="var(--primary)" />
          <span>Scan Machine QR Passport</span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('camera')}
            >
              <Camera size={14} />
              <span>Camera</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('manual')}
            >
              <Keyboard size={14} />
              <span>Manual / Quick Pick</span>
            </button>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeMode === 'camera' ? (
          <div>
            <div id="reader" style={{ width: '100%', minHeight: '280px', borderRadius: '12px', overflow: 'hidden' }}></div>
            {cameraError && (
              <div className="alert alert-warning" style={{ marginTop: '12px' }}>
                <AlertCircle size={16} />
                <span>{cameraError}</span>
              </div>
            )}
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Align machine QR tag squarely within the viewfinder camera.
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Enter Machine QR Hash</label>
              <div className="input-group">
                <QrCode size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. QR-LM-ATOM888-001-ALPHA"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Pick Sample QRs for Instant Demoing */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Quick Selection from Plant Floor Machines:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sampleQRs.map((sample) => (
                  <button
                    key={sample.code}
                    type="button"
                    className="quick-sample-btn"
                    onClick={() => {
                      setManualCode(sample.code);
                      onScanSuccess(sample.code);
                      onClose();
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sample.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{sample.code}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Lookup Machine Breakdown
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
