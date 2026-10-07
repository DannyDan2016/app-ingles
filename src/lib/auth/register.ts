import type { Db } from '@/lib/db/client';
import { registerWithInvite } from './invites';
import { maybePurgeStale, type PurgeOpts } from './purge';
import { isRegistrationBlocked, recordRegistrationFailure } from './rate-limit';

type Input = { code: string; alias: string; password: string; ip: string };
type Result = Awaited<ReturnType<typeof registerWithInvite>> | { ok: false; error: 'bloqueado' };

/** Registro con límite por IP: los intentos fallidos cuentan y, al llegar al máximo, ni se mira la invitación. */
export async function registerLimited(db: Db, { ip, ...input }: Input, now: Date, opts: { purge?: PurgeOpts } = {}): Promise<Result> {
  if (await isRegistrationBlocked(db, ip, now)) return { ok: false, error: 'bloqueado' };
  const r = await registerWithInvite(db, input, now);
  if (!r.ok) {
    await recordRegistrationFailure(db, ip, now);
    await maybePurgeStale(db, now, opts.purge);
  }
  return r;
}
