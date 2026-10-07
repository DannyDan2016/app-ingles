import { describe, it, expect } from 'vitest';
import { barajar } from './barajar';
describe('barajar', () => {
  const xs = ['a', 'b', 'c', 'd'];
  it('determinista por semilla', () => expect(barajar(xs, 's1')).toEqual(barajar(xs, 's1')));
  it('misma multiset', () => expect([...barajar(xs, 's2')].sort()).toEqual(xs));
  it('nunca devuelve el orden original con n ≥ 2', () => {
    for (const s of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) expect(barajar(['x', 'y'], s)).toEqual(['y', 'x']);
  });
  it('no muta la entrada', () => { const c = [...xs]; barajar(c, 'z'); expect(c).toEqual(xs); });
});
