'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const roleLabels: Record<'admin' | 'operations', string> = {
  admin: 'Administrator',
  operations: 'Operations',
};

export function LoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? 'Login failed');
      }

      const body = (await response.json()) as { role: 'admin' | 'operations' };
      router.replace('/admin');
      router.refresh();
      setPasscode('');
      setError(null);
      alert(`Authenticated as ${roleLabels[body.role]}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur"
    >
      <div>
        <h1 className="text-2xl font-semibold text-white">Role Access</h1>
        <p className="text-sm text-slate-300/80">
          Use a temporary passcode to assume admin or operations responsibility across the booking grid.
        </p>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="text-xs uppercase tracking-wide text-white/70">Access Token</span>
        <input
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="ADMIN-ACCESS-2024"
          required
        />
      </label>
      <button
        type="submit"
        className="rounded-xl bg-emerald-400/90 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
        disabled={loading}
      >
        {loading ? 'Validating' : 'Authenticate'}
      </button>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
}
