import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === req.headers.get('host');
    } catch {
      /* recusa */
    }
    if (!ok) {
      return NextResponse.json({ message: 'Pedido recusado.' }, { status: 403 });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}