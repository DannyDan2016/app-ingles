import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { datosExportacion } from '@/lib/exportar/exportar.repo';
import { nombreArchivo, serializarProgreso } from '@/lib/exportar/serializar';

export async function GET() {
  const u = await getCurrentUser(); // sesión comprobada dentro del handler (el proxy solo mira la cookie)
  if (!u) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });
  const datos = await datosExportacion(getDb(), u.userId);
  if (!datos) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });
  const ahora = new Date();
  return new NextResponse(JSON.stringify(serializarProgreso(datos, ahora), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreArchivo(ahora)}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
