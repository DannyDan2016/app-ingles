import type { Catalogo } from './esquema';

export function idsDeVideo(c: Catalogo): string[] {
  return [...new Set([...c.lecciones.flatMap((l) => (l.video ? [l.video.youtubeId] : [])), ...c.tramos.map((t) => t.fuente.youtubeId)])];
}
export async function comprobarVideos(ids: string[], fetcher: typeof fetch) {
  const fallos: { id: string; status: number }[] = [];
  for (const id of ids) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    const status = await fetcher(url).then((r) => r.status, () => 0);
    if (status !== 200) fallos.push({ id, status });
  }
  return fallos;
}
