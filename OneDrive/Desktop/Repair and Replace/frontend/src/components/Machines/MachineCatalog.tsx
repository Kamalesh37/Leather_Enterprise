import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Api } from '../../api/client';
import { Machine, Line, MachineTypeGroup } from '../../types';
import { QRLabelModal } from './QRLabelModal';
import { MachineFormModal } from './MachineFormModal';
import { MachineDetailsModal } from './MachineDetailsModal';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Cpu,
  Plus,
  Search,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Building,
  Layers,
  MapPin,
  FileText,
  Activity,
  Filter,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Boxes,
  Package,
  PlusCircle,
  Wrench,
  Grid,
  List,
  History,
  ShieldCheck,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';

interface MachineCatalogProps {
  onOpenBreakdown?: (machine: Machine) => void;
  initialStatus?: string;
  initialLineId?: number | string;
  initialSearch?: string;
}

export const MachineCatalog: React.FC<MachineCatalogProps> = ({
  onOpenBreakdown,
  initialStatus = '',
  initialLineId = '',
  initialSearch = '',
}) => {
  const toast = useToast();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // View Mode: Grouped by Machine Type (default) vs Flat Units List
  const [viewMode, setViewMode] = useState<'grouped_types' | 'flat_units'>('grouped_types');
  const [expandedTypeKeys, setExpandedTypeKeys] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState<string>(initialSearch || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || '');
  const [selectedLineId, setSelectedLineId] = useState<string>(initialLineId ? String(initialLineId) : '');

  // Suggestions panel state
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [batchQrMachines, setBatchQrMachines] = useState<Machine[] | null>(null);

  // Machine Details & Complete Authority Service History Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedMachineIdForDetails, setSelectedMachineIdForDetails] = useState<number | null>(null);

  // Quick Add Quantity to Existing Type Modal State
  const [addQtyModalOpen, setAddQtyModalOpen] = useState<boolean>(false);
  const [selectedGroupForQty, setSelectedGroupForQty] = useState<MachineTypeGroup | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [qtyTargetLineId, setQtyTargetLineId] = useState<string>('');
  const [qtySubmitting, setQtySubmitting] = useState<boolean>(false);

  // Sync props when navigated with new parameters
  useEffect(() => {
    if (initialStatus !== undefined) setSelectedStatus(initialStatus);
    if (initialLineId !== undefined) setSelectedLineId(initialLineId ? String(initialLineId) : '');
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialStatus, initialLineId, initialSearch]);

  // Fetch Hierarchy options once
  useEffect(() => {
    Api.getHierarchyOptions().then((res) => {
      if (res.success && res.data) {
        setLines(res.data.lines);
        if (res.data.lines.length > 0 && !qtyTargetLineId) {
          setQtyTargetLineId(String(res.data.lines[0].id));
        }
      }
    });
  }, []);

  const fetchMachines = async (searchQuery: string = search) => {
    setLoading(true);
    try {
      const res = await Api.listMachines({
        search: searchQuery || undefined,
        status: selectedStatus || undefined,
        line_id: selectedLineId ? Number(selectedLineId) : undefined,
      });
      if (res.success && res.data) {
        setMachines(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load machinery catalog.');
    } finally {
      setLoading(false);
    }
  };

  // Immediate debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMachines(search);
    }, 220);

    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedLineId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Contextual fallback machine image resolver
  const getMachineImageUrl = (imageUrl?: string | null, name?: string, model?: string): string => {
    if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
    const lower = `${name || ''} ${model || ''}`.toLowerCase();
    if (lower.includes('cutter') || lower.includes('atom') || lower.includes('cnc')) {
      return '/assets/machines/cutter.jpg';
    }
    if (lower.includes('skiv') || lower.includes('fortuna') || lower.includes('split') || lower.includes('camoga')) {
      return '/assets/machines/skiver.jpg';
    }
    if (lower.includes('press') || lower.includes('emboss') || lower.includes('tori')) {
      return '/assets/machines/press.jpg';
    }
    return '/assets/machines/stitcher.jpg';
  };

  // Case-insensitive & accent-insensitive text normalizer
  const normalizeText = (text?: string | null): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Check if a machine matches the search query across all relevant fields
  const matchMachine = (m: Machine, query: string): boolean => {
    if (!query || !query.trim()) return true;
    const qNorm = normalizeText(query);
    const terms = qNorm.split(/\s+/).filter(Boolean);

    const searchableFields = [
      m.name,
      m.machine_code,
      m.model_number,
      m.serial_number,
      m.qr_code_hash,
      m.vendor?.name,
      m.block?.name,
      m.floor?.name,
      m.line?.name,
      m.line?.line_code,
      m.specifications?.motor_specs,
      m.specifications?.needle_type,
      m.specifications?.hydraulic_rating,
      m.specifications?.air_pressure_bar,
    ]
      .map(normalizeText)
      .join(' ');

    return terms.every((term) => searchableFields.includes(term));
  };

  // Live filtered flat machines
  const displayedMachines = useMemo(() => {
    return machines.filter((m) => {
      if (selectedStatus && m.status !== selectedStatus) return false;
      if (selectedLineId && String(m.line_id) !== selectedLineId && String(m.line?.id) !== selectedLineId) return false;
      if (!matchMachine(m, search)) return false;
      return true;
    });
  }, [machines, search, selectedStatus, selectedLineId]);

  // Group machines by Machine Type / Model
  const groupedTypes = useMemo(() => {
    const groups: Record<string, MachineTypeGroup> = {};

    displayedMachines.forEach((m) => {
      const key = (m.model_number || m.name).trim();
      if (!groups[key]) {
        groups[key] = {
          type_key: key,
          name: m.name,
          model_number: m.model_number,
          vendor: m.vendor,
          vendor_id: m.vendor_id,
          specifications: m.specifications,
          image_url: m.image_url,
          total_quantity: 0,
          operational_count: 0,
          breakdown_count: 0,
          maintenance_count: 0,
          machines: [],
        };
      }

      groups[key].total_quantity += 1;
      if (m.status === 'OPERATIONAL') {
        groups[key].operational_count += 1;
      } else if (m.status === 'BREAKDOWN') {
        groups[key].breakdown_count += 1;
      } else if (m.status === 'UNDER_MAINTENANCE') {
        groups[key].maintenance_count += 1;
      }

      groups[key].machines.push(m);
    });

    return Object.values(groups);
  }, [displayedMachines]);

  // Expand the first type by default when groups load if nothing expanded yet
  useEffect(() => {
    if (groupedTypes.length > 0 && expandedTypeKeys.length === 0) {
      setExpandedTypeKeys([groupedTypes[0].type_key]);
    }
  }, [groupedTypes.length]);

  const toggleTypeExpand = (key: string) => {
    setExpandedTypeKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Compute live recommendation suggestions
  const suggestions = useMemo(() => {
    if (!search || search.trim().length < 2) return [];
    return machines
      .filter((m) => matchMachine(m, search))
      .slice(0, 5);
  }, [search, machines]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || query.length < 1) return text;
    const escapedQuery = query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.trim().toLowerCase() ? (
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

  const handleOpenCreate = () => {
    setEditingMachine(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (m: Machine) => {
    setEditingMachine(m);
    setFormModalOpen(true);
  };

  const handleDeleteMachine = async (m: Machine) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete Machine [${m.machine_code}] "${m.name}"?`
      )
    ) {
      return;
    }
    try {
      await Api.deleteMachine(m.id);
      toast.success(`Machine [${m.machine_code}] deleted successfully.`);
      fetchMachines();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete machine with active breakdown tickets.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return <span className="status-pill status-operational">Operational</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="status-pill status-waiting">Routine Maint</span>;
      case 'BREAKDOWN':
        return <span className="status-pill status-breakdown">Breakdown</span>;
      case 'DECOMMISSIONED':
        return <span className="status-pill status-decommissioned">Decommissioned</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (m: Machine) => {
    setSearch(m.machine_code);
    setShowSuggestions(false);
  };

  const handleOpenMachineDetails = (machineId: number) => {
    setSelectedMachineIdForDetails(machineId);
    setDetailsModalOpen(true);
  };

  const handleOpenAddQuantity = (group: MachineTypeGroup) => {
    setSelectedGroupForQty(group);
    setQtyToAdd(1);
    const sampleLine = group.machines[0]?.line_id || (lines[0]?.id ? String(lines[0].id) : '');
    setQtyTargetLineId(String(sampleLine));
    setAddQtyModalOpen(true);
  };

  const handleAddQuantitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForQty || qtyToAdd < 1) return;

    setQtySubmitting(true);
    try {
      const res = await Api.addMachineQuantity({
        model_number: selectedGroupForQty.model_number,
        machine_id: selectedGroupForQty.machines[0]?.id,
        quantity: Number(qtyToAdd),
        line_id: qtyTargetLineId ? Number(qtyTargetLineId) : undefined,
      });

      toast.success(res.message || `Added ${qtyToAdd} unit(s) with separate QR codes.`);
      setAddQtyModalOpen(false);
      fetchMachines();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add machine quantity.');
    } finally {
      setQtySubmitting(false);
    }
  };

  const handleOpenBatchQr = (group: MachineTypeGroup) => {
    setSelectedMachine(null);
    setBatchQrMachines(group.machines);
    setQrModalOpen(true);
  };

  const handleOpenSingleQr = (m: Machine, allGroupMachines?: Machine[]) => {
    setSelectedMachine(m);
    setBatchQrMachines(allGroupMachines || [m]);
    setQrModalOpen(true);
  };

  const hasActiveFilters = Boolean(search || selectedStatus || selectedLineId);

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">Machinery Registry & Asset Gallery</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {groupedTypes.length} Unique Machine Types &bull; {machines.length} Total Physical Units
            </span>
          </div>
          <h2 className="section-title">
            <Cpu size={24} color="var(--primary)" />
            <span>Leather Machinery & Asset QR Registry</span>
          </h2>
          <p className="section-description">
            Heavy leather machinery registry with high-resolution equipment imagery, expanded operational cards, multi-unit quantity tracking, and complete authority custody histories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Register Machine</span>
          </button>
        </div>
      </div>

      {/* Dynamic Control & Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grouped_types' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              onClick={() => setViewMode('grouped_types')}
            >
              <Boxes size={15} />
              <span>Machine Types & Quantities ({groupedTypes.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'flat_units' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              onClick={() => setViewMode('flat_units')}
            >
              <Grid size={15} />
              <span>All Physical Units ({displayedMachines.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div ref={searchContainerRef} className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: search ? '36px' : '14px', fontSize: '0.85rem' }}
              placeholder="Search by code, model, name, letters, line..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (search.trim().length >= 2) setShowSuggestions(true);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}

            {/* Live Recommendation Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Sparkles size={12} />
                  <span>Matching Machinery Recommendations ({suggestions.length})</span>
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSuggestion(s)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={getMachineImageUrl(s.image_url, s.name, s.model_number)}
                          alt={s.name}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                              {highlightMatch(s.machine_code, search)}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {highlightMatch(s.name, search)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Model: {highlightMatch(s.model_number, search)} &bull; {s.line?.name || 'Assigned Line'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(s.status)}
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: '160px', fontSize: '0.85rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="BREAKDOWN">Breakdown</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="DECOMMISSIONED">Decommissioned</option>
            </select>

            <select
              className="form-select"
              style={{ width: '190px', fontSize: '0.85rem' }}
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
            >
              <option value="">All Production Lines</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.line_code} - {l.name}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => {
                  setSearch('');
                  setSelectedStatus('');
                  setSelectedLineId('');
                  setShowSuggestions(false);
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{displayedMachines.length}</strong> of {machines.length} physical units across <strong style={{ color: 'var(--accent-cyan)' }}>{groupedTypes.length}</strong> machine types
            </span>
            {search && (
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Search: "{search}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
              </span>
            )}
            {selectedStatus && (
              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Status: {selectedStatus}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('')} />
              </span>
            )}
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
            ⚡ Expanded machinery profiles & contextual equipment imagery active
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && machines.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading machinery assets & quantity matrices...
        </div>
      ) : displayedMachines.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
          <AlertTriangle size={36} color="var(--accent-amber)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            No machinery assets match your search
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px' }}>
            No machines found matching "{search}". Try resetting the filters.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setSelectedStatus('');
              setSelectedLineId('');
            }}
          >
            Clear Search & Show All Machines
          </button>
        </div>
      ) : viewMode === 'grouped_types' ? (
        /* ================= 1. GROUPED BY MACHINE TYPE VIEW (EXPANDED CARDS) ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {groupedTypes.map((group) => {
            const isExpanded = expandedTypeKeys.includes(group.type_key);
            const machineImage = getMachineImageUrl(group.image_url, group.name, group.model_number);

            return (
              <div
                key={group.type_key}
                className="card"
                style={{
                  padding: '24px',
                  background: 'var(--bg-card)',
                  border: isExpanded ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid var(--border-color)',
                  boxShadow: isExpanded ? '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 20px rgba(99, 102, 241, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.25s ease',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {/* Top Machine Type Header Card with Expanded Photo Banner & Specs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleTypeExpand(group.type_key)}
                >
                  {/* Left Column: Rich Machine Photo Frame */}
                  <div
                    style={{
                      position: 'relative',
                      height: '180px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-light)',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <img
                      src={machineImage}
                      alt={group.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '8px 12px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        {group.vendor?.name || 'OEM Direct'}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(16, 185, 129, 0.9)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                        }}
                      >
                        ⚡ {group.total_quantity} Unit{group.total_quantity > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Center Column: Title, Quantity, Vendor, Health */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                        Model: {highlightMatch(group.model_number, search)}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                          color: 'var(--accent-emerald)',
                          border: '1px solid rgba(16, 185, 129, 0.45)',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                        }}
                      >
                        ⚡ Quantity: {group.total_quantity} Physical Unit{group.total_quantity > 1 ? 's' : ''} Deployed
                      </span>
                    </div>

                    <h3 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#fff', margin: 0, lineHeight: 1.3 }}>
                      {highlightMatch(group.name, search)}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>OEM Vendor: <strong style={{ color: 'var(--text-primary)' }}>{group.vendor?.name || 'OEM Direct'}</strong></span>
                      <span>&bull;</span>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {group.operational_count} Operational
                      </span>
                      {group.breakdown_count > 0 && (
                        <>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                            🔥 {group.breakdown_count} in Breakdown
                          </span>
                        </>
                      )}
                      {group.maintenance_count > 0 && (
                        <>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                            {group.maintenance_count} in Maintenance
                          </span>
                        </>
                      )}
                    </div>

                    {/* Quick Specs inline pill tags */}
                    {group.specifications && Object.keys(group.specifications).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {Object.entries(group.specifications).slice(0, 3).map(([k, v]) => {
                          if (!v || typeof v === 'object') return null;
                          return (
                            <span
                              key={k}
                              style={{
                                background: 'var(--bg-input)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <strong style={{ color: 'var(--accent-cyan)' }}>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '8px 14px', justifyContent: 'center' }}
                      onClick={() => handleOpenAddQuantity(group)}
                    >
                      <PlusCircle size={15} color="var(--accent-emerald)" />
                      <span>Add Quantity</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '8px 14px', justifyContent: 'center' }}
                      onClick={() => handleOpenBatchQr(group)}
                      title={`Batch print all ${group.total_quantity} QR tags for this machine model`}
                    >
                      <Printer size={15} color="var(--accent-cyan)" />
                      <span>Batch QR Tags ({group.total_quantity})</span>
                    </button>

                    <button
                      type="button"
                      className={`btn ${isExpanded ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.85rem', padding: '8px 14px', justifyContent: 'center', fontWeight: 700 }}
                      onClick={() => toggleTypeExpand(group.type_key)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={15} />
                          <span>Collapse Units</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={15} />
                          <span>View {group.total_quantity} Separate Machines &rsaquo;</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Specifications Row */}
                {group.specifications && Object.keys(group.specifications).length > 0 && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      fontSize: '0.8rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {Object.entries(group.specifications).map(([k, v]) => {
                      if (!v || typeof v === 'object') return null;
                      return (
                        <div key={k}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {k.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontWeight: 700, color: '#fff', marginTop: '1px' }}>
                            {String(v)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ================= SEPARATE PHYSICAL MACHINES (EXPANDED LARGE CARDS) ================= */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        INDIVIDUAL PHYSICAL MACHINES ({group.machines.length} UNITS WITH INDIVIDUAL QR CODES & HISTORIES)
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Click any unit to open full service history and authorities handled
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                      {group.machines.map((unit, uIdx) => {
                        const unitImage = getMachineImageUrl(unit.image_url, unit.name, unit.model_number);

                        return (
                          <div
                            key={unit.id}
                            style={{
                              background: unit.status === 'BREAKDOWN' ? 'rgba(244, 63, 94, 0.07)' : 'var(--bg-input)',
                              border: unit.status === 'BREAKDOWN' ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-lg)',
                              padding: '18px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '14px',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                            }}
                            onClick={() => handleOpenMachineDetails(unit.id)}
                          >
                            {/* Card Top: Image + Info */}
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                              <div
                                style={{
                                  width: '90px',
                                  height: '90px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  border: '1px solid var(--border-light)',
                                }}
                              >
                                <img
                                  src={unitImage}
                                  alt={unit.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                                      Unit #{uIdx + 1}
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                                      {highlightMatch(unit.machine_code, search)}
                                    </span>
                                  </div>
                                  {getStatusBadge(unit.status)}
                                </div>

                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  Serial: <strong style={{ color: 'var(--text-primary)' }}>{unit.serial_number}</strong>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  <MapPin size={13} color="var(--accent-cyan)" />
                                  <span>{unit.block?.name || 'Block A'} &rsaquo; {unit.floor?.name || 'Floor 1'} &rsaquo; <strong style={{ color: '#fff' }}>{unit.line?.name || 'Main Line'}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Service History & QR Banner */}
                            <div
                              style={{
                                padding: '10px 14px',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(99, 102, 241, 0.28)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.78rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600 }}>
                                <History size={15} color="var(--accent-cyan)" />
                                <span>Entire Service History & Custody Logs</span>
                              </div>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Eye size={13} /> Expand History &rsaquo;
                              </span>
                            </div>

                            {/* Card Footer Actions */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '10px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                                onClick={() => handleOpenMachineDetails(unit.id)}
                              >
                                <History size={14} color="var(--accent-cyan)" />
                                <span>Entire Service History</span>
                              </button>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                                  onClick={() => handleOpenSingleQr(unit, group.machines)}
                                >
                                  <QrCode size={13} />
                                  <span>QR Tag</span>
                                </button>

                                {onOpenBreakdown && (
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${unit.status === 'BREAKDOWN' ? 'btn-danger' : 'btn-primary'}`}
                                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                                    onClick={() => onOpenBreakdown(unit)}
                                  >
                                    <AlertTriangle size={13} />
                                    <span>Report Breakdown</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 2. FLAT INDIVIDUAL UNITS VIEW (EXPANDED CARDS) ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {displayedMachines.map((m) => {
            const mImage = getMachineImageUrl(m.image_url, m.name, m.model_number);

            return (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                }}
                onClick={() => handleOpenMachineDetails(m.id)}
              >
                {/* Top: Large Image with Badge Overlay */}
                <div
                  style={{
                    position: 'relative',
                    height: '160px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <img
                    src={mImage}
                    alt={m.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                    }}
                  >
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                      {highlightMatch(m.machine_code, search)}
                    </span>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                    }}
                  >
                    {getStatusBadge(m.status)}
                  </div>
                </div>

                {/* Identity & Specs */}
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', margin: '0 0 6px 0' }}>
                    {highlightMatch(m.name, search)}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <div>Model: <strong style={{ color: 'var(--text-primary)' }}>{m.model_number}</strong></div>
                    <div>Serial: <strong style={{ color: 'var(--text-primary)' }}>{m.serial_number}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}>Vendor: <strong style={{ color: 'var(--text-primary)' }}>{m.vendor?.name || 'OEM Direct'}</strong></div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <MapPin size={13} color="var(--accent-cyan)" />
                    <span>{m.block?.name || 'Block A'} &rsaquo; {m.floor?.name || 'Floor 1'} &rsaquo; <strong style={{ color: '#fff' }}>{m.line?.name || 'Main Line'}</strong></span>
                  </div>
                </div>

                {/* Quick Specs */}
                {m.specifications && Object.keys(m.specifications).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Object.entries(m.specifications).slice(0, 3).map(([k, v]) => {
                      if (!v || typeof v === 'object') return null;
                      return (
                        <span key={k} style={{ background: 'var(--bg-input)', padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {k.replace(/_/g, ' ')}: {String(v)}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                    onClick={() => handleOpenMachineDetails(m.id)}
                  >
                    <History size={14} color="var(--accent-cyan)" />
                    <span>Entire Service History</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenSingleQr(m)}
                    >
                      <QrCode size={14} />
                      <span>QR Tag</span>
                    </button>

                    {onOpenBreakdown && (
                      <button
                        type="button"
                        className={`btn btn-sm ${m.status === 'BREAKDOWN' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => onOpenBreakdown(m)}
                      >
                        <AlertTriangle size={14} />
                        <span>Breakdown</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODALS ================= */}
      {/* 1. Register Machine Type Modal */}
      <MachineFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchMachines}
        machine={editingMachine}
      />

      {/* 2. QR Passport Tag Modal (Single / Batch Sheet) */}
      <QRLabelModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setSelectedMachine(null);
          setBatchQrMachines(null);
        }}
        machine={selectedMachine}
        machines={batchQrMachines}
      />

      {/* 3. Complete Machine Details & Authority Service History Modal */}
      <MachineDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedMachineIdForDetails(null);
        }}
        machineId={selectedMachineIdForDetails}
        onOpenBreakdown={onOpenBreakdown}
        onOpenQRTag={(m) => handleOpenSingleQr(m)}
      />

      {/* 4. Quick Add Quantity Modal */}
      {selectedGroupForQty && (
        <Modal
          isOpen={addQtyModalOpen}
          onClose={() => setAddQtyModalOpen(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={20} color="var(--accent-emerald)" />
              <span>Add Quantity to {selectedGroupForQty.name}</span>
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAddQtyModalOpen(false)}
                disabled={qtySubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddQuantitySubmit}
                disabled={qtySubmitting}
              >
                {qtySubmitting ? 'Provisioning...' : `Add ${qtyToAdd} Unit${qtyToAdd > 1 ? 's' : ''} & Generate Separate QRs`}
              </button>
            </div>
          }
        >
          <form onSubmit={handleAddQuantitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Machine Model:</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginTop: '2px' }}>
                {selectedGroupForQty.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                Model Number: {selectedGroupForQty.model_number} &bull; Currently Deployed: {selectedGroupForQty.total_quantity} units
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantity of Units to Add *</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>+{qtyToAdd} Physical Unit{qtyToAdd > 1 ? 's' : ''}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontWeight: 800 }}
                  onClick={() => setQtyToAdd((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="form-input"
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.05rem' }}
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontWeight: 800 }}
                  onClick={() => setQtyToAdd((prev) => Math.min(50, prev + 1))}
                >
                  +
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {[1, 2, 3, 5, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={`btn btn-sm ${qtyToAdd === q ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    onClick={() => setQtyToAdd(q)}
                  >
                    +{q} {q === 1 ? 'Unit' : 'Units'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Station Production Line Placement</label>
              <select
                className="form-select"
                value={qtyTargetLineId}
                onChange={(e) => setQtyTargetLineId(e.target.value)}
              >
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.line_code} - {l.name} ({l.floor?.name || 'Floor 1'})
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              ⚡ <strong>Separate Unique QR Passcodes</strong> will be immediately generated for each of the {qtyToAdd} newly added unit(s), with auto-incremented unit codes.
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
