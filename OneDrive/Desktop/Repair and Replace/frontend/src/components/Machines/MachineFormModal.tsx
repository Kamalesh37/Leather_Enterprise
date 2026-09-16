import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Block, Floor, Line, Vendor, Machine } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import { Cpu, Edit3, Plus, Sparkles } from 'lucide-react';

interface MachineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  machine?: Machine | null;
}

export const MachineFormModal: React.FC<MachineFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  machine = null,
}) => {
  const toast = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lines, setLines] = useState<Line[]>([]);

  const [machineCode, setMachineCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [modelNumber, setModelNumber] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [status, setStatus] = useState<string>('OPERATIONAL');

  const [selectedBlockId, setSelectedBlockId] = useState<string>('1');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('1');
  const [selectedLineId, setSelectedLineId] = useState<string>('1');

  // Specs JSON builder
  const [motorSpecs, setMotorSpecs] = useState<string>('750W Direct Drive AC Servo');
  const [needleType, setNeedleType] = useState<string>('Schmetz 134-35 LR Diamond Point (140/22)');
  const [hydraulicRating, setHydraulicRating] = useState<string>('N/A (Pneumatic 6.0 Bar)');
  const [voltage, setVoltage] = useState<string>('230V Single Phase 50Hz');
  const [pressure, setPressure] = useState<string>('6.0 Bar');
  const [maxSpeed, setMaxSpeed] = useState<string>('3,000 SPM');

  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      Api.getHierarchyOptions().then((res) => {
        if (res.success && res.data) {
          setBlocks(res.data.blocks);
          setFloors(res.data.floors);
          setLines(res.data.lines);
        }
      });

      Api.listVendors().then((res) => {
        if (res.success && res.data) {
          setVendors(res.data);
          if (!machine && res.data.length > 0) setVendorId(String(res.data[0].id));
        }
      });

      if (machine) {
        setMachineCode(machine.machine_code || '');
        setName(machine.name || '');
        setModelNumber(machine.model_number || '');
        setSerialNumber(machine.serial_number || '');
        setVendorId(machine.vendor_id ? String(machine.vendor_id) : '');
        setStatus(machine.status || 'OPERATIONAL');
        setSelectedBlockId(machine.block_id ? String(machine.block_id) : '1');
        setSelectedFloorId(machine.floor_id ? String(machine.floor_id) : '1');
        setSelectedLineId(machine.line_id ? String(machine.line_id) : '1');

        if (machine.specifications) {
          setMotorSpecs(machine.specifications.motor_specs || '');
          setNeedleType(machine.specifications.needle_type || '');
          setHydraulicRating(machine.specifications.hydraulic_rating || '');
          setVoltage(machine.specifications.operating_voltage || '');
          setPressure(machine.specifications.air_pressure_bar || '');
          setMaxSpeed(machine.specifications.max_speed_rpm || '');
        }
      } else {
        setMachineCode('');
        setName('');
        setModelNumber('');
        setSerialNumber('');
        setStatus('OPERATIONAL');
        setSelectedBlockId('1');
        setSelectedFloorId('1');
        setSelectedLineId('1');
        setMotorSpecs('750W Direct Drive AC Servo');
        setNeedleType('Schmetz 134-35 LR Diamond Point (140/22)');
        setHydraulicRating('N/A (Pneumatic 6.0 Bar)');
        setVoltage('230V Single Phase 50Hz');
        setPressure('6.0 Bar');
        setMaxSpeed('3,000 SPM');
      }
    }
  }, [isOpen, machine]);

  const filteredFloors = floors.filter((f) => !selectedBlockId || String(f.block_id) === selectedBlockId);
  const filteredLines = lines.filter((l) => !selectedFloorId || String(l.floor_id) === selectedFloorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineCode || !name || !serialNumber) {
      toast.error('Machine Code, Name, and Serial Number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        machine_code: machineCode,
        name,
        model_number: modelNumber,
        serial_number: serialNumber,
        vendor_id: vendorId ? Number(vendorId) : null,
        block_id: selectedBlockId ? Number(selectedBlockId) : null,
        floor_id: selectedFloorId ? Number(selectedFloorId) : null,
        line_id: selectedLineId ? Number(selectedLineId) : null,
        status,
        specifications: {
          motor_specs: motorSpecs,
          needle_type: needleType,
          hydraulic_rating: hydraulicRating,
          operating_voltage: voltage,
          air_pressure_bar: pressure,
          max_speed_rpm: maxSpeed,
        },
      };

      if (machine) {
        await Api.updateMachine(machine.id, payload);
        toast.success(`Machine ${machineCode} specifications updated.`);
      } else {
        await Api.storeMachine(payload);
        toast.success(`Machine ${machineCode} registered with unique QR code.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || (machine ? 'Failed to update machine.' : 'Failed to register machine.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {machine ? <Edit3 size={20} color="var(--primary)" /> : <Cpu size={20} color="var(--primary)" />}
          <span>{machine ? `Edit Machinery: ${machine.name} (${machine.machine_code})` : 'Register Leather Machinery & Generate QR Passport'}</span>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : machine ? 'Update Machinery' : 'Save & Generate QR'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Basic Identification */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            1. MACHINE IDENTIFICATION & VENDOR
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">Asset Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MAC-DA-867-02"
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <label className="form-label">Machine Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Heavy Leather Walking Foot Stitcher"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Model Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 867-M-PREMIUM"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Serial Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SN-2026-9912"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Operational Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="BREAKDOWN">BREAKDOWN</option>
                <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                <option value="DECOMMISSIONED">DECOMMISSIONED</option>
              </select>
            </div>
            <div>
              <label className="form-label">Supplying Vendor</label>
              <select className="form-select" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.machinery_categories?.join(', ') || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Assignment */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            2. LINE LOCATION ASSIGNMENT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">Block</label>
              <select
                className="form-select"
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(e.target.value);
                  setSelectedFloorId('');
                  setSelectedLineId('');
                }}
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Floor</label>
              <select
                className="form-select"
                value={selectedFloorId}
                onChange={(e) => {
                  setSelectedFloorId(e.target.value);
                  setSelectedLineId('');
                }}
              >
                {filteredFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Line</label>
              <select
                className="form-select"
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
              >
                {filteredLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.line_code} - {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* JSON Specs Builder */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            3. TECHNICAL SPECIFICATIONS (JSON)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Motor Specs</label>
              <input
                type="text"
                className="form-input"
                value={motorSpecs}
                onChange={(e) => setMotorSpecs(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Needle Type / Cutting Tool</label>
              <input
                type="text"
                className="form-input"
                value={needleType}
                onChange={(e) => setNeedleType(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Hydraulic / Force Rating</label>
              <input
                type="text"
                className="form-input"
                value={hydraulicRating}
                onChange={(e) => setHydraulicRating(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Operating Voltage</label>
              <input
                type="text"
                className="form-input"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Air Pressure (Bar)</label>
              <input
                type="text"
                className="form-input"
                value={pressure}
                onChange={(e) => setPressure(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Max Speed / SPM</label>
              <input
                type="text"
                className="form-input"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
