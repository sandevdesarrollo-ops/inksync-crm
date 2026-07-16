import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGate from '@/components/auth/AuthGate';
import AppLayout from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import ActivityPage from '@/pages/ActivityPage';
import ReportsPage from '@/pages/ReportsPage';
import CalendarPage from '@/pages/CalendarPage';
import ClientsPage from '@/pages/ClientsPage';
import DesignsPage from '@/pages/DesignsPage';
import ProposalsPage from '@/pages/ProposalsPage';
import MessagesPage from '@/pages/MessagesPage';
import NurturePage from '@/pages/NurturePage';
import InventoryPage from '@/pages/InventoryPage';
import TeamPage from '@/pages/TeamPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/designs" element={<DesignsPage />} />
          <Route path="/proposals" element={<ProposalsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/nurture" element={<NurturePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
