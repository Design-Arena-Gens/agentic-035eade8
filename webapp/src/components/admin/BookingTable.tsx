'use client';

import { useMemo, useState } from 'react';
import type { AuditLogEntry, BookingRecord } from '@/lib/types';

type Role = 'admin' | 'operations';

type Props = {
  records: BookingRecord[];
  role: Role;
};

export function BookingTable({ records, role }: Props) {
  const [activeId, setActiveId] = useState<string | null>(records[0]?.id ?? null);
  const [localRecords, setLocalRecords] = useState(records);
  const activeRecord = useMemo(
    () => localRecords.find((record) => record.id === activeId) ?? null,
    [activeId, localRecords],
  );
  const [noteDraft, setNoteDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<BookingRecord['status'] | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitUpdate() {
    if (!activeRecord) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${activeRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusDraft || undefined,
          note: noteDraft || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? 'Failed to apply update');
      }

      const updated = (await response.json()) as { record: BookingRecord };
      setLocalRecords((prev) =>
        prev.map((record) => (record.id === updated.record.id ? updated.record : record)),
      );
      setNoteDraft('');
      setStatusDraft('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)]">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
            <tr>
              <th className="px-3 py-2 text-left">Intent</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Urgency</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {localRecords.map((record) => {
              const isActive = activeId === record.id;
              return (
                <tr
                  key={record.id}
                  onClick={() => setActiveId(record.id)}
                  className={`cursor-pointer transition ${
                    isActive ? 'bg-emerald-500/10 text-emerald-50' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {record.reasoning.intentLabel.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-white/50">{record.payload.contact.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-white/20 px-2 py-1 text-xs uppercase tracking-wide">
                      {record.roleOwner}
                    </span>
                  </td>
                  <td className="px-3 py-3 capitalize">
                    {record.payload.booking.urgency}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeRecord ? (
        <div className="flex flex-col gap-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-50">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-200/80">Intent</p>
              <h3 className="text-xl font-semibold text-white">
                {activeRecord.reasoning.intentLabel.replace(/_/g, ' ')}
              </h3>
            </div>
            <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs uppercase tracking-wider text-emerald-100">
              {Math.round(activeRecord.reasoning.confidence * 100)}% confidence
            </span>
          </header>
          <p className="text-emerald-100/90">{activeRecord.reasoning.summary}</p>
          <section className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-200/80">
              Recommended Actions
            </p>
            <ul className="mt-2 space-y-2 text-emerald-50/90">
              {activeRecord.reasoning.recommendedActions.map((action) => (
                <li key={action} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {action}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-emerald-200/80">
              Follow-up plan: {activeRecord.reasoning.followUpPlan}
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-black/30 p-4 text-slate-100/90">
            <h4 className="text-xs uppercase tracking-wide text-white/70">Audit Trail</h4>
            <ul className="mt-2 space-y-2">
              {activeRecord.auditTrail.map((event) => (
                <AuditLine key={event.id} event={event} />
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-white/15 bg-black/25 p-4 text-slate-100">
            <h4 className="text-xs uppercase tracking-wide text-white/70">
              Booking Envelope
            </h4>
            <div className="mt-2 space-y-1 text-xs text-white/70">
              <p>
                Contact: {activeRecord.payload.contact.firstName}{' '}
                {activeRecord.payload.contact.lastName} ·{' '}
                {activeRecord.payload.contact.preferredChannel.toUpperCase()}
              </p>
              <p>
                Window: {activeRecord.payload.booking.desiredDateStart}
                {activeRecord.payload.booking.desiredDateEnd
                  ? ` → ${activeRecord.payload.booking.desiredDateEnd}`
                  : ''}
              </p>
              <p>Location: {activeRecord.payload.booking.location ?? 'n/a'}</p>
            </div>
          </section>

          <div className="rounded-lg border border-white/15 bg-black/20 p-4 text-slate-100">
            <h4 className="text-xs uppercase tracking-wide text-white/70">Actions</h4>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-xs">
                <span>Status Override</span>
                <select
                  value={statusDraft}
                  onChange={(event) =>
                    setStatusDraft(event.target.value as BookingRecord['status'] | '')
                  }
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Keep Current ({activeRecord.status})</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_follow_up">In Follow-up</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs">
                <span>Timeline Note</span>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={2}
                  placeholder="Add decision or outreach reference..."
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </label>
              <button
                type="button"
                onClick={submitUpdate}
                disabled={loading || (!statusDraft && !noteDraft)}
                className="rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/5"
              >
                {loading ? 'Saving...' : role === 'admin' ? 'Apply Admin Update' : 'Submit Ops Update'}
              </button>
              {error && <p className="text-xs text-rose-300">{error}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-sm text-slate-100/80">
          Waiting for records...
        </div>
      )}
    </div>
  );
}

function AuditLine({ event }: { event: AuditLogEntry }) {
  return (
    <li className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/80">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-widest">
          {event.role}
        </span>
        <span>{new Date(event.timestamp).toLocaleString()}</span>
      </div>
      <p className="mt-1 font-semibold capitalize">{event.action.replace(/_/g, ' ')}</p>
      <p className="text-white/60">{event.details}</p>
    </li>
  );
}
