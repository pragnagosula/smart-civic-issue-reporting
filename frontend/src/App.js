import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Home from './pages/home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import OTPVerify from './pages/OTPVerify';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import IssueDetails from './pages/IssueDetails';
import SelectRole from './pages/SelectRole';
import OfficerRegister from './pages/OfficerRegister';
import OfficerScreening from './pages/OfficerScreening';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerProfile from './pages/OfficerProfile';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import CivicHealthDashboard from './pages/CivicHealthDashboard';
import CitizenProfile from './pages/CitizenProfile';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Home opens first */}
        <Route path="/" element={<Home />} />

        {/* Role Selection & Signup Flows */}
        <Route path="/signup" element={<SelectRole />} />
        <Route path="/citizen-signup" element={<Signup />} />

        {/* Officer Flow */}
        <Route path="/officer/register" element={<OfficerRegister />} />
        <Route path="/officer/screening" element={<OfficerScreening />} />

        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OTPVerify />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-issue"
          element={
            <ProtectedRoute>
              <ReportIssue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issue/:id"
          element={
            <ProtectedRoute>
              <IssueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        {/* Analytics Routes */}
        <Route
          path="/officer/profile"
          element={
            <ProtectedRoute>
              <OfficerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/department-analytics"
          element={
            <ProtectedRoute>
              <DepartmentAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/civic-health"
          element={
            <ProtectedRoute>
              <CivicHealthDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/profile"
          element={
            <ProtectedRoute>
              <CitizenProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router >
  );
}

export default App;
