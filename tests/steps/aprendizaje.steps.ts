import { expect, type Page } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import type { LeccionPage } from '../pages/leccion.page';
import type { HoyPage } from '../pages/hoy.page';
import type { NivelesPage } from '../pages/niveles.page';
import { crearCuenta } from './comunes.steps';
import { sinScrollHorizontal } from '../support/pantalla';
import { completarLeccion } from '../support/db';

// Contenido de la demo (content/_demo, solo imagen con CONTENT_DEMO=1): lección demo-01 y tramo demo-t1.
type L = LeccionPage;

async function comprobarYContinuar(l: L, correcta = true, continuar = true) {
  await l.pulsar(l.comprobar());
  await expect(l.feedback()).toContainText(correcta ? '¡Correcto!' : 'No es correcto');
  if (correcta && continuar) await l.pulsar(l.continuar());
}

async function ejerciciosDemo01(l: L, alResumen = true) {
  await expect(l.paso('Ejercicios')).toBeVisible();
  // 1. opción múltiple
  await expect(l.posicion('Ejercicio 1 de 5')).toBeVisible();
  await l.marcar(l.opcion('A branch'));
  await comprobarYContinuar(l);
  // 2. completar: falla a propósito, reintenta y acierta
  await expect(l.posicion('Ejercicio 2 de 5')).toBeVisible();
  await l.escribir(l.respuesta(), 'branch');
  await comprobarYContinuar(l, false);
  await l.pulsar(l.intentarDeNuevo());
  await l.escribir(l.respuesta(), 'commit');
  await comprobarYContinuar(l);
  // 3. ordenar
  await expect(l.posicion('Ejercicio 3 de 5')).toBeVisible();
  for (const p of ['They', 'merge', 'the', 'branch']) await l.pulsar(l.pieza(p));
  await comprobarYContinuar(l);
  // 4. emparejar
  await expect(l.posicion('Ejercicio 4 de 5')).toBeVisible();
  await l.elegir(l.selectorDe('commit'), 'confirmación');
  await l.elegir(l.selectorDe('branch'), 'rama');
  await l.elegir(l.selectorDe('review'), 'revisión');
  await comprobarYContinuar(l);
  // 5. verdadero o falso
  await expect(l.posicion('Ejercicio 5 de 5')).toBeVisible();
  await l.marcar(l.opcion('Verdadero'));
  await comprobarYContinuar(l, true, false);
  if (alResumen) await l.irAlResumen();
}


async function empezarDesdeHoy(l: L, hoy: HoyPage) {
  await l.pulsar(hoy.enlaceEmpezar());
  await expect(l.paso('Lectura')).toBeVisible();
}

async function completarDemo01(f: { leccion: L; hoy: HoyPage }) {
  const { leccion: l, hoy } = f;
  await empezarDesdeHoy(l, hoy);
  await l.pulsar(l.continuar());
  await l.pulsar(l.saltarVideo());
  await ejerciciosDemo01(l);
  await expect(l.page.getByText('Lección completada')).toBeVisible();
  await expect(l.page.getByText('Tu progreso está guardado.')).toBeVisible();
}

// --- Contexto -----------------------------------------------------------------------------------

Given('que uso solo el teclado', async ({ leccion }) => { leccion.teclado = true; });

Given('que registro las peticiones de red', async ({ page, ctx }) => {
  ctx.peticiones = [];
  ctx.actividad = [];
  page.on('request', (r) => ctx.peticiones!.push(r.url()));
  page.on('response', (r) => { if (new URL(r.url()).pathname === '/api/actividad') ctx.actividad!.push(r.status()); });
});

Given('que completé la lección demo-01', async ({ leccion, hoy }) => completarDemo01({ leccion, hoy }));

Given('que tengo una cuenta con nivel {string}', async ({ invitaciones, registro, page, ctx, niveles }, nivel: string) => {
  if (nivel !== 'A2') throw new Error(`Todas las cuentas empiezan en A2; el escenario pide ${nivel}`);
  await crearCuenta({ invitaciones, registro, page, ctx });
  await niveles.empezar();
  await expect(niveles.titulo()).toBeVisible();
});

When('abro la sección {string}', async ({ niveles }, seccion: string) => {
  await niveles.irA(seccion as Parameters<NivelesPage['irA']>[0]);
});

When('abro la página {string}', async ({ page }, ruta: string) => { await page.goto(ruta); });

When('recargo la página', async ({ page }) => { await page.reload(); });

// --- Lección ------------------------------------------------------------------------------------

When('empiezo la siguiente lección desde Hoy', async ({ leccion, hoy }) => empezarDesdeHoy(leccion, hoy));

Then('veo el paso {string} de la lección', async ({ leccion }, paso: string) => {
  await expect(leccion.paso(paso)).toBeVisible();
});

When('continúo hasta el video', async ({ leccion }) => {
  await leccion.pulsar(leccion.continuar());
  await expect(leccion.paso('Video')).toBeVisible();
});

When('salto el video', async ({ leccion }) => { await leccion.pulsar(leccion.saltarVideo()); });

When('resuelvo los 5 ejercicios fallando uno a propósito', async ({ leccion }) => ejerciciosDemo01(leccion));

When('resuelvo los 5 ejercicios y llego a Tu frase', async ({ leccion }) => {
  await ejerciciosDemo01(leccion, false);
  await leccion.irATuFrase();
});

When('escribo una frase válida con {string}', async ({ leccion: l }, palabra: string) => {
  await l.escribir(l.campoFrase(palabra), `I make a small ${palabra} every day.`);
  await l.pulsar(l.comprobarFrase().first());
});

Then('veo la frase modelo', async ({ page }) => {
  await expect(page.getByText(/Frase modelo/)).toBeVisible();
});

When('confirmo que mi frase está bien', async ({ leccion: l }) => {
  await l.pulsar(l.fraseBien());
  await expect(l.page.getByText('Frase lista')).toBeVisible();
});

When('omito el resto del paso Tu frase', async ({ leccion: l }) => {
  await l.pulsar(l.omitirPaso());
  await expect(l.paso('Resumen')).toBeVisible();
});

Then('veo el resumen {string}', async ({ page }, texto: string) => {
  await expect(page.getByRole('main').getByText(texto)).toBeVisible();
  await expect(page.getByText('Tu progreso está guardado.')).toBeVisible();
});

Then('en el camino A2 la lección {string} está {string}', async ({ page, niveles }, titulo: string, estado: string) => {
  await niveles.irA('Camino');
  await page.goto('/camino/A2');
  await expect(page.getByRole('listitem').filter({ hasText: titulo })).toContainText(estado);
});

Then('Hoy muestra el estado del repaso y no desborda', async ({ page, niveles, hoy }) => {
  await niveles.irA('Hoy');
  await expect(hoy.tarjetaRepaso()).toContainText(/palabras? para repasar|Sin repasos pendientes/);
  await sinScrollHorizontal(page);
});

When('permanezco unos segundos en la pantalla', async ({ page }) => { await page.waitForTimeout(3000); }); // espera real: el medidor cuenta 1 s por tic y exige >= 1 s acumulado antes de enviar al salir

Then('el tiempo de práctica se registró en el servidor', async ({ ctx }) => {
  await expect.poll(() => ctx.actividad!.length, { message: 'no hubo ninguna petición a /api/actividad' }).toBeGreaterThan(0);
  expect(ctx.actividad, 'estados HTTP de POST /api/actividad').toContain(204);
});

// --- Privacidad del video (RNF-PRI-01) -------------------------------------------------------------

Then('no hay ningún iframe ni petición a YouTube', async ({ leccion, ctx }) => {
  await expect(leccion.reproducir()).toBeVisible();
  await expect(leccion.iframes()).toHaveCount(0);
  const yt = ctx.peticiones!.filter((u) => /(^|\.)(youtube|youtube-nocookie|googlevideo)\.com$/.test(new URL(u).hostname));
  expect(yt, 'peticiones a YouTube antes de pulsar «Reproducir video»').toEqual([]);
});

Then('la miniatura se pide a i.ytimg.com', async ({ ctx }) => {
  await expect.poll(() => ctx.peticiones!.some((u) => new URL(u).hostname === 'i.ytimg.com')).toBe(true);
});

When('pulso «Reproducir video»', async ({ leccion }) => { await leccion.pulsar(leccion.reproducir()); });

Then('existe un iframe de youtube-nocookie', async ({ leccion }) => {
  await expect(leccion.iframeNocookie()).toHaveCount(1);
});

// --- Glosario -----------------------------------------------------------------------------------

When('toco la palabra {string} de la lectura', async ({ leccion }, palabra: string) => {
  await leccion.pulsar(leccion.palabra(palabra));
});

Then('veo un diálogo con {string}', async ({ leccion }, texto: string) => {
  await expect(leccion.dialogo()).toBeVisible();
  await expect(leccion.dialogo()).toContainText(texto);
});

When('pulso Escape', async ({ page }) => { await page.keyboard.press('Escape'); });

Then('el diálogo se cierra y el foco vuelve a la palabra {string}', async ({ leccion }, palabra: string) => {
  await expect(leccion.dialogo()).toHaveCount(0);
  await expect(leccion.palabra(palabra)).toBeFocused();
});

When('pulso «Guardar en mi repaso»', async ({ leccion }) => { await leccion.pulsar(leccion.guardarPalabra()); });

Then('el diálogo indica {string}', async ({ leccion }, texto: string) => {
  await expect(leccion.estadoGuardado()).toHaveText(texto);
});

// --- Repaso y perfil ------------------------------------------------------------------------------

Then('no tengo repasos pendientes hoy', async ({ repaso }) => {
  await expect(repaso.sinPendientes()).toBeVisible();
});

Then('mi vocabulario tiene palabras en la Caja 1', async ({ repaso }) => {
  await expect(repaso.vocabulario()).toContainText(/Caja 1 \(mañana\):\s*[1-9]/);
});

// --- Escuchar -----------------------------------------------------------------------------------

Then('la lista de Escuchar incluye el tramo {string}', async ({ escuchar }, id: string) => {
  await expect(escuchar.tramo(id)).toBeVisible();
});

When('abro el tramo {string}', async ({ escuchar, page }, id: string) => {
  await escuchar.tramo(id).click();
  await page.waitForURL(/\/escuchar\/[^/]+$/);
});

When('completo las tres pasadas', async ({ escuchar, leccion }) => {
  await expect(escuchar.pasada(1)).toBeVisible();
  await leccion.pulsar(escuchar.siguientePasada());
  await expect(escuchar.pasada(2)).toBeVisible();
  await leccion.pulsar(escuchar.siguientePasada());
  await expect(escuchar.pasada(3)).toBeVisible();
  await leccion.pulsar(escuchar.irAPreguntas());
  await expect(leccion.paso('Preguntas de comprensión')).toBeVisible();
});

When('respondo las 3 preguntas del tramo', async ({ leccion: l }) => {
  await expect(l.posicion('Pregunta 1 de 3')).toBeVisible();
  await l.marcar(l.opcion('Verdadero'));
  await comprobarYContinuar(l);
  await expect(l.posicion('Pregunta 2 de 3')).toBeVisible();
  await l.marcar(l.opcion('Bug reports'));
  await comprobarYContinuar(l);
  await expect(l.posicion('Pregunta 3 de 3')).toBeVisible();
  await l.marcar(l.opcion('Falso'));
  await comprobarYContinuar(l);
});

Then('veo el tramo completado', async ({ page }) => {
  await expect(page.getByText('Tramo completado')).toBeVisible();
  await expect(page.getByText('Tu progreso está guardado.')).toBeVisible();
});

// --- Preferencias -------------------------------------------------------------------------------

When('elijo el tema {string} y lo guardo', async ({ page }, tema: string) => {
  await page.getByRole('radio', { name: tema, exact: true }).check();
  await page.getByRole('button', { name: 'Guardar tema' }).click();
});

Then('la aplicación usa el tema oscuro', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

When('elijo una meta diaria de {int} minutos y la guardo', async ({ page }, min: number) => {
  await page.getByRole('radio', { name: `${min} minutos`, exact: true }).check();
  await page.getByRole('button', { name: 'Guardar meta' }).click();
  await expect(page.getByRole('radio', { name: `${min} minutos`, exact: true })).toBeChecked();
});

Then('Hoy muestra {string}', async ({ hoy, niveles }, texto: string) => {
  await niveles.irA('Hoy');
  await expect(hoy.textoMeta()).toContainText(texto);
});

// --- Nivel sin contenido ------------------------------------------------------------------------------

Then('veo el aviso {string} con enlace al camino A2', async ({ page }, texto: string) => {
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: texto })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Ir al camino A2' })).toBeVisible();
});

// --- Evaluación de nivel (solo local: usa la BD del stack Docker) -------------------------------------

Given('que tengo una cuenta con nivel {string} y todas sus lecciones completadas', async ({ invitaciones, registro, page, ctx, niveles }, nivel: string) => {
  await crearCuenta({ invitaciones, registro, page, ctx });
  await niveles.empezar();
  await expect(niveles.titulo()).toBeVisible();
  // El ítem «actual» es el único enlace con aria-current="step": se marca como hecho y se recarga hasta que no quede ninguno.
  for (let n = 0; n < 30; n++) {
    await page.goto(`/camino/${nivel}`);
    const actual = page.locator('a[aria-current="step"]');
    if (!(await actual.count())) return;
    const id = (await actual.getAttribute('href'))!.split('/').pop()!;
    await completarLeccion(ctx.alias!, nivel, id);
  }
  throw new Error('Demasiadas lecciones');
});
When('abro la evaluación de {string}', async ({ evaluacion }, nivel: string) => { await evaluacion.abrir(nivel); });
When('empiezo la evaluación', async ({ evaluacion }) => { await evaluacion.empezar(); });
When('respondo todas las preguntas con {string}', async ({ evaluacion }, opcion: string) => { await evaluacion.responderTodas(opcion as 'Verdadero' | 'Falso'); });
When('envío la evaluación', async ({ evaluacion }) => { await evaluacion.enviar(); });
Then('veo el resultado {string}', async ({ evaluacion }, texto: string) => { await expect(evaluacion.resultado(texto)).toBeVisible(); });
Then('veo el enlace {string}', async ({ page }, texto: string) => { await expect(page.getByRole('link', { name: texto })).toBeVisible(); });
Then('el nivel {string} aparece {string}', async ({ niveles }, nivel: string, estado: string) => { await expect(niveles.tarjeta(nivel)).toContainText(estado); });

Then('la página no contiene las soluciones', async ({ evaluacion }) => {
  const html = await evaluacion.html();
  // Claves del modelo (con comillas, escapadas o no, para no confundir con texto de enunciados) y textos de explicación del banco demo.
  expect(html).not.toMatch(/explicacion/);
  expect(html).not.toMatch(/aceptadas/);
  expect(html).not.toMatch(/correcta\?"\s*:/);
  expect(html).not.toContain('La lectura dice');
  expect(html).not.toContain('Present simple con -s en tercera persona');
});
When('sigo el enlace {string}', async ({ page }, texto: string) => { await page.getByRole('link', { name: texto }).click(); });
// Refuerzo: 8 ejercicios de práctica del demo en orden barajado; se resuelven según su enunciado.
When('completo los ejercicios del refuerzo', async ({ leccion: l, page }) => {
  for (let n = 0; n < 12; n++) {
    if (await page.getByRole('heading', { name: 'Refuerzo completado' }).isVisible()) return;
    const enunciado = (await page.locator('legend').first().innerText()).trim();
    if (enunciado === 'What does Leo create every day?') await l.marcar(l.opcion('A branch'));
    else if (enunciado === 'Completa la frase.') await l.escribir(l.respuesta(), 'commit');
    else if (enunciado === 'Ordena la frase.') { for (const p of ['They', 'merge', 'the', 'branch']) await l.pulsar(l.pieza(p)); }
    else if (enunciado.startsWith('Empareja')) {
      await l.elegir(l.selectorDe('commit'), 'confirmación');
      await l.elegir(l.selectorDe('branch'), 'rama');
      await l.elegir(l.selectorDe('review'), 'revisión');
    } else if (enunciado === 'What is the video about?') await l.marcar(l.opcion('Bug reports'));
    else if (enunciado.startsWith('¿Verdadero o falso?')) {
      // La afirmación decide: solo «The speaker talks about pizza.» es falsa.
      const falsa = await page.getByText('The speaker talks about pizza.', { exact: true }).isVisible();
      await l.marcar(l.opcion(falsa ? 'Falso' : 'Verdadero'));
    } else throw new Error(`Ejercicio de refuerzo desconocido: ${enunciado}`);
    await l.pulsar(l.comprobar());
    await expect(l.feedback()).toContainText('¡Correcto!');
    await l.pulsar(l.continuar());
  }
  await expect(page.getByRole('heading', { name: 'Refuerzo completado' })).toBeVisible();
});
Then('veo el refuerzo completado con la fecha para reintentar', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Refuerzo completado' })).toBeVisible();
  await expect(page.getByText(/Podrás volver a presentar|Ya puedes volver a presentar/)).toBeVisible();
});
