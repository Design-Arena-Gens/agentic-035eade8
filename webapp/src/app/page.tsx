import { BookingForm } from '@/components/BookingForm';
import { listBookings } from '@/lib/repository';
import type { BookingRecord } from '@/lib/types';

function generateSnapshot(records: BookingRecord[]) {
  const total = records.length;
  const urgent = records.filter((record) => record.payload.booking.urgency === 'urgent').length;
  const humanOwned = records.filter((record) => record.roleOwner !== 'automation').length;
  const automationOwned = total - humanOwned;

  return {
    total,
    urgent,
    humanOwned,
    automationOwned,
  };
}

export default function Home() {
  const records = listBookings();
  const snapshot = generateSnapshot(records);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              Unified Intake Grid
            </h2>
            <p className="text-sm text-slate-300/80">
              Deterministic pipeline connecting capture → reasoning → action with full traceability.
            </p>
          </div>
          <div className="flex gap-3 text-xs text-emerald-200">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1">
              {snapshot.total} records
            </span>
            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1">
              {snapshot.urgent} urgent
            </span>
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1">
              {snapshot.humanOwned} human-led
            </span>
            <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1">
              {snapshot.automationOwned} autonomous
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Structured Capture',
              description:
                'Normalize data from web, email, and WhatsApp with schema-first validation and audit-locked mapping.',
            },
            {
              title: 'AI Reasoning Layer',
              description:
                'Intent labeling, personalization, and action plans produced deterministically without external dependencies.',
            },
            {
              title: 'Ops Ready',
              description:
                'Role based access, traceable timelines, and live confirmation feeds keep administrators in control.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200/80"
            >
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
      <BookingForm />
    </div>
  );
}
