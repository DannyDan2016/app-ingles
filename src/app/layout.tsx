import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-fondo text-texto">{children}</body>
    </html>
  );
}
