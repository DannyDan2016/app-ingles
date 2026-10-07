import { describe, it, expect } from 'vitest';
import { comprobarVideos, idsDeVideo } from './videos';

describe('videos', () => {
  it('idsDeVideo junta lecciones y tramos sin repetir', () => {
    const c = { lecciones: [{ video: { youtubeId: 'AAAAAAAAAAA' } }, {}], tramos: [{ fuente: { youtubeId: 'AAAAAAAAAAA' } }, { fuente: { youtubeId: 'BBBBBBBBBBB' } }], glosario: [] };
    expect(idsDeVideo(c as never)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB']);
  });
  it('comprobarVideos devuelve solo los que no dan 200, usando oEmbed', async () => {
    const urls: string[] = [];
    const fake = (async (u: string) => { urls.push(u); return { status: u.includes('BBBBBBBBBBB') ? 401 : 200 }; }) as unknown as typeof fetch;
    expect(await comprobarVideos(['AAAAAAAAAAA', 'BBBBBBBBBBB'], fake)).toEqual([{ id: 'BBBBBBBBBBB', status: 401 }]);
    expect(urls[0]).toBe('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DAAAAAAAAAAA');
  });
});
