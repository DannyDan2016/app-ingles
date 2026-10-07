'use client';
import { useEffect, useRef, useState } from 'react';
import type { Ejercicio as TEjercicio } from '@/lib/contenido/esquema';
import { corregir, type RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { Boton } from '@/components/boton';
import { Feedback } from './feedback';
import { OpcionMultiple } from './opcion-multiple';
import { Completar } from './completar';
import { Ordenar } from './ordenar';
import { Emparejar } from './emparejar';
import { VerdaderoFalso } from './verdadero-falso';

const CONTROLES = 'input:not([disabled]), select:not([disabled]), button:not([disabled])';

export function Ejercicio({ ejercicio, onComprobado, onContinuar }: { ejercicio: TEjercicio; onComprobado: (correcta: boolean) => void; onContinuar: () => void }) {
  const [resp, setResp] = useState<RespuestaUsuario | null>(null);
  const [resultado, setResultado] = useState<boolean | null>(null);
  const [intento, setIntento] = useState(0);
  const campos = useRef<HTMLFieldSetElement>(null);
  const continuar = useRef<HTMLButtonElement>(null);
  const reintentar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (resultado === true) continuar.current?.focus();
    if (resultado === false) reintentar.current?.focus();
  }, [resultado]);
  useEffect(() => {
    if (intento > 0) campos.current?.querySelector<HTMLElement>(CONTROLES)?.focus();
  }, [intento]);

  function comprobar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!resp || resultado !== null) return;
    const ok = corregir(ejercicio, resp);
    setResultado(ok);
    onComprobado(ok);
  }
  const props = { onResponder: setResp };
  return (
    <form onSubmit={comprobar} className="flex flex-col gap-4">
      <fieldset ref={campos} disabled={resultado !== null} className="min-w-0 border-0 p-0">
        <legend className="mb-3 text-lg font-semibold">{ejercicio.enunciado}</legend>
        {ejercicio.tipo === 'opcion_multiple' && <OpcionMultiple key={intento} ejercicio={ejercicio} {...props} />}
        {ejercicio.tipo === 'completar' && <Completar key={intento} ejercicio={ejercicio} {...props} />}
        {ejercicio.tipo === 'ordenar' && <Ordenar key={intento} ejercicio={ejercicio} {...props} />}
        {ejercicio.tipo === 'emparejar' && <Emparejar key={intento} ejercicio={ejercicio} {...props} />}
        {ejercicio.tipo === 'verdadero_falso' && <VerdaderoFalso key={intento} ejercicio={ejercicio} {...props} />}
      </fieldset>
      <Feedback resultado={resultado} explicacion={ejercicio.explicacion} />
      {resultado === null && <Boton type="submit" disabled={!resp}>Comprobar</Boton>}
      {resultado === false && (
        <Boton type="button" ref={reintentar} variante="secundario" onClick={() => { setResp(null); setResultado(null); setIntento((n) => n + 1); }}>Intentar de nuevo</Boton>
      )}
      {resultado === true && <Boton type="button" ref={continuar} onClick={onContinuar}>Continuar</Boton>}
    </form>
  );
}
