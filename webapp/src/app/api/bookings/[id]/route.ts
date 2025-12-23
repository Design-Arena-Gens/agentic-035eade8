import { NextResponse } from 'next/server';
import { ensureRole } from '@/lib/auth';
import { appendAudit, getBookingById, updateBookingStatus } from '@/lib/repository';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await ensureRole(['admin', 'operations']);
    const booking = getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ record: booking });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const role = await ensureRole(['admin', 'operations']);
    const updates = await request.json();
    const booking = getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (updates.status && updates.status !== booking.status) {
      updateBookingStatus({
        bookingId: booking.id,
        status: updates.status,
        roleOwner: role === 'admin' ? 'admin' : booking.roleOwner,
      });
    }
    if (updates.note) {
      appendAudit(booking.id, {
        timestamp: new Date().toISOString(),
        actor: role === 'admin' ? 'admin' : 'assistant',
        role: role === 'admin' ? 'admin' : 'operations',
        action: 'note_appended',
        details: updates.note,
      });
    }
    const refreshed = getBookingById(booking.id);
    return NextResponse.json({ record: refreshed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'unexpected_error' },
      { status: 400 },
    );
  }
}
