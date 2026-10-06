import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold">Página no encontrada</h1>
      <p className="mb-6">No encontramos lo que buscas.</p>
      <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primario underline">Volver al inicio</Link>
    </main>
  );
}
