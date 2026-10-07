import { and, between, count, eq } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { progress } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';

export async function completarItem(db: Db, userId: string, nivel: Nivel, itemId: string): Promise<'nuevo' | 'ya'> {
  const r = await db.insert(progress).values({ userId, nivel, leccionId: itemId }).onConflictDoNothing().returning({ id: progress.leccionId });
  return r.length ? 'nuevo' : 'ya';
}
export async function itemsCompletados(db: Db, userId: string, nivel: Nivel): Promise<Set<string>> {
  const filas = await db.select({ id: progress.leccionId }).from(progress).where(and(eq(progress.userId, userId), eq(progress.nivel, nivel)));
  return new Set(filas.map((f) => f.id));
}
export async function completadosEntre(db: Db, userId: string, desde: Date, hasta: Date): Promise<number> {
  const [r] = await db.select({ n: count() }).from(progress).where(and(eq(progress.userId, userId), between(progress.completadaAt, desde, hasta)));
  return r.n;
}
