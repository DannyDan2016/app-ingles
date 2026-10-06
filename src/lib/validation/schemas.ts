import { z } from 'zod';
import { NIVELES } from '@/lib/progreso/niveles';

// La política de longitud de la contraseña vive en lib/auth/password; aquí solo se acota el tamaño al entrar.
const texto = z.string();
const inviteCode = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const loginSchema = z.object({ alias: texto, password: z.string().max(128) });
export const registroSchema = z.object({ code: inviteCode, alias: texto, password: texto });
export const nivelSchema = z.enum(NIVELES);
export const revocarSchema = z.object({ id: z.uuid() });

/** Código de invitación de `?c=`: devuelve null si falta, es un array o está mal formado. */
export function parseInviteCode(value: unknown): string | null {
  const r = inviteCode.safeParse(value);
  return r.success ? r.data : null;
}

const MENSAJES_REGISTRO: Record<string, string> = {
  inexistente: 'La invitación no es válida.',
  usada: 'Esta invitación ya se usó.',
  caducada: 'La invitación caducó. Pide una nueva.',
  revocada: 'La invitación no es válida.',
  alias_invalido: 'El usuario debe tener de 3 a 20 caracteres: letras, números o guion bajo.',
  alias_ocupado: 'Ese usuario ya existe. Elige otro.',
  muy_corta: 'La contraseña debe tener al menos 12 caracteres.',
  muy_larga: 'La contraseña no puede superar 128 caracteres.',
};

export const MENSAJE_REGISTRO_GENERICO = 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.';

export function mensajeRegistro(error: string): string {
  return MENSAJES_REGISTRO[error] ?? MENSAJE_REGISTRO_GENERICO;
}
