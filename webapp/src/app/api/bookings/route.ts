import { NextResponse } from 'next/server';
import { runReasoning } from '@/lib/ai';
import { ensureRole } from '@/lib/auth';
import { createBookingRecord, listBookings } from '@/lib/repository';
import { validateBookingPayload } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const role = await ensureRole(['admin', 'operations']);
    const records = listBookings();
    return NextResponse.json({ role, records });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validated = validateBookingPayload(payload);
    const reasoning = runReasoning(validated);
    const record = createBookingRecord({
      status: 'acknowledged',
      roleOwner: validated.preferences.followUpByHuman ? 'operations' : 'automation',
      payload: validated,
      reasoning,
    });
    return NextResponse.json({ record });
  } catch (error) {
    console.error('booking error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'unexpected_error',
      },
      { status: 400 },
    );
  }
}
