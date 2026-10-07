import { describe, it, expect } from 'vitest';
import { urlEmbed, urlMiniatura } from './youtube';

describe('youtube', () => {
  it('miniatura', () => expect(urlMiniatura('Ecu_7juyU0Q')).toBe('https://i.ytimg.com/vi/Ecu_7juyU0Q/hqdefault.jpg'));
  it('embed nocookie con tramo, sin relacionados y autoplay tras el clic', () => {
    const u = new URL(urlEmbed({ youtubeId: 'Ecu_7juyU0Q', start: 20, end: 80 }));
    expect(u.origin).toBe('https://www.youtube-nocookie.com');
    expect(u.pathname).toBe('/embed/Ecu_7juyU0Q');
    expect(Object.fromEntries(u.searchParams)).toEqual({ start: '20', end: '80', rel: '0', autoplay: '1' });
  });
  it('con api añade enablejsapi', () => {
    expect(new URL(urlEmbed({ youtubeId: 'Ecu_7juyU0Q', start: 0, end: 60 }, { api: true })).searchParams.get('enablejsapi')).toBe('1');
  });
  it('rechaza ids inválidos', () => expect(() => urlMiniatura('../x')).toThrow());
});
