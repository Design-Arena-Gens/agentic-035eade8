'use client';

import type { AuditLogEntry } from '@/lib/types';

export function AuditLogFeed({ events }: { events: AuditLogEntry[] }) {
  return (
    <div className="mt-4 space-y-3 text-sm text-white/80">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">
              {event.role}
            </span>
            <span className="text-white/50">{new Date(event.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="mt-2 text-white/90 font-semibold">
            {event.action.replace(/_/g, ' ')}
          </p>
          <p className="text-white/65">{event.details}</p>
        </div>
      ))}
    </div>
  );
}
