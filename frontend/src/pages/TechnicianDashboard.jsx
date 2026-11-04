import React, { useState } from 'react';
import {
  Wrench,
  MapPin,
  Clock,
  CheckCircle2,
  Camera,
  Phone,
  FileText,
  Navigation,
  PanelLeft,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StatCard, StatusBadge, Modal } from '../components/common/UIComponents';
import { formatDate, formatDateTime } from '../utils/formatters';

export default function TechnicianDashboard() {
  const { data, currentTechnician, technicianUpdateJob } = usePlatform();

  const [activeTab, setActiveTab] = useState('active');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completionModalBooking, setCompletionModalBooking] = useState(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionFileName, setCompletionFileName] = useState('');

  const assignedJobs = data.bookings.filter(
    (b) => Number(b.technicianId) === Number(currentTechnician.id)
  );
  const activeFieldJobs = assignedJobs.filter((b) =>
    ['Provider Assigned', 'In Progress'].includes(b.status)
  );
  const completedHistory = assignedJobs.filter((b) => b.status === 'Completed');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompletionFileName(file.name);
  };

  const navItems = [
    { id: 'active', label: 'Active Assigned Jobs', icon: Wrench, badge: activeFieldJobs.length },
    { id: 'history', label: 'Completed Job History', icon: CheckCircle2, badge: completedHistory.length },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start bg-slate-100/70">
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sticky Technician Field Left Sidebar */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:self-start lg:z-20 lg:translate-x-0 shrink-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shrink-0">
              <Wrench className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold tracking-tight text-white block truncate">
                Technician Console
              </span>
              <p className="text-[10px] text-slate-400 truncate">
                {currentTechnician.providerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 space-y-3.5">
          {/* Duty Status Pill */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">On-Duty & Available</span>
            </div>
            <span className="font-mono text-[10px] text-amber-400">{currentTechnician.rating} ★</span>
          </div>

          <nav className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              Field Dispatch Queue
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Field Protocol & Profile */}
          <div className="pt-2 border-t border-slate-800/90 space-y-2">
            <div className="rounded-xl bg-slate-900 px-3 py-2.5 border border-slate-800">
              <p className="text-xs font-bold text-white truncate">{currentTechnician.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentTechnician.specialization}
              </p>
              <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                {currentTechnician.email}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Field SOP Checklist
              </p>
              <p>1. Mark arrival timestamp on-site.</p>
              <p>2. Upload completion photo proof.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Technician Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">
                    Technician Field Console
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {activeTab}
                  </span>
                </div>
                <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {currentTechnician.fullName}
                </h1>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 whitespace-nowrap">
              Field Duty Status: On-Duty & Available
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Active Assigned Jobs"
              value={activeFieldJobs.length}
              subtitle="Awaiting arrival or completion"
              icon={Wrench}
              accent="brand"
            />
            <StatCard
              title="Completed Field Jobs"
              value={completedHistory.length + currentTechnician.completedJobsCount}
              subtitle="Verified with photo proof"
              icon={CheckCircle2}
              accent="emerald"
            />
            <StatCard
              title="Technician Quality Score"
              value={`${currentTechnician.rating} ★`}
              subtitle="Customer punctuality & hygiene"
              icon={Clock}
              accent="amber"
            />
          </div>

          {/* Active Assigned Field Jobs */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Assigned Active Field Jobs ({activeFieldJobs.length})
              </h2>

              {activeFieldJobs.length === 0 ? (
                <div className="card-surface p-8 text-center text-xs text-slate-500">
                  All assigned jobs for today are completed! Switch to Completed Job History in the sidebar.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {activeFieldJobs.map((job) => (
                    <div key={job.id} className="card-surface p-6 space-y-4 border-l-4 border-l-brand-600">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-brand-600">{job.bookingNumber}</span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {job.serviceName}
                          </h3>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>

                      <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
                        <p className="flex items-center gap-2 font-semibold text-slate-900">
                          <Clock className="h-4 w-4 text-brand-600" />
                          Scheduled: {formatDate(job.scheduledDate)} ({job.startTime} – {job.endTime})
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-brand-600" />
                          Customer: <strong>{job.customerName}</strong> ({job.customerPhone})
                        </p>
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                          <span>{job.addressText}</span>
                        </p>
                      </div>

                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Reported Issue:</span>
                        <p className="mt-1 text-slate-600">{job.problemDescription}</p>
                      </div>

                      {job.arrivedAt && (
                        <p className="text-xs font-semibold text-emerald-700">
                          ✓ Arrival Marked at: {formatDateTime(job.arrivedAt)}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {job.status === 'Provider Assigned' && (
                          <button
                            type="button"
                            onClick={() =>
                              technicianUpdateJob(job.id, { action: 'ARRIVE_START' })
                            }
                            className="btn-primary w-full text-xs py-2.5"
                          >
                            <Navigation className="h-4 w-4" /> Accept Job, Mark Arrival & Start Service
                          </button>
                        )}

                        {job.status === 'In Progress' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompletionModalBooking(job);
                              setCompletionRemarks(
                                'Completed full inspection, resolved issue, tested load parameters, and cleaned work area.'
                              );
                            }}
                            className="btn-primary w-full text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Camera className="h-4 w-4" /> Upload Completion Photo & Mark Job Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Job History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Completed Job History ({completedHistory.length})
              </h2>
              <div className="card-surface overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Booking ID</th>
                      <th className="px-5 py-3.5">Service & Customer</th>
                      <th className="px-5 py-3.5">Arrival & Completion</th>
                      <th className="px-5 py-3.5">Completion Remarks</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedHistory.map((job) => (
                      <tr key={job.id}>
                        <td className="px-5 py-4 font-bold text-slate-900">{job.bookingNumber}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{job.serviceName}</p>
                          <p className="text-slate-500">
                            {job.customerName} • {job.addressText}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div>Arrived: {formatDateTime(job.arrivedAt)}</div>
                          <div className="text-emerald-700 font-semibold">
                            Done: {formatDateTime(job.completedAt)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 max-w-xs">{job.completionRemarks}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={job.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Upload & Remarks Modal */}
      <Modal
        isOpen={Boolean(completionModalBooking)}
        onClose={() => setCompletionModalBooking(null)}
        title={`Complete Job #${completionModalBooking?.bookingNumber}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Service Completion Proof Image (JPG/PNG) *
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="text-xs text-slate-600"
              />
              {completionFileName && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  ✓ Attached: {completionFileName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Technical Completion Remarks *
            </label>
            <textarea
              rows={3}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              className="input-field"
              placeholder="Enter parts serviced, test readings, and customer handover notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCompletionModalBooking(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                technicianUpdateJob(completionModalBooking.id, {
                  action: 'COMPLETE',
                  completionRemarks,
                  completionImageUrl:
                    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
                });
                setCompletionModalBooking(null);
              }}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm Job Completion
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

