import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { invites, users } from '@/lib/db/schema';
import { generateToken, hashToken } from './tokens';
import { hashPassword, validatePasswordPolicy } from './password';
import { normalizeAlias } from './alias';

export const INVITE_TTL_DAYS = 7;
export type InviteState = 'valida' | 'inexistente' | 'usada' | 'caducada' | 'revocada';

type InviteLike = { expiraAt: Date; usadoAt: Date | null; revocadoAt: Date | null };

export function evaluateInvite(inv: InviteLike | null, now: Date): InviteState {
  if (!inv) return 'inexistente';
  if (inv.revocadoAt) return 'revocada';
  if (inv.usadoAt) return 'usada';
  if (inv.expiraAt.getTime() <= now.getTime()) return 'caducada';
  return 'valida';
}

export async function createInvite(db: Db, adminId: string, now: Date) {
  const code = generateToken();
  const expiraAt = new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000);
  const [row] = await db
    .insert(invites)
    .values({ codeHash: hashToken(code), creadoPor: adminId, expiraAt, createdAt: now })
    .returning({ id: invites.id });
  return { id: row.id, code, expiraAt };
}

export async function revokeInvite(db: Db, id: string, now: Date) {
  await db.update(invites).set({ revocadoAt: now }).where(eq(invites.id, id));
}

export function listInvites(db: Db) {
  return db
    .select({
      id: invites.id,
      expiraAt: invites.expiraAt,
      usadoAt: invites.usadoAt,
      revocadoAt: invites.revocadoAt,
      createdAt: invites.createdAt,
    })
    .from(invites)
    .orderBy(desc(invites.createdAt));
}

export async function checkInviteCode(db: Db, code: string, now: Date): Promise<InviteState> {
  const [inv] = await db.select().from(invites).where(eq(invites.codeHash, hashToken(code)));
  return evaluateInvite(inv ?? null, now);
}

type RegisterError = InviteState | 'alias_invalido' | 'alias_ocupado' | 'muy_corta' | 'muy_larga';

export async function registerWithInvite(
  db: Db,
  input: { code: string; alias: string; password: string },
  now: Date,
): Promise<{ ok: true; userId: string } | { ok: false; error: RegisterError }> {
  const a = normalizeAlias(input.alias);
  if (!a.ok) return { ok: false, error: a.error };
  const p = validatePasswordPolicy(input.password);
  if (!p.ok) return { ok: false, error: p.error };
  const passwordHash = await hashPassword(input.password); // fuera de la transacción: es lento

  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invites).where(eq(invites.codeHash, hashToken(input.code))).for('update');
    const state = evaluateInvite(inv ?? null, now);
    if (state !== 'valida') return { ok: false as const, error: state };
    const [taken] = await tx.select({ id: users.id }).from(users).where(eq(users.alias, a.alias));
    if (taken) return { ok: false as const, error: 'alias_ocupado' as const };
    const [u] = await tx.insert(users).values({ alias: a.alias, passwordHash }).returning({ id: users.id });
    await tx.update(invites).set({ usadoPor: u.id, usadoAt: now }).where(eq(invites.id, inv!.id));
    return { ok: true as const, userId: u.id };
  });
}
