/**
 * Cola secuencial de registro. Solo se reintenta cuando `enviar` lanza o rechaza (red, servidor).
 * Un `{ ok: false }` resuelto es un rechazo permanente: se descarta sin reintentar ni avisar.
 */
export function crearColaRegistro<T>(enviar: (x: T) => Promise<{ ok: boolean }>, opts: { reintentos?: number; esperaMs?: number; onFalloPersistente?: () => void } = {}) {
  const { reintentos = 3, esperaMs = 2000, onFalloPersistente } = opts;
  const cola: T[] = []; let activo = false;
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function procesar() {
    if (activo) return; activo = true;
    try {
      while (cola.length) {
        const x = cola[0]; let resuelto = false;
        for (let i = 0; i <= reintentos && !resuelto; i++) {
          if (i > 0) await dormir(esperaMs * i);
          try {
            const r = await enviar(x);
            resuelto = true;
            if (!r.ok) console.warn('cola-registro: envío rechazado de forma permanente; se descarta');
          } catch { /* transitorio: se reintenta */ }
        }
        cola.shift();
        if (!resuelto) {
          try { onFalloPersistente?.(); } catch { /* el aviso no debe frenar la cola */ }
        }
      }
    } finally {
      activo = false;
    }
  }
  return { encolar(x: T) { cola.push(x); void procesar(); }, pendientes: () => cola.length };
}
