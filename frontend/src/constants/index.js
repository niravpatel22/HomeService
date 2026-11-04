export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CUSTOMER: 'customer',
  SERVICE_PROVIDER: 'service_provider',
  TECHNICIAN: 'technician',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  customer: 'Customer',
  service_provider: 'Service Provider',
  technician: 'Technician',
};

export const ROLE_HOME_ROUTES = {
  super_admin: '/admin/dashboard',
  customer: '/customer/dashboard',
  service_provider: '/provider/dashboard',
  technician: '/technician/dashboard',
};

export const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Provider Assigned',
  'In Progress',
  'Completed',
  'Cancelled',
  'Rejected',
];

export const PAYMENT_STATUSES = [
  'Pending',
  'Paid',
  'Failed',
  'Refunded',
];

export const TIME_SLOTS = [
  { start: '09:00', end: '10:30', label: '09:00 AM – 10:30 AM' },
  { start: '11:00', end: '12:30', label: '11:00 AM – 12:30 PM' },
  { start: '14:00', end: '15:30', label: '02:00 PM – 03:30 PM' },
  { start: '16:00', end: '17:30', label: '04:00 PM – 05:30 PM' },
  { start: '18:00', end: '19:30', label: '06:00 PM – 07:30 PM' },
];

