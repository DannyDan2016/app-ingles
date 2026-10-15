'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type Entorno = 'cargando' | 'instalada' | 'ios' | 'menu';

// El entorno del navegador se lee con useSyncExternalStore: en servidor y en la hidratación
// devuelve 'cargando' (no se pinta nada), y en cliente el valor real, sin setState dentro de un efecto.
const sinSuscripcion = () => () => {};
function leerEntorno(): Entorno {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return 'instalada';
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? 'ios' : 'menu';
}

export function InstalarApp() {
  const entorno = useSyncExternalStore(sinSuscripcion, leerEntorno, (): Entorno => 'cargando');
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    const alPedir = (e: Event) => { e.preventDefault(); setEvento(e as EventoInstalar); };
    const alInstalar = () => setInstalada(true);
    window.addEventListener('beforeinstallprompt', alPedir);
    window.addEventListener('appinstalled', alInstalar);
    return () => { window.removeEventListener('beforeinstallprompt', alPedir); window.removeEventListener('appinstalled', alInstalar); };
  }, []);

  const estado = instalada ? 'instalada' : entorno !== 'cargando' && entorno !== 'instalada' && evento ? 'boton' : entorno;
  if (estado === 'cargando' || estado === 'instalada') return null;
  return (
    <Tarjeta aria-labelledby="p-instalar">
      <h2 id="p-instalar" className="mb-2 text-lg font-semibold">Instalar la app</h2>
      {estado === 'boton' && evento && (
        <Boton type="button" onClick={async () => { await evento.prompt(); const r = await evento.userChoice; if (r.outcome === 'accepted') setInstalada(true); }}>
          Instalar
        </Boton>
      )}
      {estado === 'ios' && <p>En Safari pulsa <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.</p>}
      {estado === 'menu' && <p>Abre el menú del navegador y elige <strong>Instalar app</strong> o <strong>Añadir a pantalla de inicio</strong>.</p>}
    </Tarjeta>
  );
}
