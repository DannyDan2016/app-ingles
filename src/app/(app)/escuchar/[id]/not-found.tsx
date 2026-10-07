import Link from 'next/link';

export default function TramoNoEncontrado() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Este tramo no existe</h1>
      <p className="text-texto-suave">Puede que el enlace sea antiguo. Vuelve a la lista para elegir otro tramo.</p>
      <Link href="/escuchar" className="inline-flex min-h-11 items-center font-semibold text-primario underline">Ir a Escuchar</Link>
    </div>
  );
}
