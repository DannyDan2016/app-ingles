import type { Catalogo } from './esquema';

export function idsDeVideo(c: Catalogo): string[] {
  return [...new Set([...c.lecciones.flatMap((l) => (l.video ? [l.video.youtubeId] : [])), ...c.tramos.map((t) => t.fuente.youtubeId)])];
}
const CAIDO = new Set([401, 403, 404, 410]);
export type ResultadoVideos = { fallos: { id: string; status: number }[]; noVerificables: { id: string; status: number }[] };

function estadoOembed(url: string, fetcher: typeof fetch) {
  return fetcher(url, { signal: AbortSignal.timeout(10_000) }).then((r) => r.status, () => 0);
}
/** Solo 401/403/404/410 cuentan como caído; 0 (red/timeout), 429 y 5xx se reintentan una vez y quedan como «no verificables». */
export async function comprobarVideos(ids: string[], fetcher: typeof fetch): Promise<ResultadoVideos> {
  const fallos: ResultadoVideos['fallos'] = [];
  const noVerificables: ResultadoVideos['noVerificables'] = [];
  for (const id of ids) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    let status = await estadoOembed(url, fetcher);
    if (status !== 200 && !CAIDO.has(status)) status = await estadoOembed(url, fetcher);
    if (status === 200) continue;
    (CAIDO.has(status) ? fallos : noVerificables).push({ id, status });
  }
  return { fallos, noVerificables };
}
