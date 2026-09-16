export type Role =
  | 'admin'
  | 'block_manager'
  | 'floor_manager'
  | 'line_supervisor'
  | 'mechanic'
  | 'tech_lead'
  | 'spare_head';

export type TicketStatus =
  | 'REPORTED'
  | 'DIAGNOSING'
  | 'PENDING_TECH_APPROVAL'
  | 'PENDING_SPARE_DISPATCH'
  | 'IN_REPAIR'
  | 'PENDING_SIGN_OFF'
  | 'OPERATIONAL'
  | 'CLOSED';

export type TicketType = 'ROUTINE_SERVICE' | 'BREAKDOWN_REPAIR';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MachineStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'BREAKDOWN' | 'DECOMMISSIONED';

export type SpareRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'DISPATCHED';

export type InventoryChangeType = 'DISPATCH' | 'RESTOCK' | 'ADJUSTMENT' | 'SCRAP';

export interface UserPermission {
  id: number;
  user_id: number;
  can_manage_vendors: boolean;
  can_edit_machines: boolean;
  can_assign_mechanics: boolean;
  can_approve_diagnostics: boolean;
  can_dispatch_spares: boolean;
  can_adjust_inventory_stock: boolean;
  can_view_analytics: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  block_id: number | null;
  floor_id: number | null;
  line_id: number | null;
  phone: string | null;
  status: 'active' | 'inactive';
  permission?: UserPermission;
  block?: Block;
  floor?: Floor;
  line?: Line;
  active_repairs_count?: number;
}

export interface Block {
  id: number;
  name: string;
  code: string;
  description?: string;
  floors_count?: number;
  machines_count?: number;
  users_count?: number;
  floors?: Floor[];
}

export interface Floor {
  id: number;
  block_id: number;
  name: string;
  floor_number: number;
  lines_count?: number;
  machines_count?: number;
  users_count?: number;
  block?: Block;
  lines?: Line[];
}

export interface Line {
  id: number;
  floor_id: number;
  name: string;
  line_code: string;
  machines_count?: number;
  users_count?: number;
  repair_logs_count?: number;
  floor?: Floor;
  machines?: Machine[];
}

export interface RoleMaster {
  role: Role;
  name: string;
  category: string;
  description: string;
  scope: string;
  color: string;
  badge: string;
  permissions: Record<string, boolean>;
  crew_count?: number;
}

export interface Vendor {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  machinery_categories: string[] | null;
  rating: number;
  machines_count?: number;
  machines?: Machine[];
}

export interface MachineSpecifications {
  motor_specs?: string;
  needle_type?: string;
  hydraulic_rating?: string;
  operating_voltage?: string;
  air_pressure_bar?: string;
  max_speed_rpm?: string;
  [key: string]: any;
}

export interface Machine {
  id: number;
  machine_code: string;
  name: string;
  model_number: string;
  serial_number: string;
  vendor_id: number | null;
  block_id: number | null;
  floor_id: number | null;
  line_id: number | null;
  qr_code_hash: string;
  specifications: MachineSpecifications | null;
  image_url: string | null;
  status: MachineStatus;
  installed_at: string | null;
  vendor?: Vendor;
  block?: Block;
  floor?: Floor;
  line?: Line;
  open_tickets_count?: number;
  repair_logs?: RepairLog[];
}

export interface ServiceCatalogItem {
  id: number;
  machine_category: string;
  title: string;
  description: string;
  estimated_duration_minutes: number;
  recommended_frequency_days: number;
  standard_procedures: string[];
}

export interface InventoryCategoryMaster {
  id: number;
  category_code: string;
  name: string;
  description: string | null;
  storage_zone: string | null;
  color: string | null;
  is_active: boolean;
  parts_count?: number;
  total_units?: number;
  total_value?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WarehouseStorageZoneMaster {
  id: number;
  zone_code: string;
  name: string;
  location_type: string;
  aisle_bay: string | null;
  capacity_bins: number;
  description: string | null;
  color: string | null;
  is_active: boolean;
  categories_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Part {
  id: number;
  part_number: string;
  name: string;
  category: string;
  stock_quantity: number;
  min_threshold: number;
  unit_cost: number;
  location_bin: string;
  compatible_machine_types: string[] | null;
  is_low_stock?: boolean;
}

export interface RepairSpareRequest {
  id: number;
  repair_log_id: number;
  part_id: number;
  requested_quantity: number;
  approved_quantity: number | null;
  dispatched_quantity: number;
  unit_cost_at_dispatch: number | null;
  status: SpareRequestStatus;
  tech_lead_notes: string | null;
  part?: Part;
}

export interface RepairLog {
  id: number;
  ticket_number: string;
  machine_id: number;
  line_id: number | null;
  reporter_id: number;
  mechanic_id: number | null;
  tech_lead_id: number | null;
  spare_head_id: number | null;
  ticket_type: TicketType;
  priority: Priority;
  status: TicketStatus;
  reported_issue: string;
  diagnosis_notes: string | null;
  breakdown_start_time: string;
  breakdown_end_time: string | null;
  total_downtime_minutes: number | null;
  created_at: string;
  updated_at: string;
  machine?: Machine;
  line?: Line;
  reporter?: User;
  mechanic?: User;
  tech_lead?: User;
  spare_head?: User;
  spare_requests?: RepairSpareRequest[];
  audit_logs?: InventoryAuditLog[];
}

export interface InventoryAuditLog {
  id: number;
  part_id: number;
  repair_log_id: number | null;
  user_id: number | null;
  change_type: InventoryChangeType;
  quantity_delta: number;
  balance_before: number;
  balance_after: number;
  remarks: string | null;
  timestamp: string;
  part?: Part;
  repair_log?: RepairLog;
  user?: User;
}

export interface AnalyticsData {
  overview: {
    total_machines: number;
    operational_count: number;
    breakdown_count: number;
    availability_pct: number;
    total_tickets: number;
    open_tickets: number;
    completed_tickets: number;
    mttr_minutes: number;
    total_downtime_minutes: number;
  };
  tickets_by_status: Record<string, number>;
  line_metrics: Array<{
    line_id: number;
    line_name: string;
    line_code: string;
    floor_name: string;
    block_name: string;
    total_machines: number;
    open_breakdowns: number;
    total_downtime_minutes: number;
  }>;
  failures_by_model: Array<{
    machine_name: string;
    model_number: string;
    ticket_count: number;
    downtime_sum: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}
