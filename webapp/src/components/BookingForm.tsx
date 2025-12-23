'use client';

import { useMemo, useState, useTransition } from 'react';
import clsx from 'clsx';
import type { BookingRecord } from '@/lib/types';

type ProgressStage = {
  label: string;
  status: 'pending' | 'active' | 'complete';
};

type SubmissionResult = {
  record: BookingRecord | null;
  error: string | null;
};

const defaultStageLabels = [
  'Validating intake data',
  'Reasoning over preferences',
  'Persisting audit trail',
  'Dispatching confirmation',
];

const initialFormState = {
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    preferredChannel: 'email' as const,
  },
  booking: {
    serviceCategory: 'accommodation' as const,
    desiredDateStart: '',
    desiredDateEnd: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: '',
    partySize: '',
    budgetLevel: 'standard' as const,
    urgency: 'soon' as const,
  },
  notes: {
    intentNarrative: '',
    specialRequests: '',
    operationsNotes: '',
    tags: '',
  },
  channelMeta: {
    inboundChannel: 'web' as const,
    leadSource: 'direct-site',
  },
  preferences: {
    followUpByHuman: true,
    requiresSupervisor: false,
    multiChannelBroadcast: false,
    notifications: {
      email: true,
      sms: false,
      whatsapp: false,
    },
  },
};

export function BookingForm() {
  const [form, setForm] = useState(initialFormState);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<ProgressStage[]>(
    defaultStageLabels.map((label, index) => ({
      label,
      status: index === 0 ? 'active' : 'pending',
    })),
  );
  const [result, setResult] = useState<SubmissionResult>({
    record: null,
    error: null,
  });

  const tagsArray = useMemo(
    () =>
      form.notes.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.notes.tags],
  );

  function updateStage(stepIndex: number) {
    setProgress((prev) =>
      prev.map((stage, index) => {
        if (index < stepIndex) {
          return { ...stage, status: 'complete' };
        }
        if (index === stepIndex) {
          return { ...stage, status: 'active' };
        }
        return { ...stage, status: 'pending' };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult({ record: null, error: null });
    updateStage(0);

    const payload = {
      contact: {
        ...form.contact,
        phone: form.contact.phone || undefined,
        organization: form.contact.organization || undefined,
      },
      booking: {
        serviceCategory: form.booking.serviceCategory,
        desiredDateStart: form.booking.desiredDateStart,
        desiredDateEnd: form.booking.desiredDateEnd || undefined,
        timezone: form.booking.timezone,
        location: form.booking.location || undefined,
        partySize: form.booking.partySize ? Number(form.booking.partySize) : undefined,
        budgetLevel: form.booking.budgetLevel,
        urgency: form.booking.urgency,
      },
      preferences: {
        followUpByHuman: form.preferences.followUpByHuman,
        requiresSupervisor: form.preferences.requiresSupervisor,
        multiChannelBroadcast: form.preferences.multiChannelBroadcast,
        notifications: Object.entries(form.preferences.notifications)
          .filter(([, value]) => value)
          .map(([key]) => key as 'email' | 'sms' | 'whatsapp'),
      },
      notes: {
        intentNarrative: form.notes.intentNarrative || undefined,
        specialRequests: form.notes.specialRequests || undefined,
        operationsNotes: form.notes.operationsNotes || undefined,
        tags: tagsArray,
      },
      channelMeta: {
        inboundChannel: form.channelMeta.inboundChannel,
        leadSource: form.channelMeta.leadSource,
      },
    };

    startTransition(async () => {
      try {
        updateStage(1);
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error ?? 'Failed to submit booking');
        }

        updateStage(2);
        const body = (await response.json()) as { record: BookingRecord };
        updateStage(3);
        setResult({ record: body.record, error: null });
        setForm(initialFormState);
      } catch (error) {
        setResult({
          record: null,
          error: error instanceof Error ? error.message : 'Unexpected error',
        });
      } finally {
        setTimeout(() => {
          setProgress(
            defaultStageLabels.map((label, index) => ({
              label,
              status: index === 0 ? 'active' : 'pending',
            })),
          );
        }, 2500);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur"
      >
        <div>
          <h2 className="text-lg font-semibold text-white md:text-xl">
            Intake & Preference Capture
          </h2>
          <p className="text-sm text-slate-300/80">
            Collect consistent, structured inputs across channels with deterministic mapping applied end to end.
          </p>
        </div>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            Contact Profile
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="First Name"
              required
              value={form.contact.firstName}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, contact: { ...prev.contact, firstName: value } }))
              }
            />
            <Input
              label="Last Name"
              required
              value={form.contact.lastName}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, contact: { ...prev.contact, lastName: value } }))
              }
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.contact.email}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }))
              }
            />
            <Input
              label="Phone"
              value={form.contact.phone}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, contact: { ...prev.contact, phone: value } }))
              }
            />
            <Input
              label="Organization"
              value={form.contact.organization}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, organization: value },
                }))
              }
            />
            <Select
              label="Preferred Channel"
              value={form.contact.preferredChannel}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    preferredChannel: value as typeof prev.contact.preferredChannel,
                  },
                }))
              }
              options={[
                { label: 'Email', value: 'email' },
                { label: 'Web', value: 'web' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'Phone', value: 'phone' },
              ]}
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">
            Booking Intent
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Service Category"
              value={form.booking.serviceCategory}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: {
                    ...prev.booking,
                    serviceCategory: value as typeof prev.booking.serviceCategory,
                  },
                }))
              }
              options={[
                { label: 'Accommodation', value: 'accommodation' },
                { label: 'Event', value: 'event' },
                { label: 'Transport', value: 'transport' },
                { label: 'Consultation', value: 'consultation' },
                { label: 'Other', value: 'other' },
              ]}
            />
            <Select
              label="Budget"
              value={form.booking.budgetLevel}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: {
                    ...prev.booking,
                    budgetLevel: value as typeof prev.booking.budgetLevel,
                  },
                }))
              }
              options={[
                { label: 'Value', value: 'value' },
                { label: 'Standard', value: 'standard' },
                { label: 'Premium', value: 'premium' },
                { label: 'Luxury', value: 'luxury' },
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              required
              value={form.booking.desiredDateStart}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: { ...prev.booking, desiredDateStart: value },
                }))
              }
            />
            <Input
              label="End Date"
              type="date"
              value={form.booking.desiredDateEnd}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: { ...prev.booking, desiredDateEnd: value },
                }))
              }
            />
            <Input
              label="Timezone"
              required
              value={form.booking.timezone}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: { ...prev.booking, timezone: value },
                }))
              }
            />
            <Input
              label="Location"
              value={form.booking.location}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: { ...prev.booking, location: value },
                }))
              }
            />
            <Input
              label="Party Size"
              type="number"
              min={1}
              value={form.booking.partySize}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: { ...prev.booking, partySize: value },
                }))
              }
            />
            <Select
              label="Urgency"
              value={form.booking.urgency}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  booking: {
                    ...prev.booking,
                    urgency: value as typeof prev.booking.urgency,
                  },
                }))
              }
              options={[
                { label: 'Flexible', value: 'flexible' },
                { label: 'Soon', value: 'soon' },
                { label: 'Urgent', value: 'urgent' },
              ]}
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-200">
            Preference Orchestration
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle
              label="Human follow-up required"
              value={form.preferences.followUpByHuman}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, followUpByHuman: value },
                }))
              }
            />
            <Toggle
              label="Supervisor escalation"
              value={form.preferences.requiresSupervisor}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, requiresSupervisor: value },
                }))
              }
            />
            <Toggle
              label="Broadcast to multi-channel agents"
              value={form.preferences.multiChannelBroadcast}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, multiChannelBroadcast: value },
                }))
              }
            />
          </div>
          <fieldset className="rounded-lg border border-white/10 p-3">
            <legend className="px-2 text-xs uppercase tracking-wide text-white/70">
              Notification Channels
            </legend>
            <div className="flex flex-wrap gap-4">
              {(['email', 'sms', 'whatsapp'] as const).map((channel) => (
                <label key={channel} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.preferences.notifications[channel]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            [channel]: event.target.checked,
                          },
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-transparent text-emerald-400 focus:ring-emerald-400"
                  />
                  {channel.toUpperCase()}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-200">
            Narrative & Ops Notes
          </h3>
          <div className="grid gap-4">
            <Textarea
              label="Intent Narrative"
              value={form.notes.intentNarrative}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  notes: { ...prev.notes, intentNarrative: value },
                }))
              }
              placeholder="Add any free-form description for the AI reasoner"
            />
            <Textarea
              label="Special Requests"
              value={form.notes.specialRequests}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  notes: { ...prev.notes, specialRequests: value },
                }))
              }
            />
            <Textarea
              label="Operations Notes"
              value={form.notes.operationsNotes}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  notes: { ...prev.notes, operationsNotes: value },
                }))
              }
            />
            <Input
              label="Tags"
              value={form.notes.tags}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  notes: { ...prev.notes, tags: value },
                }))
              }
              placeholder="vip, eco-friendly, travel"
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
            Channel Metadata
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Inbound Channel"
              value={form.channelMeta.inboundChannel}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  channelMeta: {
                    ...prev.channelMeta,
                    inboundChannel: value as typeof prev.channelMeta.inboundChannel,
                  },
                }))
              }
              options={[
                { label: 'Web', value: 'web' },
                { label: 'Email', value: 'email' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'Phone', value: 'phone' },
              ]}
            />
            <Input
              label="Lead Source"
              required
              value={form.channelMeta.leadSource}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  channelMeta: { ...prev.channelMeta, leadSource: value },
                }))
              }
              placeholder="campaign-2024-q4"
            />
          </div>
        </section>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
          disabled={isPending}
        >
          {isPending ? 'Processing' : 'Launch AI Reasoner'}
        </button>
        {result.error && (
          <p className="text-sm text-rose-300">
            {result.error}
          </p>
        )}
      </form>

      <aside className="flex flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-inner shadow-emerald-400/20">
          <h2 className="text-lg font-semibold text-white">Real-Time Confirmation</h2>
          <p className="mb-4 text-sm text-slate-200/80">
            Deterministic agent log showing the current step executing for this intake.
          </p>
          <ol className="space-y-3">
            {progress.map((stage) => (
              <li
                key={stage.label}
                className={clsx(
                  'rounded-xl border px-4 py-3 text-sm',
                  stage.status === 'complete' && 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
                  stage.status === 'active' && 'border-sky-400/40 bg-sky-500/10 text-sky-200',
                  stage.status === 'pending' && 'border-white/10 bg-white/5 text-slate-300/70',
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{stage.label}</span>
                  <span className="text-xs uppercase tracking-wider">
                    {stage.status === 'complete'
                      ? 'complete'
                      : stage.status === 'active'
                        ? 'running'
                        : 'pending'}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {result.record && (
          <ConfirmationCard record={result.record} />
        )}
      </aside>
    </div>
  );
}

function Input({
  label,
  onChange,
  value,
  type = 'text',
  placeholder,
  required,
  min,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-white/70">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-white/70">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-white/70">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={clsx(
        'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition',
        value
          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
          : 'border-white/10 bg-white/5 text-slate-300/80 hover:border-white/20',
      )}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-widest">
        {value ? 'enabled' : 'disabled'}
      </span>
    </button>
  );
}

function ConfirmationCard({ record }: { record: BookingRecord }) {
  return (
    <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-sm text-emerald-100 shadow-lg shadow-emerald-500/20">
      <header className="mb-4">
        <span className="text-xs uppercase tracking-wide text-emerald-200/80">
          AI Response
        </span>
        <h3 className="text-lg font-semibold text-white">
          {record.reasoning.intentLabel.replace(/_/g, ' ')}
        </h3>
        <p className="text-emerald-200/80">
          Confidence {Math.round(record.reasoning.confidence * 100)}%
        </p>
      </header>
      <p className="mb-4 text-emerald-50/90">{record.reasoning.summary}</p>
      <p className="mb-4 text-emerald-50/80">
        {record.reasoning.personalization}
      </p>
      <ul className="mb-4 space-y-2">
        {record.reasoning.recommendedActions.map((action) => (
          <li key={action} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <p className="text-emerald-100/80">
        Follow-up: {record.reasoning.followUpPlan}
      </p>
      <footer className="mt-6 text-xs text-emerald-100/70">
        Record ID {record.id} · Owner {record.roleOwner.toUpperCase()}
      </footer>
    </section>
  );
}
