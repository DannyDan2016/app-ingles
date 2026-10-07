'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const RUTAS = [/^\/leccion\//, /^\/repaso$/, /^\/escuchar\/.+/];
const INACTIVO_MS = 60_000;
const ENVIO_MS = 120_000;

export function MedidorActividad() {
  const ruta = usePathname();
  const acumulado = useRef(0);
  const ultimaInteraccion = useRef(0);
  const medir = RUTAS.some((r) => r.test(ruta));

  useEffect(() => {
    const enviar = (beacon: boolean) => {
      const segundos = Math.min(600, Math.round(acumulado.current));
      if (segundos < 1) return;
      acumulado.current = 0;
      const body = JSON.stringify({ segundos });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/actividad', new Blob([body], { type: 'application/json' }));
      else void fetch('/api/actividad', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
    };
    const tocar = () => { ultimaInteraccion.current = Date.now(); };
    tocar(); // entrar a la pantalla cuenta como interacción
    const tic = setInterval(() => {
      if (medir && document.visibilityState === 'visible' && Date.now() - ultimaInteraccion.current < INACTIVO_MS) acumulado.current += 1;
    }, 1000);
    const lote = setInterval(() => enviar(false), ENVIO_MS);
    const alSalir = () => enviar(true);
    const alOcultar = () => { if (document.visibilityState === 'hidden') enviar(true); };
    const eventos = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    eventos.forEach((e) => window.addEventListener(e, tocar, { passive: true }));
    window.addEventListener('pagehide', alSalir);
    document.addEventListener('visibilitychange', alOcultar);
    return () => { clearInterval(tic); clearInterval(lote); eventos.forEach((e) => window.removeEventListener(e, tocar)); window.removeEventListener('pagehide', alSalir); document.removeEventListener('visibilitychange', alOcultar); enviar(false); };
  }, [medir, ruta]);
  return null;
}
