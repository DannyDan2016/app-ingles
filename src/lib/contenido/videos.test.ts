import { describe, it, expect, vi } from 'vitest';
import { comprobarVideos, idsDeVideo } from './videos';

describe('videos', () => {
  it('idsDeVideo junta lecciones y tramos sin repetir', () => {
    const c = { lecciones: [{ video: { youtubeId: 'AAAAAAAAAAA' } }, {}], tramos: [{ fuente: { youtubeId: 'AAAAAAAAAAA' } }, { fuente: { youtubeId: 'BBBBBBBBBBB' } }], glosario: [] };
    expect(idsDeVideo(c as never)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB']);
  });
  it('comprobarVideos devuelve solo los que no dan 200, usando oEmbed', async () => {
    const urls: string[] = [];
    const fake = (async (u: string) => { urls.push(u); return { status: u.includes('BBBBBBBBBBB') ? 401 : 200 }; }) as unknown as typeof fetch;
    expect(await comprobarVideos(['AAAAAAAAAAA', 'BBBBBBBBBBB'], fake)).toEqual({ fallos: [{ id: 'BBBBBBBBBBB', status: 401 }], noVerificables: [] });
    expect(urls[0]).toBe('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DAAAAAAAAAAA');
  });
  it('404 cuenta como caído sin reintento', async () => {
    const f = vi.fn(async () => ({ status: 404 })) as unknown as typeof fetch;
    expect(await comprobarVideos(['AAAAAAAAAAA'], f)).toEqual({ fallos: [{ id: 'AAAAAAAAAAA', status: 404 }], noVerificables: [] });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('429/5xx/red se reintentan una vez; si persisten son no verificables, no caídos', async () => {
    const f = vi.fn(async () => ({ status: 429 })) as unknown as typeof fetch;
    expect(await comprobarVideos(['AAAAAAAAAAA'], f)).toEqual({ fallos: [], noVerificables: [{ id: 'AAAAAAAAAAA', status: 429 }] });
    expect(f).toHaveBeenCalledTimes(2);
    const red = vi.fn(async () => { throw new Error('x'); }) as unknown as typeof fetch;
    expect((await comprobarVideos(['AAAAAAAAAAA'], red)).noVerificables).toEqual([{ id: 'AAAAAAAAAAA', status: 0 }]);
  });
  it('un fallo transitorio que se recupera en el reintento no se reporta', async () => {
    let n = 0;
    const f = vi.fn(async () => ({ status: n++ === 0 ? 503 : 200 })) as unknown as typeof fetch;
    expect(await comprobarVideos(['AAAAAAAAAAA'], f)).toEqual({ fallos: [], noVerificables: [] });
  });
  it('pasa una señal de timeout al fetch', async () => {
    const f = vi.fn(async () => ({ status: 200 })) as unknown as typeof fetch;
    await comprobarVideos(['AAAAAAAAAAA'], f);
    expect((f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
