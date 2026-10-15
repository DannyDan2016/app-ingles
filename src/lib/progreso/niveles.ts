export const NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Nivel = (typeof NIVELES)[number];
export type EstadoNivel = 'aprobado' | 'en_curso' | 'omitido' | 'bloqueado';
export const NIVEL_POR_DEFECTO: Nivel = 'A2';

export function isNivel(x: unknown): x is Nivel {
  return typeof x === 'string' && (NIVELES as readonly string[]).includes(x);
}

export function estadoNiveles({ nivelInicial, aprobados }: { nivelInicial: Nivel; aprobados: Nivel[] }) {
  const inicio = NIVELES.indexOf(nivelInicial);
  let enCursoAsignado = false;
  return NIVELES.map((nivel, i) => {
    let estado: EstadoNivel;
    if (aprobados.includes(nivel)) estado = 'aprobado';
    else if (i < inicio) estado = 'omitido';
    else if (!enCursoAsignado) {
      estado = 'en_curso';
      enCursoAsignado = true;
    } else estado = 'bloqueado';
    return { nivel, estado };
  });
}

/** Primer nivel «En curso»; si todos están aprobados, el último. */
export function nivelActual(niveles: { nivel: Nivel; estado: EstadoNivel }[]): Nivel {
  return niveles.find((n) => n.estado === 'en_curso')?.nivel ?? niveles[niveles.length - 1].nivel;
}
