import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppLayouts';
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

        {/* Four Distinct Role Dashboards */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

