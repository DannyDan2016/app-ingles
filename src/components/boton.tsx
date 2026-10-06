import type { ButtonHTMLAttributes } from 'react';

export function Boton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`min-h-11 min-w-11 rounded-md bg-primario px-4 font-semibold text-sobre-primario disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
