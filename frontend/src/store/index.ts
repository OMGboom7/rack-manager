import { create } from 'zustand';
import type { User, Datacenter } from '@/types';

interface AppState {
  user: User | null;
  token: string | null;
  datacenters: Datacenter[];
  selectedRackId: number | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setDatacenters: (list: Datacenter[]) => void;
  setSelectedRackId: (id: number | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  datacenters: [],
  selectedRackId: null,

  setUser: (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
    set({ user });
  },
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  setDatacenters: (datacenters) => set({ datacenters }),
  setSelectedRackId: (selectedRackId) => set({ selectedRackId }),
}));
