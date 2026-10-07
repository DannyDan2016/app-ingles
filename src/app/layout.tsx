import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { COOKIE_TEMA, dataThemeDe, temaDesdeCookie } from "@/lib/tema";
import "./globals.css";

// La CSP con nonce exige renderizado dinámico: sin esto las páginas estáticas no llevarían nonce.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inglés técnico",
  description: "Aprende inglés técnico por niveles.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = temaDesdeCookie((await cookies()).get(COOKIE_TEMA)?.value);
  return (
    <html lang="es" data-theme={dataThemeDe(tema)} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-fondo text-texto">{children}</body>
    </html>
  );
}
