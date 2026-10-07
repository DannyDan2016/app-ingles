import Link from 'next/link';

export default function LeccionNoEncontrada() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Esta lección no existe</h1>
      <p className="text-texto-suave">Puede que el enlace sea antiguo. Vuelve al camino para elegir una lección.</p>
      <Link href="/camino" className="inline-flex min-h-11 items-center font-semibold text-primario underline">Ir al camino</Link>
    </div>
  );
}
