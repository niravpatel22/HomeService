import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Zap,
  Droplets,
  Wind,
  Sparkles,
  Paintbrush,
  Hammer,
  Wrench,
  ShieldCheck,
} from 'lucide-react';

export function CategoryIcon({ name, className = 'w-6 h-6' }) {
  const icons = {
    Zap,
    Droplets,
    Wind,
    Sparkles,
    Paintbrush,
    Hammer,
    Wrench,
    ShieldCheck,
  };
  const IconComp = icons[name] || Wrench;
  return <IconComp className={className} />;
}

export function StatusBadge({ status }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    'Provider Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Failed: 'bg-rose-50 text-rose-700 border-rose-200',
    Refunded: 'bg-amber-50 text-amber-800 border-amber-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Suspended: 'bg-rose-50 text-rose-700 border-rose-200',
    Open: 'bg-rose-50 text-rose-700 border-rose-200',
    'In Review': 'bg-amber-50 text-amber-800 border-amber-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Settled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const cls = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card-surface p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && <p className="mt-1.5 text-xs font-medium text-emerald-600">{trend}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${accents[accent] || accents.brand}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/70 text-slate-500">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className={`w-full ${maxWidth} rounded-2xl border border-slate-200 bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
}) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3 pt-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
      <p className="text-xs font-medium text-slate-500">
        Showing Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
        <span className="font-bold text-slate-900">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastBanner({ toast }) {
  if (!toast) return null;
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-brand-500" />,
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3.5 text-sm font-medium text-white shadow-2xl">
      {icons[toast.type] || icons.success}
      <span>{toast.message}</span>
    </div>
  );
}

