'use client';
import { useState } from 'react';
import type { Shadowing } from '@/lib/contenido/esquema';
import { VideoFacade } from '@/components/video-facade';
import { Boton } from '@/components/boton';

export function ReproductorShadowing({ set }: { set: Shadowing }) {
  const [i, setI] = useState(0);
  const [intento, setIntento] = useState(0); // fuerza reiniciar el tramo con «Escuchar frase»
  const [iniciado, setIniciado] = useState(false); // tras el primer play, cada frase arranca directo
  const [verTexto, setVerTexto] = useState(false);
  const f = set.frases[i];
  const video = { youtubeId: set.video.youtubeId, titulo: set.video.titulo, canal: set.video.canal, start: f.start, end: f.end };
  const ir = (n: number) => { setI(n); setVerTexto(false); };
  return (
    <div className="flex flex-col gap-3">
      <p aria-live="polite" className="font-semibold">Frase {i + 1} de {set.frases.length}</p>
      <VideoFacade key={`${i}-${intento}`} video={video} iniciado={iniciado} onIniciar={() => setIniciado(true)} />
      <div className="flex flex-wrap gap-2">
        <Boton type="button" onClick={() => { setIniciado(true); setIntento((x) => x + 1); }}>Escuchar frase</Boton>
        <Boton type="button" variante="secundario" aria-pressed={verTexto} onClick={() => setVerTexto((v) => !v)}>{verTexto ? 'Ocultar texto' : 'Mostrar texto'}</Boton>
      </div>
      {verTexto && (
        <div className="rounded-md bg-superficie p-3">
          <p lang="en" className="font-semibold">{f.texto}</p>
          <p className="text-texto-suave">{f.traduccion}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Boton type="button" variante="secundario" disabled={i === 0} onClick={() => ir(i - 1)}>Anterior</Boton>
        <Boton type="button" disabled={i === set.frases.length - 1} onClick={() => ir(i + 1)}>Siguiente</Boton>
      </div>
    </div>
  );
}
