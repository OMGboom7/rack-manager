import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import RackDetail from '@/pages/RackDetail';
import RackList from '@/pages/RackList';
import DatacenterList from '@/pages/DatacenterList';
import UserList from '@/pages/UserList';
import DeviceTypeList from '@/pages/DeviceTypeList';
import HardwareModel from '@/pages/HardwareModel';
import AuditLog from '@/pages/AuditLog';
import TemplateList from '@/pages/TemplateList';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const token = useStore((s) => s.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AppLayout />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="racks" element={<RackList />} />
        <Route path="racks/:id" element={<RackDetail />} />
        <Route path="datacenters" element={<DatacenterList />} />
        <Route path="users" element={<UserList />} />
        <Route path="devicetypes" element={<DeviceTypeList />} />
        <Route path="hwmodels" element={<HardwareModel />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="templates" element={<TemplateList />} />
      </Route>
    </Routes>
  );
};

export default App;
