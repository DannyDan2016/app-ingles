import { describe, it, expect, vi, afterEach } from 'vitest';
import { crearColaRegistro } from './cola-registro';
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe('crearColaRegistro', () => {
  it('reintenta si enviar lanza y no avisa si al final funciona', async () => {
    vi.useFakeTimers();
    const enviar = vi.fn().mockRejectedValueOnce(new Error('neon dormido')).mockResolvedValueOnce({ ok: true });
    const onFallo = vi.fn();
    const cola = crearColaRegistro(enviar, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola.encolar({ id: 1 });
    await vi.runAllTimersAsync();
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(cola.pendientes()).toBe(0);
    expect(onFallo).not.toHaveBeenCalled();
  });
  it('un {ok:false} es permanente: un solo intento y sin aviso', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const siempreMal = vi.fn().mockResolvedValue({ ok: false });
    const onFallo = vi.fn();
    const cola = crearColaRegistro(siempreMal, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola.encolar({ id: 2 });
    await vi.runAllTimersAsync();
    expect(siempreMal).toHaveBeenCalledTimes(1);
    expect(onFallo).not.toHaveBeenCalled();
    expect(cola.pendientes()).toBe(0);
  });
  it('si enviar siempre rechaza: reintentos+1 llamadas y un aviso', async () => {
    vi.useFakeTimers();
    const enviar = vi.fn().mockRejectedValue(new Error('caído'));
    const onFallo = vi.fn();
    const cola = crearColaRegistro(enviar, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola.encolar({ id: 3 });
    await vi.runAllTimersAsync();
    expect(enviar).toHaveBeenCalledTimes(3);
    expect(onFallo).toHaveBeenCalledTimes(1);
  });
  it('si onFalloPersistente lanza, la cola sigue funcionando', async () => {
    vi.useFakeTimers();
    const enviar = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue({ ok: true });
    const cola = crearColaRegistro(enviar, { reintentos: 0, esperaMs: 1, onFalloPersistente: () => { throw new Error('aviso'); } });
    cola.encolar(1);
    await vi.runAllTimersAsync();
    cola.encolar(2);
    await vi.runAllTimersAsync();
    expect(enviar).toHaveBeenCalledTimes(2);
  });
  it('mantiene el orden de envío', async () => {
    const vistos: number[] = [];
    const cola = crearColaRegistro(async (x: number) => { vistos.push(x); return { ok: true }; });
    cola.encolar(1); cola.encolar(2); cola.encolar(3);
    await new Promise((r) => setTimeout(r, 10));
    expect(vistos).toEqual([1, 2, 3]);
  });
});
