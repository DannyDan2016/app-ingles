'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { EntradaGlosario, Nivel } from '@/lib/contenido/esquema';
import { guardarTerminoAction } from '@/app/(app)/_acciones/actions';

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
      if (!panel.current?.contains(t) && !disparador.current?.contains(t)) cerrarPanel();
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
    if (guardado === 'guardando') return; // el botón sigue enfocable (aria-disabled); se ignoran los clics
    setGuardado('guardando');
    try {
      const r = await guardarTerminoAction({ termino: base, nivel });
      setGuardado(r.ok ? (r.nuevo ? 'nuevo' : 'ya') : 'error');
    } catch {
      setGuardado('error');
    }
  }

  const mensaje = { inactivo: '', guardando: 'Guardando…', nuevo: 'Guardada', ya: 'Ya estaba en tu repaso', error: 'No pudimos guardarla. Inténtalo de nuevo.' }[guardado];
  // Se renderiza en un portal (fuera del párrafo y del <span>) para mantener el HTML válido.
  // Móvil: hoja inferior. Desde lg: modal centrado, así nunca se sale del viewport.
  const dialogo = (
    <>
      <div aria-hidden="true" onClick={cerrarPanel} className="fixed inset-0 z-30 bg-black/40" />
      <div ref={panel} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} onKeyDown={teclas}
        className="fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-2xl border border-borde bg-fondo p-4 text-texto shadow-lg lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-96 lg:max-w-[calc(100vw-2rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl">
        <div className="flex items-start justify-between gap-2">
          <h3 id={`${id}-t`} lang="en" className="font-mono text-lg font-bold">{entrada?.termino ?? base}</h3>
          <button ref={cerrar} type="button" onClick={cerrarPanel} aria-label="Cerrar" className="-m-1 flex min-h-11 min-w-11 items-center justify-center rounded-md">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {entrada ? (
          <div className="mt-1 flex flex-col gap-2 text-base leading-normal">
            <p className="text-sm text-texto-suave"><span lang="en">{entrada.categoria}</span></p>
            <p lang="es" className="font-semibold">{entrada.traduccion_es}</p>
            <p lang="en">{entrada.definicion_en}</p>
            <p lang="en" className="italic">{entrada.ejemplo_en}</p>
          </div>
        ) : (
          <p className="mt-1 text-base text-texto-suave">Sin traducción disponible</p>
        )}
        <button type="button" onClick={guardar} aria-disabled={guardado === 'guardando'}
          className="mt-3 min-h-11 w-full rounded-md bg-primario px-4 font-semibold text-sobre-primario aria-disabled:opacity-60">
          Guardar en mi repaso
        </button>
        <p role="status" className="mt-2 min-h-6 text-sm">{mensaje}</p>
      </div>
    </>
  );

  return (
    <>
      {/* Zona táctil: el ::before amplía el área a ~44 px de alto sin alterar el interlineado. */}
      <button ref={disparador} type="button" aria-expanded={abierto} aria-haspopup="dialog" aria-controls={abierto ? id : undefined} onClick={() => setAbierto((a) => !a)}
        className="relative font-mono underline decoration-dotted decoration-2 underline-offset-4 before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-['']">
        {visible}
      </button>
      {abierto && createPortal(dialogo, document.body)}
    </>
  );
}
