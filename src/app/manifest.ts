import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inglés técnico',
    short_name: 'Inglés',
    description: 'Aprende inglés técnico por niveles.',
    start_url: '/hoy',
    scope: '/',
    display: 'standalone',
    lang: 'es',
    background_color: '#0b1220',
    theme_color: '#0f766e',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
