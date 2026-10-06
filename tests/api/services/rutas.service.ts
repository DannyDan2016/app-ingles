import type { APIRequestContext } from '@playwright/test';

export class RutasService {
  constructor(private request: APIRequestContext) {}
  sinSesion(ruta: string) {
    return this.request.get(ruta, { maxRedirects: 0, headers: { cookie: '' } });
  }
}
