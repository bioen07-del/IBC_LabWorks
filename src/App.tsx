import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Cultures } from '@/pages/Cultures'
import { Donors } from '@/pages/Donors'
import { EquipmentPage } from '@/pages/Equipment'
import { LocationsPage } from '@/pages/Locations'
import { SOPsPage } from '@/pages/SOPs'
import { UsersPage } from '@/pages/Users'
import { ContainerTypesPage } from '@/pages/ContainerTypes'
import { DonorDetail } from '@/pages/DonorDetail'
import { DonorNew } from '@/pages/DonorNew'
import { DonationNew } from '@/pages/DonationNew'
import { CultureNew } from '@/pages/CultureNew'
import { CultureDetail } from '@/pages/CultureDetail'
import { InventoryPage } from '@/pages/Inventory'
import { MediaRecipesPage } from '@/pages/MediaRecipes'
import { CombinedMediaPage } from '@/pages/CombinedMedia'
import { ProcessTemplatesPage } from '@/pages/ProcessTemplates'
import { ProcessExecutionPage } from '@/pages/ProcessExecution'
import DeviationsPage from '@/pages/Deviations'
import QCTestsPage from '@/pages/QCTests'
import TasksPage from '@/pages/Tasks'
import OrdersPage from '@/pages/Orders'
import ReleasesPage from '@/pages/Releases'
import { AuditLogPage } from '@/pages/AuditLog'
import { TraceabilityPage } from '@/pages/Traceability'
import ReportsPage from '@/pages/Reports'
import LabelsPage from '@/pages/Labels'
import SettingsPage from '@/pages/Settings'
import './App.css'

// Placeholder pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        Раздел в разработке
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cultures" element={<Cultures />} />
            <Route path="cultures/new" element={<CultureNew />} />
            <Route path="cultures/:id" element={<CultureDetail />} />
            <Route path="donors" element={<Donors />} />
            <Route path="donors/new" element={<DonorNew />} />
            <Route path="donors/:id" element={<DonorDetail />} />
            <Route path="donors/:id/donations/new" element={<DonationNew />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="processes" element={<ProcessExecutionPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="media" element={<CombinedMediaPage />} />
            <Route path="media-recipes" element={<MediaRecipesPage />} />
            <Route path="deviations" element={<DeviationsPage />} />
            <Route path="qc-tests" element={<QCTestsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="releases" element={<ReleasesPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="sops" element={<SOPsPage />} />
            <Route path="container-types" element={<ContainerTypesPage />} />
            <Route path="process-templates" element={<ProcessTemplatesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="traceability" element={<TraceabilityPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="labels" element={<LabelsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
