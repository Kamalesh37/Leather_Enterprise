export type Role =
  | 'admin'
  | 'block_manager'
  | 'floor_manager'
  | 'line_supervisor'
  | 'mechanic'
  | 'tech_lead'
  | 'spare_head';

export type NavTab =
  | 'dashboard'
  | 'crew'
  | 'machines'
  | 'vendors'
  | 'supervisor'
  | 'mechanic'
  | 'tech_lead'
  | 'spare_head'
  | 'inventory'
  | 'audit_ledger';


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

export interface ReportingChainNode {
  id: number;
  name: string;
  role: Role;
  email: string;
  phone?: string | null;
  designation: string;
  block?: string | null;
  floor?: string | null;
  line?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  manager_id?: number | null;
  block_id: number | null;
  floor_id: number | null;
  line_id: number | null;
  phone: string | null;
  status: 'active' | 'inactive';
  manager?: {
    id: number;
    name: string;
    role: Role;
    email: string;
    phone?: string | null;
  } | null;
  reporting_chain?: ReportingChainNode[];
  higher_official?: ReportingChainNode | null;
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
  service_stats?: MachineServiceStats;
}

export interface AuthorityHandledRecord {
  user: User;
  role: Role;
  action_types: string[];
  interventions_count: number;
  last_activity_at: string;
}

export interface MachineServiceStats {
  total_services_done: number;
  completed_services: number;
  open_services: number;
  total_downtime_minutes: number;
  unique_authorities_count: number;
  authorities_roster: AuthorityHandledRecord[];
}

export interface MachineTypeGroup {
  type_key: string;
  name: string;
  model_number: string;
  vendor?: Vendor | null;
  vendor_id?: number | null;
  specifications?: MachineSpecifications | null;
  image_url?: string | null;
  total_quantity: number;
  operational_count: number;
  breakdown_count: number;
  maintenance_count: number;
  machines: Machine[];
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

export interface BreakdownMachineItem {
  id: number;
  machine_code: string;
  name: string;
  model_number: string;
  serial_number: string;
  status: MachineStatus;
  image_url: string | null;
  specifications: MachineSpecifications | null;
  vendor?: Vendor;
  block?: Block;
  floor?: Floor;
  line?: Line;
  active_ticket?: {
    id: number;
    ticket_number: string;
    ticket_type: TicketType;
    priority: Priority;
    status: TicketStatus;
    reported_issue: string;
    diagnosis_notes: string | null;
    breakdown_start_time: string | null;
    elapsed_downtime_minutes: number;
    reporter?: { id: number; name: string; role: Role } | null;
    mechanic?: { id: number; name: string; role: Role; phone: string | null } | null;
    spare_requests?: RepairSpareRequest[];
  } | null;
}

export interface OfficialScopeInfo {
  official_name: string;
  official_role: Role;
  official_title: string;
  scope_level: 'enterprise' | 'block' | 'floor' | 'line' | 'engineering' | 'warehouse' | 'technician' | 'general';
  scope_name: string;
  location_context?: string;
  is_restricted: boolean;
  assigned_block_id?: number | null;
  assigned_floor_id?: number | null;
  assigned_line_id?: number | null;
}

export interface AnalyticsData {
  scope_info?: OfficialScopeInfo;
  overview: {
    total_machines: number;
    operational_count: number;
    breakdown_count: number;
    maintenance_count?: number;
    decommissioned_count?: number;
    active_bottlenecks?: number;
    availability_pct: number;
    total_tickets: number;
    open_tickets: number;
    completed_tickets: number;
    mttr_minutes: number;
    total_downtime_minutes: number;
  };
  breakdown_machines?: BreakdownMachineItem[];
  status_distribution?: Record<string, number>;
  tickets_by_status: Record<string, number>;
  line_metrics: Array<{
    line_id: number;
    line_name: string;
    line_code: string;
    floor_name: string;
    block_name: string;
    total_machines: number;
    operational_machines?: number;
    open_breakdowns: number;
    total_downtime_minutes: number;
    avg_mttr_minutes?: number;
  }>;
  failures_by_model: Array<{
    machine_name: string;
    model_number: string;
    ticket_count: number;
    downtime_sum: number;
    affected_machines_count?: number;
  }>;
  recent_tickets?: RepairLog[];
  tech_lead_metrics?: {
    pending_diagnostic_approvals: number;
    pending_sign_offs: number;
    avg_approval_turnaround_min: number;
    root_cause_breakdown: Array<{ category: string; count: number; pct: number }>;
  } | null;
  spare_head_metrics?: {
    total_part_skus: number;
    low_stock_parts_count: number;
    pending_dispatches_count: number;
    inventory_valuation: number;
    dispatch_sla_compliance_pct: number;
  } | null;
  mechanic_metrics?: {
    my_active_repairs: number;
    my_completed_repairs: number;
    my_avg_repair_time_min: number;
    first_time_fix_rate_pct: number;
  } | null;
}

export interface WorkReportTask {
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  details?: string;
}

export interface WorkReport {
  id: number;
  user_id: number;
  manager_id: number | null;
  report_type: 'daily_work_done' | 'shift_handover' | 'incident_escalation' | 'maintenance_summary' | 'line_performance' | 'floor_operations';
  title: string;
  shift: 'morning' | 'evening' | 'night' | 'general';
  summary: string;
  tasks_completed?: WorkReportTask[];
  metrics?: Record<string, any>;
  blockers_and_delays?: string | null;
  recommendations?: string | null;
  status: 'submitted' | 'reviewed' | 'acknowledged';
  acknowledgement_notes?: string | null;
  acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  manager?: User | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  meta?: any;
}


