'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleDashed } from 'lucide-react';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { crearColaRegistro } from '@/lib/aprendizaje/cola-registro';
import { ETIQUETA_BLOQUE, type PreguntaExamen } from '@/lib/evaluacion/tipos';
import { CamposEjercicio } from '@/components/ejercicios/campos-ejercicio';
import { VideoFacade } from '@/components/video-facade';
import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';
import { finalizarEvaluacionAction, guardarRespuestaAction } from '../actions';

type Envio = { intentoId: string; preguntaId: string; respuesta: RespuestaUsuario };

export function FlujoEvaluacion({ nivel, intentoId, preguntas, respondidas }: { nivel: string; intentoId: string; preguntas: PreguntaExamen[]; respondidas: string[] }) {
  const router = useRouter();
  const total = preguntas.length;
  const [i, setI] = useState(() => { const k = preguntas.findIndex((p) => !respondidas.includes(p.vista.id)); return k === -1 ? total : k; });
  const [resp, setResp] = useState<RespuestaUsuario | null>(null);
  const [confirmadas, setConfirmadas] = useState(() => new Set(respondidas));
  const [aviso, setAviso] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);
  const cola = useMemo(() => crearColaRegistro(async (x: Envio) => {
    const r = await guardarRespuestaAction(x);
    if (r.ok) setConfirmadas((s) => new Set(s).add(x.preguntaId));
    return r;
  }, { onFalloPersistente: () => setAviso(true) }), []);

  useEffect(() => { titulo.current?.focus(); }, [i]);

  function ir(k: number) { setResp(null); setConfirmar(false); setI(k); }
  function guardarYSeguir() {
    if (resp) cola.encolar({ intentoId, preguntaId: preguntas[i].vista.id, respuesta: resp });
    ir(i + 1);
  }
  async function enviar() {
    setEnviando(true);
    const r = await finalizarEvaluacionAction({ intentoId });
    if (r.ok) { router.push(`/evaluacion/${nivel}/resultado/${r.intentoId}`); return; }
    setEnviando(false);
    setError(r.motivo === 'incompleto' ? 'Aún faltan respuestas por guardar. Revisa la lista.' : 'La evaluación caducó. Vuelve al camino para empezar otra.');
  }

  const progreso = <BarraProgreso valor={(confirmadas.size / total) * 100} etiqueta={`${confirmadas.size} de ${total} respuestas guardadas`} />;
  const estado = <p role="status" className="min-h-5 text-sm text-aviso">{aviso ? 'No pudimos guardar alguna respuesta. Revísala antes de enviar.' : ''}</p>;

  if (i >= total) {
    const completas = confirmadas.size === total;
    return (
      <div className="flex flex-col gap-4">
        <h1 ref={titulo} tabIndex={-1} className="text-2xl font-bold outline-offset-4">Revisa antes de enviar</h1>
        {progreso}
        <ol className="flex flex-col gap-2">
          {preguntas.map((p, k) => {
            const ok = confirmadas.has(p.vista.id);
            const Icono = ok ? CircleCheck : CircleDashed;
            return (
              <li key={p.vista.id}>
                <button type="button" onClick={() => ir(k)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-borde px-3 text-left">
                  <span>Pregunta {k + 1} · {ETIQUETA_BLOQUE[p.bloque]}</span>
                  <span className={`flex items-center gap-1 text-sm ${ok ? 'text-exito' : 'text-texto-suave'}`}><Icono aria-hidden="true" className="size-4" /> {ok ? 'Guardada' : 'Pendiente'}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {estado}
        {error && <p role="alert" className="text-error">{error}</p>}
        {!confirmar
          ? <Boton type="button" disabled={!completas} onClick={() => setConfirmar(true)}>Enviar evaluación</Boton>
          : (
            <div className="flex flex-col gap-2">
              <p>Al enviar ya no podrás cambiar respuestas.</p>
              <Boton type="button" disabled={enviando} onClick={enviar}>Sí, enviar</Boton>
              <Boton type="button" variante="secundario" onClick={() => setConfirmar(false)}>Seguir revisando</Boton>
            </div>
          )}
      </div>
    );
  }

  const p = preguntas[i];
  const ya = confirmadas.has(p.vista.id);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto-suave">Pregunta {i + 1} de {total} · {ETIQUETA_BLOQUE[p.bloque]}</p>
      {progreso}
      {p.recurso?.tipo === 'lectura' && (
        <article lang="en" className="max-w-[68ch] whitespace-pre-line rounded-xl bg-lectura-fondo p-4 text-[18px] leading-[1.7] text-lectura-texto">
          <h2 className="mb-2 font-semibold">{p.recurso.titulo}</h2>
          {p.recurso.texto}
        </article>
      )}
      {p.recurso?.tipo === 'video' && <VideoFacade key={p.recurso.id} video={p.recurso.fuente} />}
      <form onSubmit={(ev) => { ev.preventDefault(); guardarYSeguir(); }} className="flex flex-col gap-4">
        <fieldset className="min-w-0 border-0 p-0" aria-labelledby="enunciado">
          <h1 id="enunciado" ref={titulo} tabIndex={-1} className="mb-3 text-lg font-semibold outline-offset-4">{p.vista.enunciado}</h1>
          <CamposEjercicio key={p.vista.id} vista={p.vista} onResponder={setResp} />
        </fieldset>
        {ya && <p className="text-sm text-texto-suave">Ya guardaste una respuesta. Si eliges otra, se reemplaza.</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          {i > 0 && <Boton type="button" variante="secundario" onClick={() => ir(i - 1)}>Anterior</Boton>}
          <Boton type="submit" disabled={!resp && !ya}>Guardar y seguir</Boton>
        </div>
      </form>
      {estado}
    </div>
  );
}
