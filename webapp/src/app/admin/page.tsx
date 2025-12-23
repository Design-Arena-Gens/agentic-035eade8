import { redirect } from 'next/navigation';
import { getSessionRole } from '@/lib/auth';
import { listBookings, listRecentAudits } from '@/lib/repository';
import type { AuditLogEntry, BookingRecord } from '@/lib/types';
import { BookingTable } from '@/components/admin/BookingTable';
import { AuditLogFeed } from '@/components/admin/AuditLogFeed';

function computeSLA(records: BookingRecord[]) {
  const urgent = records.filter((record) => record.payload.booking.urgency === 'urgent');
  const automationShare =
    records.filter((record) => record.roleOwner === 'automation').length / Math.max(records.length, 1);

  return {
    total: records.length,
    urgent: urgent.length,
    automationShare: Math.round(automationShare * 100),
    lastRecordAt: records[0]?.createdAt ?? null,
  };
}

export default async function AdminPage() {
  const role = await getSessionRole();
  if (!role) {
    redirect('/admin/login');
  }

  const bookings = listBookings();
  const audits = listRecentAudits(40);
  const sla = computeSLA(bookings);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Operations Command</h1>
          <p className="text-sm text-slate-300/80">
            {role === 'admin'
              ? 'Full administrative control with override access.'
              : 'Operations console with ability to progress and annotate intents.'}
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-rose-300 hover:bg-rose-500/20"
          >
            Sign Out
          </button>
        </form>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Open Records" value={String(sla.total)} />
        <StatCard label="Urgent" value={String(sla.urgent)} tone="warning" />
        <StatCard label="Automation Coverage" value={`${sla.automationShare}%`} tone="sky" />
        <StatCard label="Last Intake" value={sla.lastRecordAt ? new Date(sla.lastRecordAt).toLocaleString() : 'n/a'} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Current Bookings</h2>
              <p className="text-sm text-slate-300/80">Click a row to inspect the reasoning layer and append decisions.</p>
            </div>
          </div>
          <BookingTable records={bookings} role={role} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-6">
          <h2 className="text-lg font-semibold text-white">Audit Chronicle</h2>
          <p className="text-sm text-slate-300/80">
            Immutable evidence of every agent, admin, or automation action with timestamps.
          </p>
          <AuditLogFeed events={audits as AuditLogEntry[]} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'emerald',
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'warning' | 'sky';
}) {
  const toneStyles =
    tone === 'emerald'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
      : tone === 'warning'
        ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
        : 'border-sky-400/30 bg-sky-500/10 text-sky-100';

  return (
    <div className={`rounded-xl border p-4 text-sm ${toneStyles}`}>
      <span className="text-xs uppercase tracking-wide opacity-75">{label}</span>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
