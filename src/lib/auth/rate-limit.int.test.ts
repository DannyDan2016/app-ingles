import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { clearFailures, countRecentFailures, recordRegistrationFailure } from './rate-limit';

const now = new Date('2026-10-10T12:00:00Z');

beforeEach(() => resetDb());
afterAll(() => testPool.end());

describe('registro vs. alias real "registro"', () => {
  it('los fallos de registro no cuentan como fallos del usuario "registro"', async () => {
    for (let i = 0; i < 5; i++) await recordRegistrationFailure(testDb, '9.9.9.9', now);
    const c = await countRecentFailures(testDb, 'registro', 'otro-hash', now);
    expect(c.alias).toBe(0);
  });
  it('clearFailures("registro") (login correcto) no borra los fallos de registro', async () => {
    await recordRegistrationFailure(testDb, '9.9.9.9', now);
    await clearFailures(testDb, 'registro');
    const { loginAttempts } = await import('@/lib/db/schema');
    expect(await testDb.select().from(loginAttempts)).toHaveLength(1);
  });
});
