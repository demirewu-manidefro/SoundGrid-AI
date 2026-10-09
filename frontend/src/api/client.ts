export const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'TECHNICIAN';
  tenantId: string | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    isActive: boolean;
  } | null;
}

export interface Machine {
  id: string;
  name: string;
  machineType: 'TRANSFORMER' | 'PUMP' | 'MOTOR' | 'FAN';
  serialNumber: string;
  location: string;
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface DiagnosticRecord {
  id: string;
  machineId: string;
  technicianId: string;
  audioUrl: string;
  isAnomaly: boolean;
  confidenceScore: number;
  classProbabilities: {
    normal: number;
    anomaly: number;
  };
  frequencyData: {
    rmsEnergyDb: number;
    spectralCentroidHz: number;
    spectralBandwidthHz: number;
    dominantFrequencyHz: number;
    zeroCrossingRate: number;
    previewHeatmap?: number[][];
  };
  technicianNotes?: string;
  createdAt: string;
  machine?: Machine;
  technician?: {
    id: string;
    fullName: string;
    email: string;
  };
  maintenanceTicket?: MaintenanceTicket | null;
}

export interface MaintenanceTicket {
  id: string;
  diagnosticId: string;
  assignedToId?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  diagnostic?: DiagnosticRecord;
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export interface AuditLogItem {
  id: string;
  actorId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  metadata?: any;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    machines: number;
  };
}

class ApiClient {
  private getHeaders(isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('soundgrid_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isMultipart = options.body instanceof FormData;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(isMultipart),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.message || errorJson.error || errorMsg;
      } catch {
        errorMsg = await res.text();
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth API
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{ success: boolean; accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    google: (idToken: string) =>
      this.request<{ success: boolean; accessToken: string; user: User }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    me: () => this.request<{ success: boolean; user: User }>('/auth/me'),
    logout: () => this.request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  };

  // Machines API
  machines = {
    list: (params?: { type?: string; status?: string; tenantId?: string }) => {
      const clean: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v && v !== 'undefined') clean[k] = v;
        });
      }
      const q = new URLSearchParams(clean).toString();
      return this.request<{ success: boolean; count: number; data: Machine[] }>(`/machines${q ? `?${q}` : ''}`);
    },
    get: (id: string) => this.request<{ success: boolean; data: Machine }>(`/machines/${id}`),
    create: (data: { name: string; machineType: string; serialNumber: string; location: string; tenantId?: string }) =>
      this.request<{ success: boolean; data: Machine }>('/machines', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      this.request<{ success: boolean; data: Machine }>(`/machines/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  };

  // Diagnostics API
  diagnostics = {
    list: (params?: { machineId?: string; tenantId?: string; page?: number; limit?: number }) => {
      const clean: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== 'undefined') clean[k] = String(v);
        });
      }
      const q = new URLSearchParams(clean).toString();
      return this.request<{ success: boolean; data: DiagnosticRecord[]; pagination: any }>(`/diagnostics${q ? `?${q}` : ''}`);
    },
    get: (id: string) => this.request<{ success: boolean; data: DiagnosticRecord }>(`/diagnostics/${id}`),
    upload: (formData: FormData) =>
      this.request<{ success: boolean; message: string; data: { diagnostic: DiagnosticRecord; prediction: any; telemetry: any; ticket: any } }>('/diagnostics', {
        method: 'POST',
        body: formData,
      }),
  };

  // Tickets API
  tickets = {
    list: (params?: { status?: string; priority?: string }) => {
      const clean: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v && v !== 'undefined') clean[k] = v;
        });
      }
      const q = new URLSearchParams(clean).toString();
      return this.request<{ success: boolean; data: MaintenanceTicket[]; pagination: any }>(`/tickets${q ? `?${q}` : ''}`);
    },
    assign: (id: string, assignedToId: string) =>
      this.request<{ success: boolean; data: MaintenanceTicket }>(`/tickets/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignedToId }),
      }),
    resolve: (id: string, resolutionNotes: string) =>
      this.request<{ success: boolean; data: MaintenanceTicket }>(`/tickets/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes }),
      }),
  };

  // Tenants API (Super Admin)
  tenants = {
    list: () => this.request<{ success: boolean; count: number; data: Tenant[] }>('/tenants'),
    create: (data: { name: string; slug: string; tier?: string }) =>
      this.request<{ success: boolean; data: Tenant }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Users API
  users = {
    list: (tenantId?: string) =>
      this.request<{ success: boolean; count: number; data: User[] }>(`/users${tenantId ? `?tenantId=${tenantId}` : ''}`),
    create: (data: { email: string; fullName: string; role: string; tenantId?: string; password?: string }) =>
      this.request<{ success: boolean; data: User }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Audit Logs API
  audit = {
    list: (params?: { page?: number; limit?: number; action?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<{ success: boolean; data: AuditLogItem[]; pagination: any }>(`/audit${q ? `?${q}` : ''}`);
    },
  };

  // System Health
  health = {
    check: () => this.request<{ status: string; service: string; database: string }>('/health'),
  };
}

export const api = new ApiClient();
