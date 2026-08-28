import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Part } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
  Package,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Edit,
  Sliders,
} from 'lucide-react';

export const InventoryGrid: React.FC = () => {
  const toast = useToast();

  const [parts, setParts] = useState<Part[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modals
  const [restockModalOpen, setRestockModalOpen] = useState<boolean>(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [createPartModalOpen, setCreatePartModalOpen] = useState<boolean>(false);
  const [activePart, setActivePart] = useState<Part | null>(null);

  // Restock Form
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockRemarks, setRestockRemarks] = useState<string>('');

  // Adjust Form
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Create Part Form
  const [newPartNumber, setNewPartNumber] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Needles & Hooks');
  const [newStock, setNewStock] = useState<number>(20);
  const [newMinThreshold, setNewMinThreshold] = useState<number>(5);
  const [newUnitCost, setNewUnitCost] = useState<number>(15.0);
  const [newLocationBin, setNewLocationBin] = useState<string>('BIN-A01-01');

  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [partsRes, statsRes] = await Promise.all([
        Api.listParts({
          search: search || undefined,
          category: selectedCategory || undefined,
          low_stock: lowStockOnly || undefined,
        }),
        Api.getInventoryStats(),
      ]);

      if (partsRes.success && partsRes.data) {
        setParts(partsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      toast.error('Failed to load parts inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, lowStockOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePart) return;

    setSubmitting(true);
    try {
      await Api.restockPart({
        part_id: activePart.id,
        quantity: restockQty,
        remarks: restockRemarks,
      });

      toast.success(`Successfully restocked ${restockQty} units to ${activePart.location_bin}.`);
      setRestockModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Restock failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePart) return;

    setSubmitting(true);
    try {
      await Api.adjustStock({
        part_id: activePart.id,
        new_quantity: adjustQty,
        reason: adjustReason || 'Physical inventory reconciliation audit',
      });

      toast.success(`Inventory stock adjusted for ${activePart.name}.`);
      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNumber || !newName || !newLocationBin) {
      toast.error('Part number, name, and bin location are required.');
      return;
    }

    setSubmitting(true);
    try {
      await Api.createPart({
        part_number: newPartNumber,
        name: newName,
        category: newCategory,
        stock_quantity: newStock,
        min_threshold: newMinThreshold,
        unit_cost: newUnitCost,
        location_bin: newLocationBin,
      });

      toast.success(`Registered spare part ${newName} in ${newLocationBin}.`);
      setCreatePartModalOpen(false);
      setNewPartNumber('');
      setNewName('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add part.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Boxes size={24} color="var(--primary)" />
            <span>Central Parts Storage & Bin Inventory</span>
          </h2>
          <p className="section-description">
            Storage bin tracking, low-stock threshold triggers, restock logging, and inventory valuation for leather machinery parts.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreatePartModalOpen(true)}>
          <Plus size={16} />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* Inventory KPI Summary Cards */}
      {stats && (
        <div className="dashboard-stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
              <Boxes size={22} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_unique_parts}</div>
              <div className="stat-label">Unique Spare SKUs</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
              <Package size={22} />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {stats.total_stock_units}
              </div>
              <div className="stat-label">Total Units on Hand</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
              <AlertTriangle size={22} />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                {stats.low_stock_count}
              </div>
              <div className="stat-label">Low Stock Below Threshold</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
              <ArrowUpRight size={22} />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                ${Number(stats.total_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="stat-label">Total Inventory Valuation</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: '1 1 280px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by part name, SKU, or storage bin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '200px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Needles & Hooks">Needles & Hooks</option>
            <option value="Hydraulic Valves">Hydraulic Valves</option>
            <option value="Blades & Knives">Blades & Knives</option>
            <option value="Rollers & Guides">Rollers & Guides</option>
            <option value="Drive Belts">Drive Belts</option>
            <option value="Heating Elements">Heating Elements</option>
            <option value="Motors & Sensors">Motors & Sensors</option>
            <option value="Wear Plates">Wear Plates</option>
          </select>

          <label className="checkbox-card" style={{ padding: '8px 14px', margin: 0 }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-amber)' }}>
              Low Stock Only
            </span>
          </label>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
          <button type="button" className="btn btn-ghost" onClick={fetchInventory} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </form>
      </div>

      {/* Parts Table */}
      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Part Name & SKU</th>
              <th>Category</th>
              <th>Storage Bin</th>
              <th>Stock Status</th>
              <th>Min Threshold</th>
              <th>Unit Cost</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                  Loading spare parts catalog...
                </td>
              </tr>
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No parts found matching criteria.
                </td>
              </tr>
            ) : (
              parts.map((p) => {
                const isLow = p.stock_quantity <= p.min_threshold;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        SKU: {p.part_number}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{p.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{p.location_bin}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isLow ? 'var(--accent-rose)' : 'var(--text-primary)',
                          }}
                        >
                          {p.stock_quantity} units
                        </span>
                        {isLow && <span className="badge badge-rose">LOW STOCK</span>}
                      </div>
                    </td>
                    <td>{p.min_threshold} units</td>
                    <td>${Number(p.unit_cost).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setActivePart(p);
                            setRestockQty(10);
                            setRestockRemarks('');
                            setRestockModalOpen(true);
                          }}
                        >
                          <Plus size={14} />
                          <span>Restock</span>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setActivePart(p);
                            setAdjustQty(p.stock_quantity);
                            setAdjustReason('');
                            setAdjustModalOpen(true);
                          }}
                          title="Audit Stock Adjustment"
                        >
                          <Sliders size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--accent-emerald)" />
            <span>Restock Inventory: {activePart?.name}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRestockModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleRestockSubmit} disabled={submitting}>
              {submitting ? 'Restocking...' : 'Confirm Restock'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleRestockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Location: <strong>{activePart?.location_bin}</strong> | Current Stock: <strong>{activePart?.stock_quantity} units</strong>
          </div>

          <div>
            <label className="form-label">Units to Add *</label>
            <input
              type="number"
              className="form-input"
              min={1}
              value={restockQty}
              onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
              required
            />
          </div>

          <div>
            <label className="form-label">PO / Delivery Remarks</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PO-2026-881 from Dürkopp OEM shipment"
              value={restockRemarks}
              onChange={(e) => setRestockRemarks(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Adjust Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-amber)" />
            <span>Manual Stock Audit Adjustment: {activePart?.name}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAdjustSubmit} disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Audit Adjustment'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Current Recorded Balance: <strong>{activePart?.stock_quantity} units</strong> in Bin {activePart?.location_bin}
          </div>

          <div>
            <label className="form-label">Correct Counted Quantity *</label>
            <input
              type="number"
              className="form-input"
              min={0}
              value={adjustQty}
              onChange={(e) => setAdjustQty(Math.max(0, Number(e.target.value)))}
              required
            />
          </div>

          <div>
            <label className="form-label">Audit Reason / Justification *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Physical inventory cycle count variance"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Create Part Modal */}
      <Modal
        isOpen={createPartModalOpen}
        onClose={() => setCreatePartModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={20} color="var(--primary)" />
            <span>Add New Spare Part to Storage Catalog</span>
          </div>
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCreatePartModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreatePartSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Register Spare Part'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreatePartSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Part SKU / Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SCHMETZ-134-35-180"
                value={newPartNumber}
                onChange={(e) => setNewPartNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Part Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Diamond Point Leather Needle (180/24)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Needles & Hooks">Needles & Hooks</option>
                <option value="Hydraulic Valves">Hydraulic Valves</option>
                <option value="Blades & Knives">Blades & Knives</option>
                <option value="Rollers & Guides">Rollers & Guides</option>
                <option value="Drive Belts">Drive Belts</option>
                <option value="Heating Elements">Heating Elements</option>
                <option value="Motors & Sensors">Motors & Sensors</option>
                <option value="Wear Plates">Wear Plates</option>
              </select>
            </div>
            <div>
              <label className="form-label">Location Bin ID *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BIN-A02-05"
                value={newLocationBin}
                onChange={(e) => setNewLocationBin(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                className="form-input"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Min Threshold</label>
              <input
                type="number"
                className="form-input"
                min={0}
                value={newMinThreshold}
                onChange={(e) => setNewMinThreshold(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                min={0}
                value={newUnitCost}
                onChange={(e) => setNewUnitCost(Number(e.target.value))}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
