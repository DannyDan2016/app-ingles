function insecureAllowed(): boolean {
  return process.env.COOKIE_INSECURE === 'true' && process.env.VERCEL !== '1';
}

export function sessionCookieName(): string {
  return insecureAllowed() ? 'sesion' : '__Host-sesion';
}

export function sessionCookieOptions(expiraAt: Date) {
  return { httpOnly: true, secure: !insecureAllowed(), sameSite: 'lax' as const, path: '/', expires: expiraAt };
}

/**
 * Opciones para borrar la cookie: mismas que al crearla (incluido Secure, que los
 * navegadores exigen para aceptar cambios sobre `__Host-`) y maxAge 0.
 * `cookies().delete()` no emite Secure, por eso no se usa.
 */
export function sessionCookieClearOptions() {
  return { httpOnly: true, secure: !insecureAllowed(), sameSite: 'lax' as const, path: '/', maxAge: 0 };
}
