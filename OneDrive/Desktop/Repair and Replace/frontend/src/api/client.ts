import {
  AnalyticsData,
  ApiResponse,
  Block,
  Floor,
  InventoryAuditLog,
  Line,
  Machine,
  Part,
  RepairLog,
  Role,
  ServiceCatalogItem,
  User,
  Vendor,
} from '../types';

const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: `HTTP Error ${response.status}: ${response.statusText}`,
    }));

    if (!response.ok || data.success === false) {
      const error: any = new Error(data.message || data.error || 'An unexpected error occurred.');
      error.status = response.status;
      error.details = data.errors || data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const Api = {
  // System Health
  getHealth: () => request<{ status: string; database: string }>('/health'),

  // Auth & Roles
  login: (credentials: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => request<User>('/auth/me'),

  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  switchRole: (role: Role) => request<{ user: User; token: string }>(`/auth/switch-role?role=${role}`),

  // Organizational Hierarchy
  getHierarchyTree: () => request<Block[]>('/hierarchy'),
  getHierarchyOptions: () =>
    request<{ blocks: Block[]; floors: Floor[]; lines: Line[] }>('/hierarchy/options'),
  getHierarchySummary: () => request<any>('/hierarchy/summary'),

  // Crew Management & RBAC Matrix
  listCrew: (params: { role?: string; block_id?: number; floor_id?: number; line_id?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.role) q.append('role', params.role);
    if (params.block_id) q.append('block_id', String(params.block_id));
    if (params.floor_id) q.append('floor_id', String(params.floor_id));
    if (params.line_id) q.append('line_id', String(params.line_id));
    if (params.search) q.append('search', params.search);
    return request<User[]>(`/crew?${q.toString()}`);
  },

  storeCrew: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    block_id?: number | null;
    floor_id?: number | null;
    line_id?: number | null;
    phone?: string;
    permissions?: Record<string, boolean>;
  }) =>
    request<User>('/crew', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCrew: (id: number, payload: any) =>
    request<User>(`/crew/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getActiveMechanics: () => request<User[]>('/crew/mechanics/active'),

  // Vendors
  listVendors: (params: { search?: string; category?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.category) q.append('category', params.category);
    return request<Vendor[]>(`/vendors?${q.toString()}`);
  },

  storeVendor: (payload: any) =>
    request<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Machines & QR Codes
  listMachines: (params: {
    block_id?: number;
    floor_id?: number;
    line_id?: number;
    status?: string;
    vendor_id?: number;
    search?: string;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.block_id) q.append('block_id', String(params.block_id));
    if (params.floor_id) q.append('floor_id', String(params.floor_id));
    if (params.line_id) q.append('line_id', String(params.line_id));
    if (params.status) q.append('status', params.status);
    if (params.vendor_id) q.append('vendor_id', String(params.vendor_id));
    if (params.search) q.append('search', params.search);
    return request<Machine[]>(`/machines?${q.toString()}`);
  },

  storeMachine: (payload: any) =>
    request<Machine>('/machines', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMachineById: (id: number) => request<Machine>(`/machines/${id}`),

  lookupMachineByQR: (qrHash: string) =>
    request<{
      machine: Machine;
      suggested_services: ServiceCatalogItem[];
      active_breakdown: RepairLog | null;
    }>(`/machines/qr/${encodeURIComponent(qrHash)}`),

  getMachineQRLabel: (id: number) => request<any>(`/machines/${id}/qr-label`),

  // Service Catalog
  getServiceCatalog: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<ServiceCatalogItem[]>(`/service-catalog${q}`);
  },

  // Repair Tickets
  listTickets: (params: {
    status?: string;
    ticket_type?: string;
    priority?: string;
    line_id?: number;
    mechanic_id?: number;
    my_queue?: boolean;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.ticket_type) q.append('ticket_type', params.ticket_type);
    if (params.priority) q.append('priority', params.priority);
    if (params.line_id) q.append('line_id', String(params.line_id));
    if (params.mechanic_id) q.append('mechanic_id', String(params.mechanic_id));
    if (params.my_queue) q.append('my_queue', 'true');
    return request<RepairLog[]>(`/tickets?${q.toString()}`);
  },

  getTicketById: (id: number) => request<RepairLog>(`/tickets/${id}`),

  createTicket: (payload: {
    machine_id?: number;
    qr_code_hash?: string;
    ticket_type: string;
    priority: string;
    reported_issue: string;
    mechanic_id?: number | null;
  }) =>
    request<RepairLog>('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  assignMechanic: (ticketId: number, mechanic_id: number) =>
    request<RepairLog>(`/tickets/${ticketId}/assign-mechanic`, {
      method: 'PATCH',
      body: JSON.stringify({ mechanic_id }),
    }),

  submitDiagnosis: (
    ticketId: number,
    payload: {
      diagnosis_notes: string;
      spare_parts?: Array<{ part_id: number; quantity: number }>;
    }
  ) =>
    request<RepairLog>(`/tickets/${ticketId}/diagnosis`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeRepair: (ticketId: number) =>
    request<RepairLog>(`/tickets/${ticketId}/complete`, {
      method: 'PATCH',
    }),

  signOffRepair: (ticketId: number) =>
    request<RepairLog>(`/tickets/${ticketId}/sign-off`, {
      method: 'PATCH',
    }),

  // Tech Lead Approvals
  listPendingApprovals: () => request<RepairLog[]>('/approvals/spares'),

  approveSpareRequest: (
    ticketId: number,
    payload: {
      tech_lead_notes?: string;
      parts_approval: Array<{
        request_id: number;
        approved_quantity: number;
        status: 'APPROVED' | 'REJECTED';
        notes?: string;
      }>;
    }
  ) =>
    request<RepairLog>(`/approvals/spares/${ticketId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Spare Head Dispatches (Atomic Deduction)
  listPendingDispatches: () => request<RepairLog[]>('/dispatches/spares'),

  dispatchSpares: (ticketId: number, payload: { remarks?: string; request_ids?: number[] } = {}) =>
    request<{ ticket: RepairLog; dispatched_parts: any[] }>(`/dispatches/spares/${ticketId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Inventory Catalog & Bins
  listParts: (params: { category?: string; search?: string; low_stock?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.append('category', params.category);
    if (params.search) q.append('search', params.search);
    if (params.low_stock) q.append('low_stock', 'true');
    return request<Part[]>(`/inventory/parts?${q.toString()}`);
  },

  createPart: (payload: any) =>
    request<Part>('/inventory/parts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  restockPart: (payload: { part_id: number; quantity: number; remarks?: string }) =>
    request<Part>('/inventory/restock', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adjustStock: (payload: { part_id: number; new_quantity: number; reason: string }) =>
    request<Part>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAuditLogs: (params: { change_type?: string; part_id?: number; ticket_id?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.change_type) q.append('change_type', params.change_type);
    if (params.part_id) q.append('part_id', String(params.part_id));
    if (params.ticket_id) q.append('ticket_id', String(params.ticket_id));
    return request<InventoryAuditLog[]>(`/inventory/audit-logs?${q.toString()}`);
  },

  getInventoryStats: () => request<any>('/inventory/stats'),

  // Analytics
  getAnalyticsDashboard: () => request<AnalyticsData>('/analytics/dashboard'),
};
