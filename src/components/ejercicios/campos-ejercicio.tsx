'use client';
import type { EjercicioVista } from '@/lib/contenido/vista';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { OpcionMultiple } from './opcion-multiple';
import { Completar } from './completar';
import { Ordenar } from './ordenar';
import { Emparejar } from './emparejar';
import { VerdaderoFalso } from './verdadero-falso';

/** Controles del ejercicio, sin comprobar. `inicial` precarga una respuesta guardada. Para reiniciarlos, cambiar la `key` del componente. */
export function CamposEjercicio({ vista, onResponder, inicial }: { vista: EjercicioVista; onResponder: (r: RespuestaUsuario | null) => void; inicial?: RespuestaUsuario | null }) {
  switch (vista.tipo) {
    case 'opcion_multiple': return <OpcionMultiple ejercicio={vista} onResponder={onResponder} inicial={inicial} />;
    case 'completar': return <Completar ejercicio={vista} onResponder={onResponder} inicial={inicial} />;
    case 'ordenar': return <Ordenar ejercicio={vista} onResponder={onResponder} inicial={inicial} />;
    case 'emparejar': return <Emparejar ejercicio={vista} onResponder={onResponder} inicial={inicial} />;
    case 'verdadero_falso': return <VerdaderoFalso ejercicio={vista} onResponder={onResponder} inicial={inicial} />;
  }
}
