import React, { useState, useEffect } from 'react';
import { Api } from '../../api/client';
import { Block, Floor, Line, RoleMaster, InventoryCategoryMaster, WarehouseStorageZoneMaster } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Layers,
  Shield,
  Building,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Cpu,
  Users,
  Info,
  ChevronRight,
  Sparkles,
  Zap,
  Boxes,
  Package,
  Tag,
  DollarSign,
  Warehouse,
  Grid,
} from 'lucide-react';

type MasterCategory = 'roles' | 'blocks' | 'floors' | 'lines' | 'inventory_categories' | 'storage_zones';

export const MasterManagement: React.FC = () => {
  const toast = useToast();
  const [activeMaster, setActiveMaster] = useState<MasterCategory>('roles');
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Data states
  const [roles, setRoles] = useState<RoleMaster[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryMaster[]>([]);
  const [storageZones, setStorageZones] = useState<WarehouseStorageZoneMaster[]>([]);

  // Modal States
  const [blockModalOpen, setBlockModalOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [blockName, setBlockName] = useState<string>('');
  const [blockCode, setBlockCode] = useState<string>('');
  const [blockDesc, setBlockDesc] = useState<string>('');

  const [floorModalOpen, setFloorModalOpen] = useState<boolean>(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorBlockId, setFloorBlockId] = useState<number>(1);
  const [floorName, setFloorName] = useState<string>('');
  const [floorNumber, setFloorNumber] = useState<number>(1);

  const [lineModalOpen, setLineModalOpen] = useState<boolean>(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [lineFloorId, setLineFloorId] = useState<number>(1);
  const [lineName, setLineName] = useState<string>('');
  const [lineCode, setLineCode] = useState<string>('');

  // Inventory Category Modal States
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategoryMaster | null>(null);
  const [categoryCode, setCategoryCode] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryDesc, setCategoryDesc] = useState<string>('');
  const [storageZone, setStorageZone] = useState<string>('Zone A (Small Fast-Moving Consumables)');
  const [categoryColor, setCategoryColor] = useState<string>('#3b82f6');
  const [categoryIsActive, setCategoryIsActive] = useState<boolean>(true);

  // Warehouse Storage Zone Modal States
  const [zoneModalOpen, setZoneModalOpen] = useState<boolean>(false);
  const [editingZone, setEditingZone] = useState<WarehouseStorageZoneMaster | null>(null);
  const [zoneCode, setZoneCode] = useState<string>('');
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneLocationType, setZoneLocationType] = useState<string>('RACK');
  const [zoneAisleBay, setZoneAisleBay] = useState<string>('');
  const [zoneCapacityBins, setZoneCapacityBins] = useState<number>(20);
  const [zoneDesc, setZoneDesc] = useState<string>('');
  const [zoneColor, setZoneColor] = useState<string>('#3b82f6');
  const [zoneIsActive, setZoneIsActive] = useState<boolean>(true);

  // Role Modal States
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleMaster | null>(null);
  const [roleKey, setRoleKey] = useState<string>('');
  const [roleName, setRoleName] = useState<string>('');
  const [roleCategory, setRoleCategory] = useState<string>('Operations');
  const [roleScope, setRoleScope] = useState<string>('Plant Wide Scope');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [roleColor, setRoleColor] = useState<string>('#6366f1');
  const [roleBadge, setRoleBadge] = useState<string>('Custom Role');
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({
    can_manage_vendors: false,
    can_edit_machines: false,
    can_assign_mechanics: false,
    can_approve_diagnostics: false,
    can_dispatch_spares: false,
    can_adjust_inventory_stock: false,
    can_view_analytics: false,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load All Master Data
  const loadAllMasters = async () => {
    setLoading(true);
    try {
      const [rolesRes, blocksRes, floorsRes, linesRes, categoriesRes, zonesRes] = await Promise.all([
        Api.listMasterRoles(),
        Api.listMasterBlocks(),
        Api.listMasterFloors(),
        Api.listMasterLines(),
        Api.listInventoryCategories(),
        Api.listWarehouseStorageZones(),
      ]);

      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (blocksRes.success && blocksRes.data) {
        setBlocks(blocksRes.data);
        if (blocksRes.data.length > 0) setFloorBlockId(blocksRes.data[0].id);
      }
      if (floorsRes.success && floorsRes.data) {
        setFloors(floorsRes.data);
        if (floorsRes.data.length > 0) setLineFloorId(floorsRes.data[0].id);
      }
      if (linesRes.success && linesRes.data) setLines(linesRes.data);
      if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
      if (zonesRes.success && zonesRes.data) setStorageZones(zonesRes.data);
    } catch (err: any) {
      toast.error('Failed to load master table data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMasters();
  }, []);

  // Role Handlers
  const handleOpenRoleModal = (role?: RoleMaster) => {
    if (role) {
      setEditingRole(role);
      setRoleKey(role.role);
      setRoleName(role.name);
      setRoleCategory(role.category || 'Operations');
      setRoleScope(role.scope || 'Plant Wide');
      setRoleDescription(role.description || '');
      setRoleColor(role.color || '#6366f1');
      setRoleBadge(role.badge || 'Role');
      setRolePermissions({
        can_manage_vendors: Boolean(role.permissions?.can_manage_vendors || role.permissions?.['Manage OEM Vendors']),
        can_edit_machines: Boolean(role.permissions?.can_edit_machines || role.permissions?.['Provision Machinery & QR']),
        can_assign_mechanics: Boolean(role.permissions?.can_assign_mechanics || role.permissions?.['Assign Line Mechanics']),
        can_approve_diagnostics: Boolean(role.permissions?.can_approve_diagnostics || role.permissions?.['Validate BOM & Sign-off']),
        can_dispatch_spares: Boolean(role.permissions?.can_dispatch_spares || role.permissions?.['Dispatch Central Spares']),
        can_adjust_inventory_stock: Boolean(role.permissions?.can_adjust_inventory_stock || role.permissions?.['Adjust Inventory & Stock']),
        can_view_analytics: Boolean(role.permissions?.can_view_analytics || role.permissions?.['Access Executive Analytics']),
      });
    } else {
      setEditingRole(null);
      setRoleKey('');
      setRoleName('');
      setRoleCategory('Quality Assurance');
      setRoleScope('Floor / Line Scope');
      setRoleDescription('');
      setRoleColor('#ec4899');
      setRoleBadge('Specialist');
      setRolePermissions({
        can_manage_vendors: false,
        can_edit_machines: true,
        can_assign_mechanics: false,
        can_approve_diagnostics: false,
        can_dispatch_spares: false,
        can_adjust_inventory_stock: false,
        can_view_analytics: true,
      });
    }
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || (!editingRole && !roleKey)) {
      toast.error('Role name and role code identifier are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingRole && (editingRole as any).id) {
        await Api.updateMasterRole((editingRole as any).id, {
          name: roleName,
          category: roleCategory,
          description: roleDescription,
          scope: roleScope,
          color: roleColor,
          badge: roleBadge,
          permissions: rolePermissions,
        });
        toast.success(`Role profile "${roleName}" updated successfully.`);
      } else {
        await Api.createMasterRole({
          role_key: roleKey.toLowerCase().replace(/\s+/g, '_'),
          name: roleName,
          category: roleCategory,
          description: roleDescription,
          scope: roleScope,
          color: roleColor,
          badge: roleBadge,
          permissions: rolePermissions,
        });
        toast.success(`New Role profile "${roleName}" registered successfully.`);
      }
      setRoleModalOpen(false);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleMaster) => {
    if ((role as any).is_system) {
      toast.error('Standard system roles cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete custom role "${role.name}"?`)) return;
    try {
      await Api.deleteMasterRole((role as any).id);
      toast.success(`Role "${role.name}" deleted.`);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete role with assigned crew.');
    }
  };

  // Block Handlers
  const handleOpenBlockModal = (block?: Block) => {
    if (block) {
      setEditingBlock(block);
      setBlockName(block.name);
      setBlockCode(block.code);
      setBlockDesc(block.description || '');
    } else {
      setEditingBlock(null);
      setBlockName('');
      setBlockCode('');
      setBlockDesc('');
    }
    setBlockModalOpen(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName || !blockCode) {
      toast.error('Block name and code are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingBlock) {
        await Api.updateMasterBlock(editingBlock.id, {
          name: blockName,
          code: blockCode,
          description: blockDesc,
        });
        toast.success(`Block "${blockName}" updated successfully.`);
      } else {
        await Api.createMasterBlock({
          name: blockName,
          code: blockCode,
          description: blockDesc,
        });
        toast.success(`Block "${blockName}" created successfully.`);
      }
      setBlockModalOpen(false);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save block.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (block: Block) => {
    if (!window.confirm(`Are you sure you want to delete Block "${block.name}"?`)) return;
    try {
      await Api.deleteMasterBlock(block.id);
      toast.success(`Block "${block.name}" deleted.`);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete block with active dependencies.');
    }
  };

  // Floor Handlers
  const handleOpenFloorModal = (floor?: Floor) => {
    if (floor) {
      setEditingFloor(floor);
      setFloorBlockId(floor.block_id);
      setFloorName(floor.name);
      setFloorNumber(floor.floor_number);
    } else {
      setEditingFloor(null);
      setFloorBlockId(blocks[0]?.id || 1);
      setFloorName('');
      setFloorNumber((floors.length || 0) + 1);
    }
    setFloorModalOpen(true);
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorName) {
      toast.error('Floor name is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingFloor) {
        await Api.updateMasterFloor(editingFloor.id, {
          block_id: floorBlockId,
          name: floorName,
          floor_number: floorNumber,
        });
        toast.success(`Floor "${floorName}" updated successfully.`);
      } else {
        await Api.createMasterFloor({
          block_id: floorBlockId,
          name: floorName,
          floor_number: floorNumber,
        });
        toast.success(`Floor "${floorName}" created successfully.`);
      }
      setFloorModalOpen(false);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save floor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFloor = async (floor: Floor) => {
    if (!window.confirm(`Are you sure you want to delete Floor "${floor.name}"?`)) return;
    try {
      await Api.deleteMasterFloor(floor.id);
      toast.success(`Floor "${floor.name}" deleted.`);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete floor with active lines.');
    }
  };

  // Line Handlers
  const handleOpenLineModal = (line?: Line) => {
    if (line) {
      setEditingLine(line);
      setLineFloorId(line.floor_id);
      setLineName(line.name);
      setLineCode(line.line_code);
    } else {
      setEditingLine(null);
      setLineFloorId(floors[0]?.id || 1);
      setLineName('');
      setLineCode(`LINE-0${lines.length + 1}`);
    }
    setLineModalOpen(true);
  };

  const handleSaveLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineName || !lineCode) {
      toast.error('Line name and code are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingLine) {
        await Api.updateMasterLine(editingLine.id, {
          floor_id: lineFloorId,
          name: lineName,
          line_code: lineCode,
        });
        toast.success(`Line "${lineName}" updated successfully.`);
      } else {
        await Api.createMasterLine({
          floor_id: lineFloorId,
          name: lineName,
          line_code: lineCode,
        });
        toast.success(`Line "${lineName}" created successfully.`);
      }
      setLineModalOpen(false);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save line.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLine = async (line: Line) => {
    if (!window.confirm(`Are you sure you want to delete Line "${line.name}"?`)) return;
    try {
      await Api.deleteMasterLine(line.id);
      toast.success(`Line "${line.name}" deleted.`);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete line with active machines.');
    }
  };

  // Inventory Category Handlers
  const handleOpenCategoryModal = (cat?: InventoryCategoryMaster) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryCode(cat.category_code);
      setCategoryName(cat.name);
      setCategoryDesc(cat.description || '');
      setStorageZone(cat.storage_zone || 'Zone A (Fast-Moving Consumables)');
      setCategoryColor(cat.color || '#3b82f6');
      setCategoryIsActive(cat.is_active);
    } else {
      setEditingCategory(null);
      setCategoryCode(`CAT-${Math.floor(100 + Math.random() * 900)}`);
      setCategoryName('');
      setCategoryDesc('');
      setStorageZone('Zone A (Fast-Moving Consumables)');
      setCategoryColor('#3b82f6');
      setCategoryIsActive(true);
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !categoryCode.trim()) {
      toast.error('Please enter both Category Name and Category Code.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await Api.updateInventoryCategory(editingCategory.id, {
          category_code: categoryCode.trim().toUpperCase(),
          name: categoryName.trim(),
          description: categoryDesc.trim(),
          storage_zone: storageZone.trim(),
          color: categoryColor,
          is_active: categoryIsActive,
        });
        toast.success(`Inventory Category "${categoryName}" updated successfully.`);
      } else {
        await Api.createInventoryCategory({
          category_code: categoryCode.trim().toUpperCase(),
          name: categoryName.trim(),
          description: categoryDesc.trim(),
          storage_zone: storageZone.trim(),
          color: categoryColor,
          is_active: categoryIsActive,
        });
        toast.success(`Inventory Category "${categoryName}" created successfully.`);
      }
      setCategoryModalOpen(false);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: InventoryCategoryMaster) => {
    if ((cat.parts_count || 0) > 0) {
      toast.error(`Cannot delete category "${cat.name}". It is currently assigned to ${cat.parts_count} spare parts in inventory. Reassign those parts first.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Category "${cat.name}" (${cat.category_code})?`)) return;
    try {
      await Api.deleteInventoryCategory(cat.id);
      toast.success(`Category "${cat.name}" deleted.`);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category.');
    }
  };

  // Warehouse Storage Zone Handlers
  const handleOpenZoneModal = (zone?: WarehouseStorageZoneMaster) => {
    if (zone) {
      setEditingZone(zone);
      setZoneCode(zone.zone_code);
      setZoneName(zone.name);
      setZoneLocationType(zone.location_type || 'RACK');
      setZoneAisleBay(zone.aisle_bay || '');
      setZoneCapacityBins(zone.capacity_bins || 20);
      setZoneDesc(zone.description || '');
      setZoneColor(zone.color || '#3b82f6');
      setZoneIsActive(zone.is_active);
    } else {
      setEditingZone(null);
      setZoneCode(`ZONE-${String.fromCharCode(65 + (storageZones.length % 26))}`);
      setZoneName('');
      setZoneLocationType('RACK');
      setZoneAisleBay('');
      setZoneCapacityBins(20);
      setZoneDesc('');
      setZoneColor('#3b82f6');
      setZoneIsActive(true);
    }
    setZoneModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim() || !zoneCode.trim()) {
      toast.error('Please enter both Zone Name and Zone Code.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingZone) {
        await Api.updateWarehouseStorageZone(editingZone.id, {
          zone_code: zoneCode.trim().toUpperCase(),
          name: zoneName.trim(),
          location_type: zoneLocationType,
          aisle_bay: zoneAisleBay.trim(),
          capacity_bins: Number(zoneCapacityBins),
          description: zoneDesc.trim(),
          color: zoneColor,
          is_active: zoneIsActive,
        });
        toast.success(`Warehouse Storage Zone "${zoneName}" updated successfully.`);
      } else {
        await Api.createWarehouseStorageZone({
          zone_code: zoneCode.trim().toUpperCase(),
          name: zoneName.trim(),
          location_type: zoneLocationType,
          aisle_bay: zoneAisleBay.trim(),
          capacity_bins: Number(zoneCapacityBins),
          description: zoneDesc.trim(),
          color: zoneColor,
          is_active: zoneIsActive,
        });
        toast.success(`Warehouse Storage Zone "${zoneName}" created successfully.`);
      }
      setZoneModalOpen(false);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save storage zone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteZone = async (zone: WarehouseStorageZoneMaster) => {
    if ((zone.categories_count || 0) > 0) {
      toast.error(`Cannot delete zone "${zone.name}". It is assigned to ${zone.categories_count} inventory category.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Storage Zone "${zone.name}" (${zone.zone_code})?`)) return;
    try {
      await Api.deleteWarehouseStorageZone(zone.id);
      toast.success(`Storage Zone "${zone.name}" deleted.`);
      loadAllMasters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete storage zone.');
    }
  };

  // Filtered lists
  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBlocks = blocks.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredFloors = floors.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.block?.name && f.block.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredLines = lines.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.line_code.toLowerCase().includes(search.toLowerCase()) ||
      (l.floor?.name && l.floor.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.storage_zone && c.storage_zone.toLowerCase().includes(search.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredZones = storageZones.filter(
    (z) =>
      z.name.toLowerCase().includes(search.toLowerCase()) ||
      z.zone_code.toLowerCase().includes(search.toLowerCase()) ||
      (z.aisle_bay && z.aisle_bay.toLowerCase().includes(search.toLowerCase())) ||
      (z.location_type && z.location_type.toLowerCase().includes(search.toLowerCase())) ||
      (z.description && z.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="section-container">
      {/* Header Banner */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Layers size={24} color="var(--primary)" />
            <span>Master Data Management</span>
          </h2>
          <p className="section-description">
            Centralized enterprise master registries for User Roles, Manufacturing Blocks, Factory Floors, Production Lines, Inventory Categories, and Warehouse Storage Zones.
          </p>
        </div>

        {activeMaster === 'roles' && (
          <button className="btn btn-primary" onClick={() => handleOpenRoleModal()}>
            <Plus size={16} />
            <span>Add Role</span>
          </button>
        )}
        {activeMaster === 'blocks' && (
          <button className="btn btn-primary" onClick={() => handleOpenBlockModal()}>
            <Plus size={16} />
            <span>Add Block</span>
          </button>
        )}
        {activeMaster === 'floors' && (
          <button className="btn btn-primary" onClick={() => handleOpenFloorModal()}>
            <Plus size={16} />
            <span>Add Floor</span>
          </button>
        )}
        {activeMaster === 'lines' && (
          <button className="btn btn-primary" onClick={() => handleOpenLineModal()}>
            <Plus size={16} />
            <span>Add Line</span>
          </button>
        )}
        {activeMaster === 'inventory_categories' && (
          <button className="btn btn-primary" onClick={() => handleOpenCategoryModal()}>
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        )}
        {activeMaster === 'storage_zones' && (
          <button className="btn btn-primary" onClick={() => handleOpenZoneModal()}>
            <Plus size={16} />
            <span>Add Storage Zone</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: activeMaster === 'roles' ? '4px solid #818cf8' : undefined }}
          onClick={() => setActiveMaster('roles')}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{roles.length}</div>
            <div className="stat-label">Role Profiles Master</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: activeMaster === 'blocks' ? '4px solid #38bdf8' : undefined }}
          onClick={() => setActiveMaster('blocks')}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <Building size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{blocks.length}</div>
            <div className="stat-label">Factory Blocks Master</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: activeMaster === 'floors' ? '4px solid #34d399' : undefined }}
          onClick={() => setActiveMaster('floors')}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{floors.length}</div>
            <div className="stat-label">Plant Floors Master</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: activeMaster === 'lines' ? '4px solid #fbbf24' : undefined }}
          onClick={() => setActiveMaster('lines')}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{lines.length}</div>
            <div className="stat-label">Production Lines Master</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: activeMaster === 'inventory_categories' ? '4px solid #ec4899' : undefined }}
          onClick={() => setActiveMaster('inventory_categories')}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <Boxes size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Inventory Categories</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: activeMaster === 'storage_zones' ? '4px solid #06b6d4' : undefined }}
          onClick={() => setActiveMaster('storage_zones')}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <Warehouse size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{storageZones.length}</div>
            <div className="stat-label">Warehouse Storage Zones</div>
          </div>
        </div>
      </div>

      {/* Master Selection Tabs */}
      <div className="tab-pill-container" style={{ margin: '0.5rem 0' }}>
        <button
          className={`tab-pill ${activeMaster === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveMaster('roles')}
        >
          <Shield size={16} />
          <span>Role Master ({roles.length})</span>
        </button>

        <button
          className={`tab-pill ${activeMaster === 'blocks' ? 'active' : ''}`}
          onClick={() => setActiveMaster('blocks')}
        >
          <Building size={16} />
          <span>Block Master ({blocks.length})</span>
        </button>

        <button
          className={`tab-pill ${activeMaster === 'floors' ? 'active' : ''}`}
          onClick={() => setActiveMaster('floors')}
        >
          <Layers size={16} />
          <span>Floor Master ({floors.length})</span>
        </button>

        <button
          className={`tab-pill ${activeMaster === 'lines' ? 'active' : ''}`}
          onClick={() => setActiveMaster('lines')}
        >
          <Zap size={16} />
          <span>Line Master ({lines.length})</span>
        </button>

        <button
          className={`tab-pill ${activeMaster === 'inventory_categories' ? 'active' : ''}`}
          onClick={() => setActiveMaster('inventory_categories')}
        >
          <Boxes size={16} />
          <span>Inventory Categories ({categories.length})</span>
        </button>

        <button
          className={`tab-pill ${activeMaster === 'storage_zones' ? 'active' : ''}`}
          onClick={() => setActiveMaster('storage_zones')}
        >
          <Warehouse size={16} />
          <span>Storage Zones ({storageZones.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          className="form-input"
          style={{ border: 'none', background: 'transparent', padding: '6px 0' }}
          placeholder={`Search in ${activeMaster.toUpperCase()} master table...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ROLE MASTER TABLE */}
      {/* ========================================================================= */}
      {activeMaster === 'roles' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Enterprise Role Definitions & RBAC Governance
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Configured organizational persona roles with granular permission capabilities and operation scopes.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenRoleModal()}>
              <Plus size={15} />
              <span>Add Role</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role Code & Title</th>
                  <th>Category</th>
                  <th>Operational Scope</th>
                  <th>Assigned Crew</th>
                  <th>Key Permissions Matrix</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((r) => (
                  <tr key={r.role}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: r.color || '#6366f1',
                            boxShadow: `0 0 8px ${r.color || '#6366f1'}88`,
                          }}
                        ></span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {r.name}
                            {(r as any).is_system && (
                              <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                System
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {r.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{r.category}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{r.scope}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {r.description || 'No description provided'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        <Users size={12} style={{ marginRight: '4px' }} />
                        {r.crew_count || 0} Members
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '380px' }}>
                        {Object.entries(r.permissions).map(([perm, granted]) => (
                          <span
                            key={perm}
                            className={`badge ${granted ? 'badge-emerald' : 'badge-secondary'}`}
                            style={{ fontSize: '0.7rem', opacity: granted ? 1 : 0.55 }}
                          >
                            {granted ? <CheckCircle size={10} style={{ marginRight: '3px' }} /> : <XCircle size={10} style={{ marginRight: '3px' }} />}
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-ghost btn-sm"
                          title="Edit Role Profile"
                          onClick={() => handleOpenRoleModal(r)}
                        >
                          <Edit2 size={15} color="var(--primary-light)" />
                        </button>
                        {!(r as any).is_system && (
                          <button
                            className="btn-ghost btn-sm"
                            title="Delete Custom Role"
                            onClick={() => handleDeleteRole(r)}
                          >
                            <Trash2 size={15} color="var(--accent-rose)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BLOCK MASTER TABLE */}
      {/* ========================================================================= */}
      {activeMaster === 'blocks' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Manufacturing Building Blocks Master
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Physical facility plant buildings housing tanneries, cutting suites, and production floors.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenBlockModal()}>
              <Plus size={15} />
              <span>New Block</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Block Code</th>
                  <th>Block Facility Name</th>
                  <th>Description</th>
                  <th>Floors</th>
                  <th>Machines</th>
                  <th>Assigned Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlocks.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="ticket-id-badge">{b.code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {b.description || 'Primary manufacturing zone.'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-cyan">{b.floors_count ?? 0} Floors</span>
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        <Cpu size={12} style={{ marginRight: '4px' }} />
                        {b.machines_count ?? 0} Units
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{b.users_count ?? 0} Staff</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-ghost btn-sm"
                          title="Edit Block"
                          onClick={() => handleOpenBlockModal(b)}
                        >
                          <Edit2 size={15} color="var(--primary-light)" />
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          title="Delete Block"
                          onClick={() => handleDeleteBlock(b)}
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FLOOR MASTER TABLE */}
      {/* ========================================================================= */}
      {activeMaster === 'floors' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Factory Floors Master
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Tiered industrial levels allocated to specialized processing phases.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenFloorModal()}>
              <Plus size={15} />
              <span>New Floor</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Level / No.</th>
                  <th>Floor Name</th>
                  <th>Parent Block</th>
                  <th>Lines Count</th>
                  <th>Installed Machinery</th>
                  <th>Personnel</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFloors.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className="badge badge-primary">Level {f.floor_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-cyan">{f.block?.name || `Block #${f.block_id}`}</span>
                    </td>
                    <td>
                      <span className="badge badge-amber">{f.lines_count ?? 0} Lines</span>
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        <Cpu size={12} style={{ marginRight: '4px' }} />
                        {f.machines_count ?? 0} Machines
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{f.users_count ?? 0} Staff</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-ghost btn-sm"
                          title="Edit Floor"
                          onClick={() => handleOpenFloorModal(f)}
                        >
                          <Edit2 size={15} color="var(--primary-light)" />
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          title="Delete Floor"
                          onClick={() => handleDeleteFloor(f)}
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LINE MASTER TABLE */}
      {/* ========================================================================= */}
      {activeMaster === 'lines' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Production Lines Master
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Dedicated production conveyor and assembly lines where breakdown QR tickets originate.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenLineModal()}>
              <Plus size={15} />
              <span>New Line</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line Code</th>
                  <th>Production Line Name</th>
                  <th>Parent Floor</th>
                  <th>Parent Block</th>
                  <th>Active Machines</th>
                  <th>Total Repair History</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="ticket-id-badge">{l.line_code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{l.floor?.name || `Floor #${l.floor_id}`}</span>
                    </td>
                    <td>
                      <span className="badge badge-cyan">{l.floor?.block?.name || 'Plant Block'}</span>
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        <Cpu size={12} style={{ marginRight: '4px' }} />
                        {l.machines_count ?? 0} Units
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{l.repair_logs_count ?? 0} Tickets</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-ghost btn-sm"
                          title="Edit Line"
                          onClick={() => handleOpenLineModal(l)}
                        >
                          <Edit2 size={15} color="var(--primary-light)" />
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          title="Delete Line"
                          onClick={() => handleDeleteLine(l)}
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WAREHOUSE & INVENTORY CATEGORIES MASTER TABLE */}
      {/* ========================================================================= */}
      {activeMaster === 'inventory_categories' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Warehouse & Inventory Categories Master
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Classification schema for spare parts, warehouse storage zoning, stock thresholds, and live inventory valuations.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenCategoryModal()}>
              <Plus size={15} />
              <span>New Category</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category Code</th>
                  <th>Category Name</th>
                  <th>Warehouse Storage Zone</th>
                  <th>Description / Scope</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No inventory categories found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const catColor = cat.color || '#3b82f6';
                    return (
                      <tr key={cat.id}>
                        <td>
                          <span
                            className="ticket-id-badge"
                            style={{
                              backgroundColor: `${catColor}15`,
                              color: catColor,
                              borderColor: `${catColor}40`,
                              fontWeight: 700,
                            }}
                          >
                            {cat.category_code}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: catColor,
                                display: 'inline-block',
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {cat.storage_zone || 'General Bay'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '320px', display: 'inline-block' }}>
                            {cat.description || '—'}
                          </span>
                        </td>
                        <td>
                          {cat.is_active ? (
                            <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-ghost btn-sm"
                              title="Edit Category"
                              onClick={() => handleOpenCategoryModal(cat)}
                            >
                              <Edit2 size={15} color="var(--primary-light)" />
                            </button>
                            <button
                              className="btn-ghost btn-sm"
                              title="Delete Category"
                              onClick={() => handleDeleteCategory(cat)}
                            >
                              <Trash2 size={15} color="var(--accent-rose)" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WAREHOUSE STORAGE ZONES MASTER TABLE */}
      {/* ========================================================================= */}
      {activeMaster === 'storage_zones' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Warehouse Storage Zones Master
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Physical facility bay layout, rack types, tooling security cages, and storage bin capacity management.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenZoneModal()}>
              <Plus size={15} />
              <span>New Storage Zone</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone Code</th>
                  <th>Storage Zone Name</th>
                  <th>Location Type</th>
                  <th>Aisle & Bay Position</th>
                  <th>Max Bin Capacity</th>
                  <th>Description / Scope</th>
                  <th>Assigned Categories</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No warehouse storage zones found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((z) => {
                    const zoneCol = z.color || '#3b82f6';
                    return (
                      <tr key={z.id}>
                        <td>
                          <span
                            className="ticket-id-badge"
                            style={{
                              backgroundColor: `${zoneCol}15`,
                              color: zoneCol,
                              borderColor: `${zoneCol}40`,
                              fontWeight: 700,
                            }}
                          >
                            {z.zone_code}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: zoneCol,
                                display: 'inline-block',
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{z.name}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              z.location_type === 'TOOL_CAGE'
                                ? 'badge-rose'
                                : z.location_type === 'HEAVY_BAY'
                                ? 'badge-cyan'
                                : z.location_type === 'SHELF_CABINET'
                                ? 'badge-primary'
                                : z.location_type === 'PALLET_DECK'
                                ? 'badge-amber'
                                : 'badge-emerald'
                            }`}
                          >
                            {z.location_type?.replace('_', ' ') || 'RACK'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {z.aisle_bay || 'Main Bay'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Grid size={12} />
                            {z.capacity_bins} Bins Max
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '280px', display: 'inline-block' }}>
                            {z.description || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Boxes size={12} />
                            {z.categories_count ?? 0} Categories
                          </span>
                        </td>
                        <td>
                          {z.is_active ? (
                            <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-ghost btn-sm"
                              title="Edit Storage Zone"
                              onClick={() => handleOpenZoneModal(z)}
                            >
                              <Edit2 size={15} color="var(--primary-light)" />
                            </button>
                            <button
                              className="btn-ghost btn-sm"
                              title="Delete Storage Zone"
                              onClick={() => handleDeleteZone(z)}
                            >
                              <Trash2 size={15} color="var(--accent-rose)" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ROLE ADD / EDIT FORM */}
      {/* ========================================================================= */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="var(--primary)" />
            <span>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Enterprise Role'}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveRole} disabled={submitting}>
              {submitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Role Display Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Quality Assurance Lead"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  if (!editingRole && !roleKey) {
                    setRoleKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                  }
                }}
                required
              />
            </div>

            <div>
              <label className="form-label">Role Code Identifier *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. quality_assurance_lead"
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                disabled={Boolean(editingRole)}
                required
              />
              {editingRole && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Role identifier key cannot be modified after registration.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
                required
              >
                <option value="Executive">Executive</option>
                <option value="Plant Management">Plant Management</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Procurement">Procurement</option>
                <option value="Inventory & Warehouse">Inventory & Warehouse</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="form-label">Operational Scope *</label>
              <select
                className="form-select"
                value={roleScope}
                onChange={(e) => setRoleScope(e.target.value)}
                required
              >
                <option value="Plant Wide Governance">Plant Wide Governance</option>
                <option value="Factory Building Scope">Factory Building Scope</option>
                <option value="Floor Level Operations">Floor Level Operations</option>
                <option value="Assembly Line Supervision">Assembly Line Supervision</option>
                <option value="Station Breakdown Response">Station Breakdown Response</option>
                <option value="Central Spares Inventory">Central Spares Inventory</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Badge Label</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Lead, Officer, Field"
                value={roleBadge}
                onChange={(e) => setRoleBadge(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Theme Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={roleColor}
                  onChange={(e) => setRoleColor(e.target.value)}
                  style={{ width: '38px', height: '38px', padding: '0', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setRoleColor(color)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: roleColor === color ? '2px solid var(--text-primary)' : '1px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Description / Functional Responsibility</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Describe primary responsibilities and operational expectations for this role..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>

          {/* Granular Permissions Matrix */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Shield size={16} color="var(--primary)" />
              <span>Granular Permissions Matrix</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {[
                { key: 'can_manage_vendors', label: 'Manage OEM Vendors & Suppliers', desc: 'Register vendor profiles, SLA monitoring, spares catalog link' },
                { key: 'can_edit_machines', label: 'Provision Machinery & QR Stations', desc: 'Create, update machinery specifications and bind QR codes' },
                { key: 'can_assign_mechanics', label: 'Dispatch & Assign Line Mechanics', desc: 'Assign available crew members to open breakdown tickets' },
                { key: 'can_approve_diagnostics', label: 'Validate BOM Diagnostics & Sign-off', desc: 'Approve spare parts request and technical sign-offs' },
                { key: 'can_dispatch_spares', label: 'Dispatch Central Spares to Stations', desc: 'Authorize and release spare parts from warehouse storage' },
                { key: 'can_adjust_inventory_stock', label: 'Adjust Inventory & Stock Thresholds', desc: 'Modify stock quantity counts, reorder triggers and costs' },
                { key: 'can_view_analytics', label: 'Access Executive Analytics & Reports', desc: 'View enterprise MTTR, MTBF, downtime trends and KPIs' },
              ].map((perm) => (
                <label
                  key={perm.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: rolePermissions[perm.key] ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(rolePermissions[perm.key])}
                    onChange={(e) =>
                      setRolePermissions((prev) => ({
                        ...prev,
                        [perm.key]: e.target.checked,
                      }))
                    }
                    style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {perm.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{perm.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: BLOCK ADD / EDIT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} color="var(--primary)" />
            <span>{editingBlock ? 'Edit Manufacturing Block' : 'Create Manufacturing Block'}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setBlockModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveBlock} disabled={submitting}>
              {submitting ? 'Saving...' : editingBlock ? 'Update Block' : 'Create Block'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveBlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Block Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Beta Cutting & Fabrication Complex"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Block Code * (Unique Identifier)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. BLK-BETA"
              value={blockCode}
              onChange={(e) => setBlockCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <label className="form-label">Description / Scope</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe facility functions, units housed, or plant area..."
              value={blockDesc}
              onChange={(e) => setBlockDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: FLOOR ADD / EDIT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={floorModalOpen}
        onClose={() => setFloorModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--primary)" />
            <span>{editingFloor ? 'Edit Factory Floor' : 'Create Factory Floor'}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setFloorModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveFloor} disabled={submitting}>
              {submitting ? 'Saving...' : editingFloor ? 'Update Floor' : 'Create Floor'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveFloor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Parent Block *</label>
            <select
              className="form-select"
              value={floorBlockId}
              onChange={(e) => setFloorBlockId(Number(e.target.value))}
              required
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Floor Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Level 3: Automated CNC Finishing"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Floor Level Number *</label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={20}
              value={floorNumber}
              onChange={(e) => setFloorNumber(Number(e.target.value))}
              required
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: LINE ADD / EDIT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={lineModalOpen}
        onClose={() => setLineModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--primary)" />
            <span>{editingLine ? 'Edit Production Line' : 'Create Production Line'}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setLineModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveLine} disabled={submitting}>
              {submitting ? 'Saving...' : editingLine ? 'Update Line' : 'Create Line'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveLine} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Parent Floor *</label>
            <select
              className="form-select"
              value={lineFloorId}
              onChange={(e) => setLineFloorId(Number(e.target.value))}
              required
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Floor #{f.floor_number} - {f.block?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Line Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Leather Bag Finishing & Glazing Line 05"
              value={lineName}
              onChange={(e) => setLineName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Line Code *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. LINE-BAG-05"
              value={lineCode}
              onChange={(e) => setLineCode(e.target.value.toUpperCase())}
              required
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: INVENTORY CATEGORY ADD / EDIT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={20} color="var(--primary)" />
            <span>{editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Inventory Category'}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveCategory} disabled={submitting}>
              {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Hydraulic Valves & High-Pressure Actuators"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Category Code * (Unique Key)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CAT-HYD"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label className="form-label">Warehouse Storage Zone *</label>
              {storageZones.length > 0 ? (
                <select
                  className="form-select"
                  value={storageZone}
                  onChange={(e) => setStorageZone(e.target.value)}
                  required
                >
                  {storageZones.map((z) => (
                    <option key={z.id} value={`${z.zone_code} - ${z.name}`}>
                      {z.zone_code}: {z.name} ({z.aisle_bay || 'Main Bay'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Zone B (Heavy Hydraulics)"
                  value={storageZone}
                  onChange={(e) => setStorageZone(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Accent Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={categoryColor}
                onChange={(e) => setCategoryColor(e.target.value)}
                style={{ width: '38px', height: '38px', padding: '0', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setCategoryColor(col)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: col,
                      border: categoryColor === col ? '2px solid var(--text-primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Description & Scope</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe components belonging to this category, handling guidelines, or warehouse storage specs..."
              value={categoryDesc}
              onChange={(e) => setCategoryDesc(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={categoryIsActive}
                onChange={(e) => setCategoryIsActive(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Inventory Category
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Active categories appear in inventory part creation and filtration dropdowns.
                </div>
              </div>
            </label>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: WAREHOUSE STORAGE ZONE ADD / EDIT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={20} color="var(--primary)" />
            <span>{editingZone ? `Edit Storage Zone: ${editingZone.name}` : 'Create Warehouse Storage Zone'}</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setZoneModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveZone} disabled={submitting}>
              {submitting ? 'Saving...' : editingZone ? 'Update Storage Zone' : 'Create Storage Zone'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveZone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Storage Zone Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Zone A (Small Fast-Moving Consumables)"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Zone Code * (Unique Key)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ZONE-A"
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label className="form-label">Location / Storage Type *</label>
              <select
                className="form-select"
                value={zoneLocationType}
                onChange={(e) => setZoneLocationType(e.target.value)}
                required
              >
                <option value="RACK">RACK (Standard Floor Rack)</option>
                <option value="SHELF_CABINET">SHELF_CABINET (High-Density Multi-Drawer Cabinet)</option>
                <option value="HEAVY_BAY">HEAVY_BAY (Reinforced Heavy Hydraulic Floor Bay)</option>
                <option value="TOOL_CAGE">TOOL_CAGE (Secure Tooling & Knife Cage)</option>
                <option value="PALLET_DECK">PALLET_DECK (Heavy Steel Pallet Storage Deck)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Aisle & Bay Placement</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Aisle 01 / Cabinet Bays A1-A12"
                value={zoneAisleBay}
                onChange={(e) => setZoneAisleBay(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Max Bin Capacity</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={250}
                value={zoneCapacityBins}
                onChange={(e) => setZoneCapacityBins(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Accent Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={zoneColor}
                onChange={(e) => setZoneColor(e.target.value)}
                style={{ width: '38px', height: '38px', padding: '0', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setZoneColor(col)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: col,
                      border: zoneColor === col ? '2px solid var(--text-primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Description & Bay Specifications</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe storage rack dimensions, physical accessibility, equipment restrictions, or handling instructions..."
              value={zoneDesc}
              onChange={(e) => setZoneDesc(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={zoneIsActive}
                onChange={(e) => setZoneIsActive(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Storage Zone
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Active zones are available for assigning inventory categories and organizing warehouse bins.
                </div>
              </div>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
