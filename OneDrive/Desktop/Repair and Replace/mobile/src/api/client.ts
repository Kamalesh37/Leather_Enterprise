import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  ApiResponse,
  Block,
  Floor,
  Line,
  Machine,
  Part,
  QRMachineLookupResponse,
  RepairLog,
  Role,
  User,
} from './types';

const TOKEN_KEY = 'repair_auth_token';
const API_URL_KEY = 'repair_api_base_url';

// Unified cross-platform storage adapter using Expo SecureStore with web fallback
export const AppStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

// Default base URL depending on runtime platform and local network
const getDefaultBaseUrl = () => {
  // Dynamically resolve the Metro host machine's LAN IP when running on device via Expo
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }
  // Default to computer's local Wi-Fi IP for mobile devices
  return 'http://192.168.29.63:8000/api';
};

let currentBaseUrl: string = getDefaultBaseUrl();

// Initialize base URL from AppStorage on startup
AppStorage.getItem(API_URL_KEY).then((savedUrl: string | null) => {
  if (savedUrl) {
    currentBaseUrl = savedUrl;
  }
});

export const ApiConfig = {
  getBaseUrl: () => currentBaseUrl,
  setBaseUrl: async (url: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl = cleanUrl.endsWith('/') ? `${cleanUrl}api` : `${cleanUrl}/api`;
    }
    currentBaseUrl = cleanUrl;
    await AppStorage.setItem(API_URL_KEY, cleanUrl);
  },
  resetBaseUrl: async () => {
    currentBaseUrl = getDefaultBaseUrl();
    await AppStorage.removeItem(API_URL_KEY);
  },
};

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AppStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AppStorage.setItem(TOKEN_KEY, token);
    } else {
      await AppStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth token', e);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${currentBaseUrl}${endpoint}`;
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({
      success: false,
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    if (!response.ok || data.success === false) {
      const error: any = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out reaching ${url}. Check server connection.`);
    }
    throw err;
  }
}

export const MobileApi = {
  // Authentication
  login: async (credentials: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  switchRole: async (role: Role) =>
    request<{ user: User; token: string }>(`/auth/switch-role?role=${role}`),

  getCurrentUser: async () => request<User>('/auth/me'),

  logout: async () => request<any>('/auth/logout', { method: 'POST' }),

  // QR Scanning & Machine Lookup
  lookupMachineByQR: async (qrHash: string) =>
    request<QRMachineLookupResponse>(`/machines/qr/${encodeURIComponent(qrHash)}`),

  getMachineById: async (id: number) => request<Machine>(`/machines/${id}`),

  getMachines: async (params: { search?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return request<Machine[]>(`/machines${qs ? `?${qs}` : ''}`);
  },

  // Update Machine Space (Block, Floor, Line) and Specifications in DB
  updateMachineSpace: async (
    id: number,
    data: {
      block_id?: number | null;
      floor_id?: number | null;
      line_id?: number | null;
      status?: string;
    }
  ) =>
    request<Machine>(`/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Factory Hierarchy Options (Blocks, Floors, Lines)
  getHierarchyOptions: async () =>
    request<{ blocks: Block[]; floors: Floor[]; lines: Line[] }>('/hierarchy/options'),

  // Tickets & Problem Attendance
  getTickets: async (params: { mechanic_id?: number; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.mechanic_id) query.append('mechanic_id', String(params.mechanic_id));
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return request<RepairLog[]>(`/tickets${qs ? `?${qs}` : ''}`);
  },

  getTicketById: async (id: number) => request<RepairLog>(`/tickets/${id}`),

  // Mechanic Submits Assessment & BOM Spares Requisition
  submitDiagnosis: async (
    ticketId: number,
    data: {
      diagnosis_notes: string;
      spare_parts: Array<{ part_id: number; quantity: number }>;
    }
  ) =>
    request<RepairLog>(`/tickets/${ticketId}/diagnosis`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Mechanic completes physical repair
  completeRepair: async (ticketId: number) =>
    request<RepairLog>(`/tickets/${ticketId}/complete`, {
      method: 'PATCH',
    }),

  // Tech Lead / Engineer signs off repair
  signOffRepair: async (ticketId: number) =>
    request<RepairLog>(`/tickets/${ticketId}/sign-off`, {
      method: 'PATCH',
    }),

  // Spares & Inventory Parts
  getParts: async () => request<Part[]>('/inventory/parts'),
};
