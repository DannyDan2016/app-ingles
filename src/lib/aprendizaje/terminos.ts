import { terminoSchema } from '@/lib/contenido/esquema';

export function normalizarTermino(s: string): string | null {
  const t = s.normalize('NFC').replace(/[’‘]/g, "'").toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').replace(/\s+/g, ' ');
  return terminoSchema.safeParse(t).success ? t : null;
}
