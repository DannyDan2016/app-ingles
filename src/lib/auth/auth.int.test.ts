import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, sessions } from '@/lib/db/schema';
import { hashPassword } from './password';
import { createSession, validateSession, deleteSession } from './sessions';
import { login } from './login';

const now = new Date('2026-10-10T12:00:00Z');
const min = (m: number) => new Date(now.getTime() + m * 60_000);
let userId: string;

beforeEach(async () => {
  await resetDb();
  const [u] = await testDb.insert(users).values({ alias: 'ana', passwordHash: await hashPassword('una-clave-larga') }).returning();
  userId = u.id;
});
afterAll(() => testPool.end());

describe('sesiones', () => {
  it('guarda solo el hash y valida el token durante 30 días', async () => {
    const s = await createSession(testDb, userId, now);
    const [row] = await testDb.select().from(sessions);
    expect(row.idHash).not.toBe(s.token);
    expect((await validateSession(testDb, s.token, now))?.alias).toBe('ana');
    expect(await validateSession(testDb, s.token, new Date(now.getTime() + 30 * 86_400_000))).toBeNull();
  });
  it('token desconocido o borrado → null', async () => {
    expect(await validateSession(testDb, 'desconocido', now)).toBeNull();
    const s = await createSession(testDb, userId, now);
    await deleteSession(testDb, s.token);
    expect(await validateSession(testDb, s.token, now)).toBeNull();
  });
  it('usuario borrado invalida su sesión', async () => {
    const s = await createSession(testDb, userId, now);
    await testDb.delete(users).where(eq(users.id, userId));
    expect(await validateSession(testDb, s.token, now)).toBeNull();
  });
});

describe('login', () => {
  it('credenciales correctas → token; alias con mayúsculas también', async () => {
    const r = await login(testDb, { alias: 'ANA', password: 'una-clave-larga', ip: '1.1.1.1' }, now);
    expect(r.ok).toBe(true);
  });
  it('alias inexistente y contraseña mala devuelven el mismo error', async () => {
    expect(await login(testDb, { alias: 'nadie', password: 'x', ip: '1.1.1.1' }, now)).toEqual({ ok: false, error: 'credenciales' });
    expect(await login(testDb, { alias: 'ana', password: 'mala-clave-xx', ip: '1.1.1.1' }, now)).toEqual({ ok: false, error: 'credenciales' });
  });
  it('alias inválido ("a b") devuelve credenciales y cuenta como fallo', async () => {
    expect(await login(testDb, { alias: 'a b', password: 'una-clave-larga', ip: '1.1.1.1' }, now)).toEqual({ ok: false, error: 'credenciales' });
  });
  it('5 fallos en 15 min bloquean incluso con la clave correcta, y se libera pasada la ventana', async () => {
    for (let i = 0; i < 5; i++) await login(testDb, { alias: 'ana', password: 'mala-clave-xx', ip: '1.1.1.1' }, min(i));
    expect(await login(testDb, { alias: 'ana', password: 'una-clave-larga', ip: '2.2.2.2' }, min(5))).toEqual({ ok: false, error: 'bloqueado' });
    expect((await login(testDb, { alias: 'ana', password: 'una-clave-larga', ip: '2.2.2.2' }, min(20))).ok).toBe(true);
  });
  it('login correcto limpia los fallos del alias', async () => {
    for (let i = 0; i < 4; i++) await login(testDb, { alias: 'ana', password: 'mala-clave-xx', ip: '1.1.1.1' }, now);
    await login(testDb, { alias: 'ana', password: 'una-clave-larga', ip: '1.1.1.1' }, now);
    await login(testDb, { alias: 'ana', password: 'mala-clave-xx', ip: '1.1.1.1' }, now);
    expect((await login(testDb, { alias: 'ana', password: 'una-clave-larga', ip: '1.1.1.1' }, now)).ok).toBe(true);
  });
});
