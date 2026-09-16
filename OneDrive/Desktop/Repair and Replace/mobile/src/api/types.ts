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
  block?: Block;
  floor?: Floor;
  line?: Line;
}

export interface Block {
  id: number;
  name: string;
  code: string;
  description?: string;
  floors?: Floor[];
}

export interface Floor {
  id: number;
  block_id: number;
  name: string;
  floor_number: number;
  lines?: Line[];
}

export interface Line {
  id: number;
  floor_id: number;
  name: string;
  line_code: string;
}

export interface Vendor {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

export interface Part {
  id: number;
  name: string;
  part_number: string;
  category?: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  bin_location?: string;
  status?: string;
}

export interface RepairSpareRequest {
  id: number;
  repair_log_id: number;
  part_id: number;
  requested_quantity: number;
  status: SpareRequestStatus;
  part?: Part;
  created_at?: string;
}

export interface RepairLog {
  id: number;
  ticket_number: string;
  machine_id: number;
  line_id: number | null;
  reporter_id: number | null;
  mechanic_id: number | null;
  tech_lead_id?: number | null;
  spare_head_id?: number | null;
  ticket_type: TicketType;
  priority: Priority;
  status: TicketStatus;
  reported_issue: string;
  diagnosis_notes?: string | null;
  breakdown_start_time?: string | null;
  breakdown_end_time?: string | null;
  total_downtime_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
  machine?: Machine;
  reporter?: User;
  mechanic?: User;
  techLead?: User;
  spareRequests?: RepairSpareRequest[];
}

export interface Machine {
  id: number;
  machine_code: string;
  name: string;
  model_number: string;
  serial_number: string;
  vendor_id?: number | null;
  block_id?: number | null;
  floor_id?: number | null;
  line_id?: number | null;
  qr_code_hash: string;
  specifications?: Record<string, any> | null;
  image_url?: string | null;
  status: MachineStatus;
  installed_at?: string | null;
  vendor?: Vendor;
  block?: Block;
  floor?: Floor;
  line?: Line;
  open_tickets_count?: number;
  repairLogs?: RepairLog[];
}

export interface ServiceCatalogItem {
  id: number;
  title: string;
  machine_category: string;
  description: string;
  estimated_hours: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface QRMachineLookupResponse {
  machine: Machine;
  suggested_services: ServiceCatalogItem[];
  active_breakdown: RepairLog | null;
}
