'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Play, VideoOff } from 'lucide-react';
import type { Video } from '@/lib/contenido/esquema';
import { cargarApiYouTube, urlEmbed, urlMiniatura, type YTPlayer } from '@/lib/youtube';

export function VideoFacade({ video, api = false, onPlayer, onError }: { video: Video; api?: boolean; onPlayer?: (p: YTPlayer) => void; onError?: () => void }) {
  const [estado, setEstado] = useState<'facade' | 'video' | 'error'>('facade');
  const iframeId = useId().replace(/:/g, '');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fallo = () => { setEstado('error'); onError?.(); };

  useEffect(() => {
    if (estado !== 'video' || !api || !iframeRef.current) return;
    let player: YTPlayer | undefined;
    cargarApiYouTube()
      .then((YT) => { player = new YT.Player(iframeRef.current!, { events: { onReady: (e) => onPlayer?.(e.target), onError: fallo } }); })
      .catch(() => { /* sin API: el video sigue funcionando a 1x */ });
    return () => player?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, api]);

  if (estado === 'error') {
    return (
      <div role="status" className="flex aspect-video items-center justify-center gap-2 rounded-xl bg-superficie text-texto-suave">
        <VideoOff aria-hidden="true" className="size-5" /> Video no disponible
      </div>
    );
  }
  if (estado === 'video') {
    return (
      <iframe ref={iframeRef} id={iframeId} src={urlEmbed(video, { api })} title={video.titulo}
        allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-xl" />
    );
  }
  return (
    <figure>
      <button type="button" onClick={() => setEstado('video')} className="group relative block w-full overflow-hidden rounded-xl" aria-label={`Reproducir video: ${video.titulo}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlMiniatura(video.youtubeId)} alt="" loading="lazy" onError={fallo} className="aspect-video w-full object-cover" />
        <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primario text-sobre-primario">
          <Play aria-hidden="true" className="size-8" />
        </span>
      </button>
      <figcaption className="mt-1 text-sm text-texto-suave">{video.titulo} · {video.canal}</figcaption>
    </figure>
  );
}
