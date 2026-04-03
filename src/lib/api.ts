// Centralized API wrapper for SolarBurst backend
const BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${BASE}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(err.error || 'Request failed', res.status);
    }

    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Upload APIs
export interface UploadResponse {
  _id: string;
  originalName: string;
  rowCount: number;
  columnNames: string[];
  status: string;
  uploadedAt: string;
  fileSize: number;
  preview: Record<string, string>[];
}

export interface UploadMeta {
  _id: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
  rowCount: number;
  columnNames: string[];
  status: string;
  fileSize: number;
}

export interface UploadData {
  _id: string;
  originalName: string;
  columnNames: string[];
  rowCount: number;
  data: Record<string, string>[];
}

export function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return request<UploadResponse>('/uploads', { method: 'POST', body: form });
}

export function getUploads(): Promise<UploadMeta[]> {
  return request<UploadMeta[]>('/uploads');
}

export function getUpload(id: string): Promise<UploadMeta> {
  return request<UploadMeta>(`/uploads/${id}`);
}

export function getUploadData(id: string): Promise<UploadData> {
  return request<UploadData>(`/uploads/${id}/data`);
}

// Analysis APIs
export interface AnalysisResponse {
  _id: string;
  uploadId: string;
  results: {
    summaryStats: Record<string, { mean: number; median: number; mode: number; stdDev: number; min: number; max: number; count: number }>;
    correlationMatrix: Record<string, Record<string, number>>;
    distributions: Record<string, { binStart: number; binEnd: number; count: number }[]>;
    categoricalDist: Record<string, { name: string; value: number }[]>;
    timeSeriesData: Record<string, { date: string; value: number }[]>;
    numericColumns: string[];
    categoricalColumns: string[];
    dateColumns: string[];
    totalRows: number;
    totalColumns: number;
  };
  status: string;
  createdAt: string;
}

export function runAnalysis(uploadId: string): Promise<AnalysisResponse> {
  return request<AnalysisResponse>('/analysis', {
    method: 'POST',
    body: JSON.stringify({ uploadId }),
  });
}

export function getAnalysis(id: string): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(`/analysis/${id}`);
}

// Dashboard APIs
export interface DashboardStats {
  totalUploads: number;
  totalAnalyses: number;
  mostRecentUpload: { uploadedAt: string; originalName: string } | null;
  storageUsed: number;
  recentActivity: { action: string; description: string; timestamp: string; _id: string }[];
  uploadsOverTime: { date: string; count: number }[];
  analysisTypes: { name: string; value: number }[];
}

export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/dashboard/stats');
}

// History APIs
export interface HistoryResponse {
  entries: {
    _id: string;
    action: string;
    description: string;
    uploadId: string | null;
    analysisId: string | null;
    timestamp: string;
    metadata: Record<string, unknown>;
  }[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function getHistory(params: {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
} = {}): Promise<HistoryResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.set(k, String(v));
  });
  return request<HistoryResponse>(`/history?${query}`);
}

export function clearHistory(): Promise<{ message: string; deletedCount: number }> {
  return request('/history', { method: 'DELETE' });
}

// Settings APIs
export interface AppSettings {
  _id: string;
  theme: string;
  defaultChartType: string;
  dataRetentionDays: number;
  notifications: boolean;
  apiKey: string;
  updatedAt: string;
}

export function getSettings(): Promise<AppSettings> {
  return request<AppSettings>('/settings');
}

export function updateSettings(data: Partial<Omit<AppSettings, '_id' | 'apiKey' | 'updatedAt'>>): Promise<AppSettings> {
  return request<AppSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteAllData(): Promise<{ message: string; deleted: { uploads: number; analyses: number; history: number } }> {
  return request('/settings/data', { method: 'DELETE' });
}
