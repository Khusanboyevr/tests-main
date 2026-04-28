import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'react-hot-toast'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TakeTestPage from './pages/TakeTestPage'
import ResultPage from './pages/ResultPage'
import ResultsHistoryPage from './pages/ResultsHistoryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ShopPage from './pages/ShopPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage'
import AdminTestsPage from './pages/admin/AdminTestsPage'
import AdminShopPage from './pages/admin/AdminShopPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminResultsPage from './pages/admin/AdminResultsPage'
import AdminStatsPage from './pages/admin/AdminStatsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/test/:subjectId" element={<ProtectedRoute><TakeTestPage /></ProtectedRoute>} />
          <Route path="/result/:id" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsHistoryPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="subjects" element={<AdminSubjectsPage />} />
            <Route path="tests" element={<AdminTestsPage />} />
            <Route path="shop" element={<AdminShopPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="results" element={<AdminResultsPage />} />
            <Route path="stats" element={<AdminStatsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}
