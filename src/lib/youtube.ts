const ID = /^[A-Za-z0-9_-]{11}$/;
const valida = (id: string) => { if (!ID.test(id)) throw new Error('youtubeId inválido'); return id; };

export const urlMiniatura = (id: string) => `https://i.ytimg.com/vi/${valida(id)}/hqdefault.jpg`;
export function urlEmbed(v: { youtubeId: string; start: number; end: number }, opts: { api?: boolean } = {}) {
  const p = new URLSearchParams({ start: String(v.start), end: String(v.end), rel: '0', autoplay: '1' });
  if (opts.api) p.set('enablejsapi', '1');
  return `https://www.youtube-nocookie.com/embed/${valida(v.youtubeId)}?${p}`;
}

/* Tipos mínimos de la IFrame API que usamos. */
export type YTPlayer = { setPlaybackRate(r: number): void; playVideo(): void; seekTo(s: number, allow: boolean): void; destroy(): void };
export type YTNamespace = { Player: new (el: HTMLElement | string, o: { events?: Record<string, (e: { data: number; target: YTPlayer }) => void> }) => YTPlayer };

let promesa: Promise<YTNamespace> | null = null;
export function cargarApiYouTube(): Promise<YTNamespace> {
  if (promesa) return promesa;
  promesa = new Promise((resolve, reject) => {
    const w = window as unknown as { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return resolve(w.YT);
    w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
    const s = document.createElement('script'); // confiable por 'strict-dynamic' (lo crea un script con nonce)
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { promesa = null; reject(new Error('No se pudo cargar la API de YouTube')); };
    document.head.appendChild(s);
  });
  return promesa;
}
