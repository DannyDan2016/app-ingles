import { iconoPwa } from '@/lib/pwa/icono';

export const dynamic = 'force-static';
export function GET() {
  return iconoPwa(180, { maskable: false });
}
