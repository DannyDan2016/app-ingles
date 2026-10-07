import { CircleCheck, CircleX } from 'lucide-react';

/** Región viva persistente: se mantiene montada para que los lectores de pantalla anuncien el cambio. */
export function Feedback({ resultado, explicacion }: { resultado: boolean | null; explicacion: string }) {
  return (
    <div role="status" aria-live="polite">
      {resultado !== null && (
        <div className={`flex gap-3 rounded-lg border-2 p-3 ${resultado ? 'border-exito' : 'border-error'}`}>
          {resultado
            ? <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-exito" />
            : <CircleX aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-error" />}
          <div className="min-w-0">
            <p className={`font-semibold ${resultado ? 'text-exito' : 'text-error'}`}>{resultado ? '¡Correcto!' : 'No es correcto'}</p>
            <p className="mt-1 text-texto">{explicacion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
