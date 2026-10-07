'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { EntradaGlosario, Nivel } from '@/lib/contenido/esquema';
import { guardarTerminoAction } from '@/app/(app)/_acciones/actions';
import { Boton } from '@/components/boton';

type Guardado = 'inactivo' | 'guardando' | 'nuevo' | 'ya' | 'error';
const FOCOS = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function PalabraGlosario({ visible, base, entrada, nivel }: { visible: string; base: string; entrada?: EntradaGlosario; nivel: Nivel }) {
  const [abierto, setAbierto] = useState(false);
  const [guardado, setGuardado] = useState<Guardado>('inactivo');
  const id = useId();
  const disparador = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);

  function cerrarPanel() {
    setAbierto(false);
    disparador.current?.focus();
  }

  useEffect(() => {
    if (!abierto) return;
    cerrar.current?.focus();
    const fuera = (ev: PointerEvent) => {
      const t = ev.target as Node;
      if (!panel.current?.contains(t) && !disparador.current?.contains(t)) { setAbierto(false); }
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  function teclas(ev: React.KeyboardEvent) {
    if (ev.key === 'Escape') { ev.stopPropagation(); cerrarPanel(); return; }
    if (ev.key !== 'Tab') return;
    const f = panel.current?.querySelectorAll<HTMLElement>(FOCOS);
    if (!f?.length) return;
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
  }

  async function guardar() {
    setGuardado('guardando');
    try {
      const r = await guardarTerminoAction({ termino: base, nivel });
      setGuardado(r.ok ? (r.nuevo ? 'nuevo' : 'ya') : 'error');
    } catch {
      setGuardado('error');
    }
  }

  const mensaje = { inactivo: '', guardando: 'Guardando…', nuevo: 'Guardada', ya: 'Ya estaba en tu repaso', error: 'No pudimos guardarla. Inténtalo de nuevo.' }[guardado];
  return (
    <span className="relative">
      <button ref={disparador} type="button" aria-expanded={abierto} aria-controls={abierto ? id : undefined} onClick={() => setAbierto((a) => !a)}
        className="font-mono underline decoration-dotted decoration-2 underline-offset-4 [min-block-size:1.5rem]">
        {visible}
      </button>
      {abierto && (
        <div ref={panel} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} onKeyDown={teclas}
          className="fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto whitespace-normal rounded-t-2xl border border-borde bg-fondo p-4 text-texto shadow-lg md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-2 md:w-80 md:rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <h3 id={`${id}-t`} lang="en" className="font-mono text-lg font-bold">{entrada?.termino ?? base}</h3>
            <button ref={cerrar} type="button" onClick={cerrarPanel} aria-label="Cerrar" className="-m-1 flex min-h-11 min-w-11 items-center justify-center rounded-md">
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {entrada ? (
            <div className="mt-1 flex flex-col gap-2 font-sans text-base leading-normal">
              <p className="text-sm text-texto-suave"><span lang="en">{entrada.categoria}</span></p>
              <p lang="es" className="font-semibold">{entrada.traduccion_es}</p>
              <p lang="en">{entrada.definicion_en}</p>
              <p lang="en" className="italic">{entrada.ejemplo_en}</p>
            </div>
          ) : (
            <p className="mt-1 font-sans text-base text-texto-suave">Sin traducción disponible</p>
          )}
          <Boton type="button" onClick={guardar} disabled={guardado === 'guardando'} className="mt-3 w-full font-sans">Guardar en mi repaso</Boton>
          <p role="status" className="mt-2 min-h-6 font-sans text-sm">{mensaje}</p>
        </div>
      )}
    </span>
  );
}
