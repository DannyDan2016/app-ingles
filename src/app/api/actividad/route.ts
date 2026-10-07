import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { sumarActividad } from '@/lib/aprendizaje/actividad.repo';
import { diaBogota } from '@/lib/tiempo/bogota';
import { mismoOrigen } from '@/lib/security/origen';

const cuerpo = z.object({ segundos: z.number().int().min(1).max(600) });

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const sec = req.headers.get('sec-fetch-site');
  const propios = [req.nextUrl.origin, process.env.APP_URL].filter((x): x is string => !!x);
  if (!propios.some((p) => mismoOrigen(origin, sec, p))) {
    return NextResponse.json({ error: 'origen' }, { status: 403 });
  }
  const u = await getCurrentUser(); // sesión comprobada dentro del handler (el proxy solo mira la cookie)
  if (!u) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const p = cuerpo.safeParse(json);
  if (!p.success) return NextResponse.json({ error: 'datos' }, { status: 400 });
  await sumarActividad(getDb(), u.userId, diaBogota(new Date()), p.data.segundos);
  return new NextResponse(null, { status: 204 });
}
