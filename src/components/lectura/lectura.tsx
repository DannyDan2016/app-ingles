import type { EntradaGlosario, Nivel } from '@/lib/contenido/esquema';
import { segmentarLectura } from '@/lib/contenido/lectura';
import { PalabraGlosario } from './palabra-glosario';

export function Lectura({ texto, glosario, nivel }: { texto: string; glosario: Record<string, EntradaGlosario>; nivel: Nivel }) {
  return (
    <div lang="en" className="max-w-[68ch] whitespace-pre-line rounded-xl bg-lectura-fondo p-4 text-[18px] leading-[1.7] text-lectura-texto">
      {segmentarLectura(texto).map((s, i) =>
        s.tipo === 'texto'
          ? <span key={i}>{s.valor}</span>
          : <PalabraGlosario key={i} visible={s.visible} base={s.base} entrada={glosario[s.base]} nivel={nivel} />,
      )}
    </div>
  );
}
