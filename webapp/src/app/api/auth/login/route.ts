import { NextResponse } from 'next/server';
import { ROLE_COOKIE, resolveRoleFromPasscode, sessionCookieConfig } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const passcode = typeof body?.passcode === 'string' ? body.passcode : '';
    const role = resolveRoleFromPasscode(passcode);
    if (!role) {
      return NextResponse.json({ error: 'invalid_passcode' }, { status: 401 });
    }
    const response = NextResponse.json({ role });
    response.cookies.set(ROLE_COOKIE, role, sessionCookieConfig);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'unexpected_error' },
      { status: 400 },
    );
  }
}
