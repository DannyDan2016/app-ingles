import { ImageResponse } from 'next/og';

// Colores de «Terminal Calma» (globals.css, tema oscuro): fondo #0b1220, primario #2dd4bf.
export function iconoPwa(tam: number, { maskable }: { maskable: boolean }): ImageResponse {
  // Maskable: el contenido cabe en el 80 % central (zona segura).
  const texto = Math.round(tam * (maskable ? 0.3 : 0.4));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: '#2dd4bf', fontSize: texto, fontWeight: 700, borderRadius: maskable ? 0 : Math.round(tam * 0.18) }}>
        {'>_EN'}
      </div>
    ),
    { width: tam, height: tam },
  );
}
