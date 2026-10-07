export function BarraProgreso({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return <progress value={v} max={100} aria-label={etiqueta} className="barra-progreso h-2 w-full" />;
}
