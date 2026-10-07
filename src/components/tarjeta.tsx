import type { HTMLAttributes } from 'react';
export function Tarjeta({ as: Tag = 'section', className = '', ...props }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' | 'div' }) {
  return <Tag className={`rounded-xl border border-borde/40 bg-superficie p-4 ${className}`} {...props} />;
}
