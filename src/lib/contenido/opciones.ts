export function opcionesCompilacion(env: Record<string, string | undefined>) {
  const vercel = env.VERCEL === '1';
  const incluirDemo = env.CONTENT_DEMO === '1';
  if (vercel && incluirDemo) throw new Error('La demo (content/_demo) nunca se compila en un build de Vercel');
  return { incluirDemo, estricto: vercel || env.CONTENIDO_ESTRICTO === '1' };
}
