import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { generarIcs, NOMBRE_ICS } from '@/lib/recordatorio/ics';
import { parsearParametros } from '@/lib/recordatorio/parametros';

export async function GET(request: NextRequest) {
  const u = await getCurrentUser(); // sesión comprobada dentro del handler (el proxy solo mira la cookie)
  if (!u) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });
  const p = parsearParametros(request.nextUrl.searchParams);
  if (!p.ok) return NextResponse.json({ error: 'parametros_invalidos' }, { status: 400 });
  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;
  return new NextResponse(generarIcs(p.valor, { appUrl, ahora: new Date() }), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${NOMBRE_ICS}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
