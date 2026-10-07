import type { ButtonHTMLAttributes } from 'react';

const VARIANTES = {
  primario: 'bg-primario text-sobre-primario',
  secundario: 'border border-borde bg-superficie text-texto',
  fantasma: 'text-primario underline-offset-4 hover:underline',
} as const;

export function Boton({ className = '', variante = 'primario', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof VARIANTES }) {
  return <button className={`min-h-11 min-w-11 rounded-md px-4 font-semibold disabled:opacity-60 ${VARIANTES[variante]} ${className}`} {...props} />;
}
