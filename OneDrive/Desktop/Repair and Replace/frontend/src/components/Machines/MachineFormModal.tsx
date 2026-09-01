import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Block, Floor, Line, Vendor } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Cpu,
  Layers,
  Building,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Sliders,
  Tag,
  Wrench,
} from 'lucide-react';

interface MachineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SpecItem {
  id: string;
  key: string;
  label: string;
  value: string;
}

const COMMON_SPEC_SUGGESTIONS = [
  { key: 'motor_specs', label: 'Motor Specs', defaultVal: '750W Direct Drive AC Servo' },
  { key: 'needle_type', label: 'Needle System / Tool', defaultVal: 'Schmetz 134-35 LR Diamond Point (140/22)' },
  { key: 'stitch_length_max', label: 'Max Stitch Length', defaultVal: '12.0 mm' },
  { key: 'max_speed_rpm', label: 'Max Speed (SPM / RPM)', defaultVal: '3,000 SPM' },
  { key: 'hydraulic_rating', label: 'Hydraulic Rating / Force', defaultVal: '25 Metric Tons (210 Bar)' },
  { key: 'platen_size', label: 'Bed / Platen Dimensions', defaultVal: '900 x 450 mm' },
  { key: 'stroke_length', label: 'Stroke Length', defaultVal: '100 mm' },
  { key: 'working_width', label: 'Working Width (mm)', defaultVal: '420 mm' },
  { key: 'knife_type', label: 'Knife / Blade Type', defaultVal: 'Continuous Bandknife (3500x50x0.8mm)' },
  { key: 'splitting_thickness', label: 'Splitting Thickness Range', defaultVal: '0.2mm to 8.0mm (±0.05mm)' },
  { key: 'heating_temperature', label: 'Platen Heating Temp', defaultVal: 'Up to 250°C (PID Thermostat)' },
  { key: 'air_pressure_bar', label: 'Air Pressure (Bar)', defaultVal: '6.0 Bar Pneumatic' },
  { key: 'operating_voltage', label: 'Operating Voltage', defaultVal: '230V Single Phase / 400V 3-Phase' },
  { key: 'vacuum_system', label: 'Vacuum Hold-Down', defaultVal: '7.5 kW Multi-Zone Turbine' },
  { key: 'laser_guide', label: 'Laser Alignment Guide', defaultVal: 'Crosshair Red Laser 5mW' },
  { key: 'lubrication_type', label: 'Lubrication System', defaultVal: 'Automatic Oil Pump with Sight Glass' },
];

const CATEGORY_PRESETS: Record<string, { label: string; specs: { key: string; label: string; defaultValue: string }[] }> = {
  STITCHING: {
    label: 'Heavy Leather Stitcher / Walking Foot',
    specs: [
      { key: 'motor_specs', label: 'Motor Specs', defaultValue: '750W Direct Drive AC Servo' },
      { key: 'needle_type', label: 'Needle System / Gauge', defaultValue: 'Schmetz 134-35 LR (140/22)' },
      { key: 'stitch_length_max', label: 'Max Stitch Length', defaultValue: '12.0 mm' },
      { key: 'max_speed_rpm', label: 'Max Speed (SPM)', defaultValue: '3,000 SPM' },
      { key: 'air_pressure_bar', label: 'Air Pressure', defaultValue: '6.0 Bar' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '230V Single Phase 50Hz' },
    ],
  },
  CUTTING_PRESS: {
    label: 'Hydraulic Clicking Press / Die Cutter',
    specs: [
      { key: 'hydraulic_rating', label: 'Cutting Force', defaultValue: '25 Metric Tons (210 Bar)' },
      { key: 'platen_size', label: 'Bed / Platen Size', defaultValue: '900 x 450 mm' },
      { key: 'stroke_length', label: 'Stroke Length', defaultValue: '100 mm' },
      { key: 'motor_specs', label: 'Hydraulic Pump Motor', defaultValue: '3.0 kW 3-Phase' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '400V 3-Phase' },
      { key: 'oil_capacity', label: 'Hydraulic Tank', defaultValue: '60L ISO VG 46' },
    ],
  },
  CNC_CUTTER: {
    label: 'CNC Multi-Head Leather Cutter',
    specs: [
      { key: 'motor_specs', label: 'Oscillating Drives', defaultValue: 'Dual 3.5 kW Brushless Servos' },
      { key: 'cutting_speed', label: 'Max Cutting Speed', defaultValue: '80 m/min' },
      { key: 'blade_type', label: 'Tooling', defaultValue: 'Tungsten Carbide Oscillating Knife' },
      { key: 'vacuum_system', label: 'Vacuum Hold-down', defaultValue: '7.5 kW High-Suction' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '400V 3-Phase' },
      { key: 'air_pressure_bar', label: 'Air Pressure', defaultValue: '7.0 Bar' },
    ],
  },
  SKIVING: {
    label: 'Leather Skiving Machine',
    specs: [
      { key: 'motor_specs', label: 'Drive Motor', defaultValue: '0.75 kW Variable Speed' },
      { key: 'knife_type', label: 'Blade', defaultValue: 'Chromium Bell Knife' },
      { key: 'skiving_width_max', label: 'Max Skiving Width', defaultValue: '50 mm' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '230V Single Phase' },
      { key: 'air_pressure_bar', label: 'Air Pressure', defaultValue: '5.5 Bar' },
    ],
  },
  SPLITTING: {
    label: 'Bandknife Leather Splitting Machine',
    specs: [
      { key: 'motor_specs', label: 'Spindle Motor', defaultValue: '2.2 kW High-Torque' },
      { key: 'knife_type', label: 'Bandknife Spec', defaultValue: 'Endless Blade (3500x50x0.8mm)' },
      { key: 'work_width', label: 'Working Width', defaultValue: '420 mm' },
      { key: 'splitting_thickness', label: 'Thickness Range', defaultValue: '0.2mm to 8.0mm' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '380V 3-Phase' },
    ],
  },
  EMBOSSING: {
    label: 'Embossing & Hot Stamping Press',
    specs: [
      { key: 'hydraulic_rating', label: 'Embossing Pressure', defaultValue: '40 Metric Tons' },
      { key: 'heating_temperature', label: 'Platen Temp', defaultValue: 'Up to 250°C' },
      { key: 'platen_size', label: 'Platen Dimensions', defaultValue: '600 x 500 mm' },
      { key: 'foil_feed', label: 'Foil Feed Indexer', defaultValue: 'Automatic Stepper Indexer' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '400V 3-Phase' },
    ],
  },
  CUSTOM: {
    label: 'Custom Machine / Blank Specification Form',
    specs: [
      { key: 'motor_specs', label: 'Motor Specs', defaultValue: '' },
      { key: 'operating_voltage', label: 'Operating Voltage', defaultValue: '230V / 400V' },
    ],
  },
};

export const MachineFormModal: React.FC<MachineFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
  const [quantity, setQuantity] = useState<number>(1);

  // Location Hierarchy
  const [selectedBlockId, setSelectedBlockId] = useState<string>('1');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('1');
  const [selectedLineId, setSelectedLineId] = useState<string>('1');

  // Hierarchy Rename/Create State
  const [showHierarchyManager, setShowHierarchyManager] = useState<boolean>(false);
  const [newBlockName, setNewBlockName] = useState<string>('');
  const [newFloorName, setNewFloorName] = useState<string>('');
  const [newLineName, setNewLineName] = useState<string>('');

  // Machine Category Preset
  const [selectedCategoryPreset, setSelectedCategoryPreset] = useState<string>('STITCHING');

  // Dynamic Specifications Builder
  const [specsList, setSpecsList] = useState<SpecItem[]>([
    { id: '1', key: 'motor_specs', label: 'Motor Specs', value: '750W Direct Drive AC Servo' },
    { id: '2', key: 'needle_type', label: 'Needle System / Gauge', value: 'Schmetz 134-35 LR Diamond Point (140/22)' },
    { id: '3', key: 'stitch_length_max', label: 'Max Stitch Length', value: '12.0 mm' },
    { id: '4', key: 'max_speed_rpm', label: 'Max Speed (SPM)', value: '3,000 SPM' },
    { id: '5', key: 'air_pressure_bar', label: 'Air Pressure', value: '6.0 Bar Pneumatic' },
    { id: '6', key: 'operating_voltage', label: 'Operating Voltage', value: '230V Single Phase 50Hz' },
  ]);

  const [customSpecLabel, setCustomSpecLabel] = useState<string>('');
  const [customSpecValue, setCustomSpecValue] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchHierarchyData = () => {
    Api.getHierarchyOptions().then((res) => {
      if (res.success && res.data) {
        setBlocks(res.data.blocks);
        setFloors(res.data.floors);
        setLines(res.data.lines);
        if (res.data.blocks.length > 0 && !selectedBlockId) {
          setSelectedBlockId(String(res.data.blocks[0].id));
        }
        if (res.data.floors.length > 0 && !selectedFloorId) {
          setSelectedFloorId(String(res.data.floors[0].id));
        }
        if (res.data.lines.length > 0 && !selectedLineId) {
          setSelectedLineId(String(res.data.lines[0].id));
        }
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchHierarchyData();

      Api.listVendors().then((res) => {
        if (res.success && res.data) {
          setVendors(res.data);
          if (res.data.length > 0 && !vendorId) setVendorId(String(res.data[0].id));
        }
      });
    }
  }, [isOpen]);

  const filteredFloors = floors.filter((f) => !selectedBlockId || String(f.block_id) === selectedBlockId);
  const filteredLines = lines.filter((l) => !selectedFloorId || String(l.floor_id) === selectedFloorId);

  // Apply Preset Specifications
  const handleApplyPreset = (presetKey: string) => {
    setSelectedCategoryPreset(presetKey);
    const preset = CATEGORY_PRESETS[presetKey];
    if (preset) {
      const newSpecs: SpecItem[] = preset.specs.map((s, idx) => ({
        id: `${Date.now()}-${idx}`,
        key: s.key,
        label: s.label,
        value: s.defaultValue,
      }));
      setSpecsList(newSpecs);
      toast.info(`Applied specification template for: ${preset.label}`);
    }
  };

  // Add Spec from Quick Dropdown
  const handleAddSuggestedSpec = (itemKey: string) => {
    const found = COMMON_SPEC_SUGGESTIONS.find((c) => c.key === itemKey);
    if (!found) return;

    // Check if already in list
    if (specsList.some((s) => s.key === found.key)) {
      toast.info(`Specification "${found.label}" is already in the list.`);
      return;
    }

    const newSpec: SpecItem = {
      id: `${Date.now()}-${Math.random()}`,
      key: found.key,
      label: found.label,
      value: found.defaultVal,
    };
    setSpecsList((prev) => [...prev, newSpec]);
  };

  // Add Custom Spec Row
  const handleAddCustomSpec = () => {
    if (!customSpecLabel.trim()) {
      toast.error('Please enter a specification name/title.');
      return;
    }

    const key = customSpecLabel.trim().toLowerCase().replace(/\s+/g, '_');
    const newSpec: SpecItem = {
      id: `${Date.now()}-${Math.random()}`,
      key,
      label: customSpecLabel.trim(),
      value: customSpecValue.trim(),
    };

    setSpecsList((prev) => [...prev, newSpec]);
    setCustomSpecLabel('');
    setCustomSpecValue('');
    toast.success(`Added custom specification: ${newSpec.label}`);
  };

  // Update a spec item inline
  const handleUpdateSpec = (id: string, field: 'label' | 'value', val: string) => {
    setSpecsList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'label') {
            return {
              ...item,
              label: val,
              key: val.trim().toLowerCase().replace(/\s+/g, '_'),
            };
          }
          return { ...item, value: val };
        }
        return item;
      })
    );
  };

  // Remove a spec item
  const handleRemoveSpec = (id: string) => {
    setSpecsList((prev) => prev.filter((item) => item.id !== id));
  };

  // Hierarchy Creation Handlers
  const handleCreateBlock = async () => {
    if (!newBlockName.trim()) return;
    try {
      const res = await Api.createBlock({ name: newBlockName.trim(), code: newBlockName.trim() });
      toast.success(`Created Block: ${res.data.name}`);
      setNewBlockName('');
      fetchHierarchyData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create block.');
    }
  };

  const handleCreateFloor = async () => {
    if (!newFloorName.trim() || !selectedBlockId) return;
    try {
      const res = await Api.createFloor({
        block_id: Number(selectedBlockId),
        name: newFloorName.trim(),
        floor_number: filteredFloors.length + 1,
      });
      toast.success(`Created Floor: ${res.data.name}`);
      setNewFloorName('');
      fetchHierarchyData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create floor.');
    }
  };

  const handleCreateLine = async () => {
    if (!newLineName.trim() || !selectedFloorId) return;
    try {
      const res = await Api.createLine({
        floor_id: Number(selectedFloorId),
        name: newLineName.trim(),
        line_code: newLineName.trim(),
      });
      toast.success(`Created Line: ${res.data.name}`);
      setNewLineName('');
      fetchHierarchyData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create line.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineCode.trim() || !name.trim() || !serialNumber.trim()) {
      toast.error('Machine Code, Machine Name, and Serial Number are required.');
      return;
    }

    setSubmitting(true);
    try {
      // Build dynamic JSON specifications dictionary
      const specificationsDict: Record<string, string> = {};
      specsList.forEach((s) => {
        if (s.key && s.value) {
          specificationsDict[s.key] = s.value;
        }
      });

      const payload = {
        machine_code: machineCode.trim(),
        name: name.trim(),
        model_number: modelNumber.trim(),
        serial_number: serialNumber.trim(),
        quantity: Math.max(1, Number(quantity) || 1),
        vendor_id: vendorId ? Number(vendorId) : null,
        block_id: selectedBlockId ? Number(selectedBlockId) : null,
        floor_id: selectedFloorId ? Number(selectedFloorId) : null,
        line_id: selectedLineId ? Number(selectedLineId) : null,
        specifications: specificationsDict,
      };

      const res = await Api.storeMachine(payload);
      toast.success(res.message || `Successfully registered ${quantity} physical machine unit(s) with separate QR passports.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register machine.');
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
          <Cpu size={22} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              Register Leather Machinery & QR Passport
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Configure machine type specifications, batch quantity, individual QR passports, and line station placement
            </div>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
            ⚡ {quantity > 1 ? `Batch Provisioning ${quantity} physical units with separate unique QR tags` : 'Single unit registration with unique QR code'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Registering...' : quantity > 1 ? `Register ${quantity} Units & Generate QR Passports` : 'Save & Generate QR Passport'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* 1. Basic Identification & Quantity */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={15} />
            <span>1. MACHINE TYPE IDENTIFICATION & PROVISIONING QUANTITY</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">Base Asset Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MAC-DA-867"
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Machine Type / Model Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dürkopp Adler 867-M Stitcher"
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
              <label className="form-label">Base Serial Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SN-2026-9912"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
              />
            </div>

            {/* Quantity Stepper Input */}
            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantity to Add *</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{quantity} Unit{quantity > 1 ? 's' : ''}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontWeight: 800 }}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  style={{ textAlign: 'center', fontWeight: 700 }}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontWeight: 800 }}
                  onClick={() => setQuantity((prev) => Math.min(100, prev + 1))}
                >
                  +
                </button>
              </div>
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

          {/* Quantity Preset Quick Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Quantity:</span>
            {[1, 2, 3, 5, 10, 20].map((qVal) => (
              <button
                key={qVal}
                type="button"
                className={`btn btn-sm ${quantity === qVal ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                onClick={() => setQuantity(qVal)}
              >
                {qVal} {qVal === 1 ? 'Unit' : 'Units'}
              </button>
            ))}
          </div>

          {/* Multi-Unit Provisioning & Separate QR Preview */}
          {quantity > 1 && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(99, 102, 241, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                <Sparkles size={14} />
                <span>BATCH PROVISIONING {quantity} PHYSICAL UNITS WITH SEPARATE QR PASSCODES</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                The system will automatically instantiate {quantity} distinct physical machine units. Each unit will have a sequential machine code, unique serial number, and a <strong>separate unique QR code</strong> for shopfloor scanning:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                {Array.from({ length: Math.min(quantity, 12) }).map((_, idx) => {
                  const baseClean = (machineCode.trim() || 'MAC-ASSET').replace(/[-_#]?\d+$/, '');
                  const unitCode = `${baseClean}-${String(idx + 1).padStart(2, '0')}`;
                  return (
                    <span key={idx} className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                      Unit #{idx + 1}: <strong>{unitCode}</strong> &bull; 📲 QR Distinct
                    </span>
                  );
                })}
                {quantity > 12 && (
                  <span className="badge badge-secondary" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    +{quantity - 12} more physical units...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Location Assignment (Block A, Floor 1, Line 1) */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} />
              <span>2. LOCATION HIERARCHY (BLOCK &bull; FLOOR &bull; LINE)</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setShowHierarchyManager(!showHierarchyManager)}
            >
              <Edit3 size={12} />
              <span>{showHierarchyManager ? 'Hide Manager' : '+ Add / Rename Hierarchy'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">Block (e.g. Block A, Block B)</label>
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
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Floor (e.g. Floor 1, Floor 2)</label>
              <select
                className="form-select"
                value={selectedFloorId}
                onChange={(e) => {
                  setSelectedFloorId(e.target.value);
                  setSelectedLineId('');
                }}
              >
                <option value="">-- Select Floor --</option>
                {filteredFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Line (e.g. Line 1, Line 2, Line 3)</label>
              <select
                className="form-select"
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
              >
                <option value="">-- Select Line --</option>
                {filteredLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Hierarchy Add/Rename Expander */}
          {showHierarchyManager && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                QUICK-ADD NEW HIERARCHY NODES:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Block (e.g. Block D)"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateBlock}>
                    <Plus size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Floor (e.g. Floor 4)"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateFloor}>
                    <Plus size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Line (e.g. Line 7)"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={newLineName}
                    onChange={(e) => setNewLineName(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateLine}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Dynamic Technical Specifications Builder */}
        <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={15} />
              <span>3. DYNAMIC TECHNICAL SPECIFICATIONS</span>
            </div>

            {/* Template Preset Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load Preset:</span>
              <select
                className="form-select"
                style={{ fontSize: '0.8rem', padding: '4px 8px', width: 'auto' }}
                value={selectedCategoryPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
              >
                {Object.entries(CATEGORY_PRESETS).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Select, customize, add or remove technical specifications according to this machine's exact engineering data sheet.
          </p>

          {/* Quick-Add Common Spec Chips */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              + QUICK-SELECT COMMON SPECIFICATIONS TO ADD:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMON_SPEC_SUGGESTIONS.map((item) => {
                const isAlreadyAdded = specsList.some((s) => s.key === item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleAddSuggestedSpec(item.key)}
                    style={{
                      background: isAlreadyAdded ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                      border: `1px solid ${isAlreadyAdded ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isAlreadyAdded ? 'var(--primary-light)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    title={isAlreadyAdded ? 'Already added' : `Add ${item.label}`}
                  >
                    <span>{item.label}</span>
                    {isAlreadyAdded ? <Check size={11} color="var(--primary)" /> : <Plus size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specifications List Table / Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {specsList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No specifications configured. Click preset above or add custom specification fields below.
              </div>
            ) : (
              specsList.map((spec) => (
                <div
                  key={spec.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr 36px',
                    gap: '10px',
                    alignItems: 'center',
                    background: 'var(--bg-card)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '6px 8px', fontWeight: 600 }}
                      value={spec.label}
                      onChange={(e) => handleUpdateSpec(spec.id, 'label', e.target.value)}
                      placeholder="Spec Name (e.g. Motor)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      value={spec.value}
                      onChange={(e) => handleUpdateSpec(spec.id, 'value', e.target.value)}
                      placeholder="Spec Value (e.g. 750W Direct Drive Servo)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(spec.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove specification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Custom Specification Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr auto',
              gap: '10px',
              alignItems: 'center',
              background: 'rgba(99, 102, 241, 0.06)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(99, 102, 241, 0.3)',
            }}
          >
            <div>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                placeholder="Custom Spec Name (e.g. Laser Guide)"
                value={customSpecLabel}
                onChange={(e) => setCustomSpecLabel(e.target.value)}
              />
            </div>
            <div>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                placeholder="Custom Spec Value (e.g. 5mW Crosshair Red)"
                value={customSpecValue}
                onChange={(e) => setCustomSpecValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSpec();
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={handleAddCustomSpec}
            >
              <Plus size={14} />
              <span>Add Field</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
