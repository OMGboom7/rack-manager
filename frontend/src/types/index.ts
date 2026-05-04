export interface Datacenter {
  id: number;
  name: string;
  location?: string;
  rows?: Row[];
}

export interface Row {
  id: number;
  name: string;
  datacenterId: number;
  datacenter?: Datacenter;
  racks?: Rack[];
}

export interface Rack {
  id: number;
  name: string;
  rowId: number;
  row?: Row;
  totalU: number;
  width: number;
  purpose?: string;
  devices?: Device[];
}

export interface DeviceType {
  id: number;
  name: string;
  color: string;
}

export interface Device {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  subnet?: string;
  vlan?: number;
  status: string;
  startU: number;
  heightU: number;
  cpuModelId?: number;
  cpuModel?: { id: number; brand: string; model: string; cores?: number; threads?: number; architecture?: string };
  cpuCount?: number;
  memModelId?: number;
  memModel?: { id: number; brand: string; model: string; capacity?: number; type?: string; speed?: number; ecc?: boolean };
  memSize?: number;
  storage?: string;
  nic?: string;
  description?: string;
  tags: string[] | string;
  assetTag?: string;
  supplier?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  rackId: number;
  rack?: Rack;
  deviceTypeId: number;
  deviceType?: DeviceType;
}

export interface DeviceTemplate {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  heightU: number;
  deviceTypeId: number;
  deviceType?: DeviceType;
  cpuModelId?: number;
  cpuModel?: { id: number; brand: string; model: string; cores?: number; threads?: number; architecture?: string };
  cpuCount?: number;
  memModelId?: number;
  memModel?: { id: number; brand: string; model: string; capacity?: number; type?: string; speed?: number; ecc?: boolean };
  memSize?: number;
  storage?: string;
  nic?: string;
  description?: string;
  tags?: string;
}

export interface MaintenanceLog {
  id: number;
  deviceId: number;
  type: string;
  summary: string;
  detail?: string;
  operator?: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  realName?: string;
  role: string;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export function parseTags(val: string[] | string | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val) as string[]; } catch { return []; }
}
