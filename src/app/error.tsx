'use client';

// No se muestran detalles del error (ni mensaje ni stack) al usuario.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold">Algo salió mal</h1>
      <p className="mb-6">Hubo un problema inesperado. Puedes volver a intentarlo.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="min-h-11 min-w-11 rounded-md bg-primario px-4 font-semibold text-sobre-primario"
      >
        Reintentar
      </button>
    </main>
  );
}
