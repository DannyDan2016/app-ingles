import { pgTable, uuid, text, timestamp, pgEnum, index, primaryKey } from 'drizzle-orm/pg-core';

export const rolEnum = pgEnum('rol', ['admin', 'aprendiz']);
export const nivelEnum = pgEnum('nivel', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  alias: text('alias').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  rol: rolEnum('rol').notNull().default('aprendiz'),
  nivelInicial: nivelEnum('nivel_inicial'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

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

export const sessions = pgTable('sessions', {
  idHash: text('id_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiraAt: ts('expira_at').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    alias: text('alias').notNull(),
    ipHash: text('ip_hash').notNull(),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [index('login_attempts_alias_at').on(t.alias, t.at), index('login_attempts_ip_at').on(t.ipHash, t.at)],
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
