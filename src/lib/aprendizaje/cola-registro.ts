export function crearColaRegistro<T>(enviar: (x: T) => Promise<{ ok: boolean }>, opts: { reintentos?: number; esperaMs?: number; onFalloPersistente?: () => void } = {}) {
  const { reintentos = 3, esperaMs = 2000, onFalloPersistente } = opts;
  const cola: T[] = []; let activo = false;
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function procesar() {
    if (activo) return; activo = true;
    while (cola.length) {
      const x = cola[0]; let ok = false;
      for (let i = 0; i <= reintentos && !ok; i++) {
        if (i > 0) await dormir(esperaMs * i);
        ok = await enviar(x).then((r) => r.ok, () => false);
      }
      cola.shift();
      if (!ok) onFalloPersistente?.();
    }
    activo = false;
  }
  return { encolar(x: T) { cola.push(x); void procesar(); }, pendientes: () => cola.length };
}
