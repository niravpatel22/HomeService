import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppLayouts';
import { usePlatform } from '../context/PlatformContext';
import LandingPage from '../pages/LandingPage';
import { LoginPage, CustomerRegisterPage, ProviderRegisterPage } from '../pages/AuthPages';
import { ServiceListingPage, ServiceDetailPage } from '../pages/ServicePages';
import {
  BookingCheckoutPage,
  BookingTrackingPage,
  InvoiceReceiptPage,
} from '../pages/BookingPages';
import CustomerDashboard from '../pages/CustomerDashboard';
import ProviderDashboard from '../pages/ProviderDashboard';
import TechnicianDashboard from '../pages/TechnicianDashboard';
import AdminDashboard from '../pages/AdminDashboard';

function RoleProtectedRoute({ requiredRole, children }) {
  const { currentUser } = usePlatform();

  if (!currentUser || currentUser.role !== requiredRole) {
    return <Navigate to={`/login?role=${requiredRole}`} replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {/* Public & Discovery Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<CustomerRegisterPage />} />
        <Route path="/register/provider" element={<ProviderRegisterPage />} />
        <Route path="/services" element={<ServiceListingPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />

        {/* Booking, Tracking & Invoicing Routes */}
        <Route path="/book/:serviceId" element={<BookingCheckoutPage />} />
        <Route path="/bookings/:id" element={<BookingTrackingPage />} />
        <Route path="/invoices/:bookingId" element={<InvoiceReceiptPage />} />

        {/* Four Role-Authenticated Dashboards */}
        <Route
          path="/customer/dashboard"
          element={
            <RoleProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/provider/dashboard"
          element={
            <RoleProtectedRoute requiredRole="service_provider">
              <ProviderDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/technician/dashboard"
          element={
            <RoleProtectedRoute requiredRole="technician">
              <TechnicianDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RoleProtectedRoute requiredRole="super_admin">
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
