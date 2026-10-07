import { pgTable, uuid, text, timestamp, pgEnum, index, primaryKey, smallint, integer, boolean, date, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const rolEnum = pgEnum('rol', ['admin', 'aprendiz']);
export const nivelEnum = pgEnum('nivel', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const origenEnum = pgEnum('origen_respuesta', ['leccion', 'tramo', 'repaso']);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  alias: text('alias').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  rol: rolEnum('rol').notNull().default('aprendiz'),
  nivelInicial: nivelEnum('nivel_inicial'),
  createdAt: ts('created_at').notNull().defaultNow(),
  metaDiariaMin: smallint('meta_diaria_min').notNull().default(10),
}, (t) => [check('users_meta_diaria', sql`${t.metaDiariaMin} in (5, 10, 15)`)]);

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeHash: text('code_hash').notNull().unique(),
  creadoPor: uuid('creado_por').notNull().references(() => users.id),
  expiraAt: ts('expira_at').notNull(),
  usadoPor: uuid('usado_por').references(() => users.id),
  usadoAt: ts('usado_at'),
  revocadoAt: ts('revocado_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    idHash: text('id_hash').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiraAt: ts('expira_at').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('sessions_expira_at').on(t.expiraAt)],
);

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    alias: text('alias').notNull(),
    ipHash: text('ip_hash').notNull(),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [index('login_attempts_alias_at').on(t.alias, t.at), index('login_attempts_ip_at').on(t.ipHash, t.at), index('login_attempts_at').on(t.at)],
);

export const progress = pgTable(
  'progress',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    nivel: nivelEnum('nivel').notNull(),
    leccionId: text('leccion_id').notNull(),
    completadaAt: ts('completada_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.leccionId] })],
);

export const respuestas = pgTable(
  'respuestas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    correcta: boolean('correcta').notNull(),
    origen: origenEnum('origen').notNull(),
    /** Solo repaso: caja ANTES de responder (1-5). */
    caja: smallint('caja'),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [index('respuestas_user_at').on(t.userId, t.at)],
);

export const tarjetas = pgTable(
  'tarjetas',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    termino: text('termino').notNull(),
    nivel: nivelEnum('nivel').notNull(),
    caja: smallint('caja').notNull().default(1),
    proximaAt: ts('proxima_at').notNull(),
    ultimaAt: ts('ultima_at'),
    aciertos: integer('aciertos').notNull().default(0),
    fallos: integer('fallos').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.termino, t.nivel] }),
    index('tarjetas_user_proxima').on(t.userId, t.proximaAt),
    check('tarjetas_caja', sql`${t.caja} between 1 and 5`),
  ],
);

export const actividadDiaria = pgTable(
  'actividad_diaria',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    segundos: integer('segundos').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.fecha] }), check('actividad_segundos', sql`${t.segundos} between 0 and 14400`)],
);
