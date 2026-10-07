import { describe, it, expect, vi } from 'vitest';
import { crearColaRegistro } from './cola-registro';
describe('crearColaRegistro', () => {
  it('reintenta y no bloquea; avisa si falla tras los reintentos', async () => {
    vi.useFakeTimers();
    const enviar = vi.fn().mockRejectedValueOnce(new Error('neon dormido')).mockResolvedValueOnce({ ok: true });
    const onFallo = vi.fn();
    const cola = crearColaRegistro(enviar, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola.encolar({ id: 1 });
    await vi.runAllTimersAsync();
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(cola.pendientes()).toBe(0);
    expect(onFallo).not.toHaveBeenCalled();

    const siempreMal = vi.fn().mockResolvedValue({ ok: false });
    const cola2 = crearColaRegistro(siempreMal, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola2.encolar({ id: 2 });
    await vi.runAllTimersAsync();
    expect(siempreMal).toHaveBeenCalledTimes(3);
    expect(onFallo).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('mantiene el orden de envío', async () => {
    const vistos: number[] = [];
    const cola = crearColaRegistro(async (x: number) => { vistos.push(x); return { ok: true }; });
    cola.encolar(1); cola.encolar(2); cola.encolar(3);
    await new Promise((r) => setTimeout(r, 10));
    expect(vistos).toEqual([1, 2, 3]);
  });
});
