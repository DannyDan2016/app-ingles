import { useId, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  /** id del mensaje de error del formulario; si se pasa, se asocia al campo y se marca como inválido. */
  errorId?: string;
};

export function Campo({ label, hint, errorId, ...props }: Props) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">{label}</label>
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={errorId ? true : undefined}
        className="min-h-11 rounded-md border border-borde bg-superficie px-3 text-texto"
        {...props}
      />
      {hint && <p id={hintId} className="text-sm text-texto-suave">{hint}</p>}
    </div>
  );
}
