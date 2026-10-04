---
tipo: investigacion
proyecto: app-ingles
estado: borrador
actualizado: 2026-10-04
---
# Diccionario y traductor EN→ES offline (sin IA)

Cubre EP6 (traductor de palabras, vocabulario, pronunciación) y RNF-REN-02 (JS inicial ≤ 200 KB; diccionario bajo demanda; búsqueda ≤ 300 ms p95). Restricciones: coste 0, sin IA, sin APIs de terceros, 10 usuarios o menos, Vercel gratis, Neon gratis (0,5 GB) solo si se justifica.

Metodología: las cifras marcadas **(medido)** salen de descargar la fuente real el 2026-10-04 y procesarla con un script temporal (no se instaló nada ni se guardó en el repo). Las marcadas **(no verificado)** son conocimiento previo o inferencia.

## 1. Comparativa de fuentes

| Fuente | Licencia y obligaciones | Entradas | Tamaño | Calidad EN→ES | IPA / ejemplos | Formato y filtrado a 20-30k |
|---|---|---|---|---|---|---|
| **FreeDict eng-spa 2025.11.23** (generado por WikDict desde Wiktionary vía DBnary) | **CC BY-SA 3.0** (lo declara el `teiHeader` del `.tei`, medido). Atribuir a Wiktionary/WikDict/FreeDict, enlazar la licencia, indicar los cambios y publicar la versión derivada bajo la misma licencia. | 64.258 entradas (medido); 58.946 palabras únicas y 42.985 sin espacios (medido) | `.tei` 34,4 MB; `src.tar.xz` 3,7 MB; stardict 4,0 MB; slob 8,1 MB (medido) | Buena en palabras comunes (varias traducciones por sentido, categoría gramatical). Cobertura técnica floja: el primer sentido de `bug` es «chinche» y `flaky` no trae el sentido de pruebas inestables (medido). Faltan `backend`, `frontend`, `runtime` y `throughput` (medido). | **IPA sí**: 80.471 etiquetas `<pron>` (medido). **Definición en inglés** sí. **Ejemplos no** (0 `cit type="example"`, medido). | TEI/XML estándar, se lee con `ElementTree` en pocos segundos. Cada entrada tiene `orth`, `pron`, `pos`, traducciones y `def`. Filtro trivial por palabra, categoría y frecuencia. |
| **Wiktionary vía kaikki.org (wiktextract), edición inglesa** | Texto de Wiktionary: CC BY-SA + GFDL (la página de la edición española lo indica para su extracto, medido; para la inglesa es lo habitual, no verificado). kaikki pide citar a Ylonen (LREC 2022) y agradece el enlace. | 1.390.507 palabras distintas, todas las lenguas (medido) | JSONL 23,9 GB sin comprimir; `.gz` 2,8 GB (medido); la página del inglés indica 3,1 GB | La mejor cobertura y sentidos técnicos más actuales, pero las traducciones al español salen de las tablas de traducción y llegan irregulares (no verificado). | IPA, audio y ejemplos sí (esquema de wiktextract, no verificado). | Hay que descargar 2,8 GB y filtrar con un script. Es la mejor fuente de ejemplos, pero cuesta mucho para lo que necesitamos. |
| **Wiktionary español vía kaikki.org (eswiktionary)** | CC BY-SA + GFDL (medido). | 35.167 sentidos de inglés dentro de 1,24 M sentidos totales (medido) | Extracto de español: 98,4 MB comprimido, 1,1 GB sin comprimir (medido) | Define palabras inglesas en español, pero con poca cobertura frente a FreeDict. | Parcial (no verificado). | JSONL. Solo vale como complemento. |
| **Apertium eng-spa** | GPL-3.0 según AUR; Debian lo lista como GPL-2+ (discrepancia sin resolver). Si se incrusta en la app, el copyleft alcanza al código. | No es un diccionario de palabras: es un traductor de frases por reglas | Requiere compilar el motor | Sirve para frases, pero las frases están fuera de alcance (EP6 pide palabras). | No | **Descartado.** Habría que ejecutar el motor en servidor o compilarlo a WASM; es demasiado para este caso. |
| **NGSL 1.2** (lista de frecuencia) | **CC BY-SA 4.0**; citar a Browne y Culligan (2013). | 2.809 lemas (cubren ~92 % de un texto general) | Unos KB | Es una lista de palabras, no un diccionario. | No | Descargable como lista. Útil para marcar un «núcleo» A1-B1. |
| **FrequencyWords en_50k** (OpenSubtitles 2018) | Datos **CC BY-SA 4.0**, código MIT (medido). | 50.000 formas con su frecuencia (medido) | 623 KB | Sesgada a diálogo de subtítulos; trae nombres propios y formas flexionadas. | No | Texto plano. La usé como criterio de corte en el prototipo. |
| **SUBTLEX-US** | Gratuita; permiso de Brysbaert para cualquier uso, con crédito a los autores (según resultados de búsqueda, no verificado en la fuente primaria). | ~74 mil palabras (no verificado) | Un par de MB (no verificado) | Frecuencia con categoría gramatical; alternativa a `en_50k` para el corte. | No | Excel o texto. |
| **Vocabulario técnico de software** | No hay un diccionario abierto EN→ES de calidad. | — | — | Hay que escribirlo. | Se pueden añadir ejemplos propios. | Glosario propio en YAML de 300-500 términos (`bug`, `flaky`, `deployment`, `backend`, `endpoint`, `rollback`…). Se puede esbozar con Ollama (R7) y revisar a mano (EP11-HU03). Licencia propia (CC BY-SA para ser coherente con el resto). |

## 2. Prototipo medido

Con FreeDict eng-spa y `en_50k` como criterio de frecuencia:

- Palabras sin espacios de FreeDict que están en `en_50k`: **20.245**. Con corte de rango < 40.000 quedan 17.855.
- Para llegar a 25-30k hay que ampliar el corte, añadir el glosario técnico y las palabras de NGSL que falten.
- Palabras técnicas comprobadas: `deployment` (rango 16.743), `queue`, `flaky` (25.327) y `payload` están. `debug`, `endpoint`, `latency`, `refactor` y `rollback` existen en FreeDict pero no en `en_50k`. `backend`, `frontend`, `runtime` y `throughput` no existen en FreeDict. Por eso hace falta el glosario propio.
- Las formas flexionadas (`deployments`, `running`, `queues`) no están: FreeDict solo trae lemas. Hace falta un pequeño lematizador por reglas más una tabla de irregulares, o un mapa `forma→lema` generado desde wiktextract. Es la principal deuda del enfoque.

Tamaños de un subconjunto de 17.855 entradas (JSON minificado, UTF-8):

| Contenido por entrada | Sin comprimir | gzip -9 |
|---|---|---|
| categoría + traducciones | 1,15 MB | 0,30 MB |
| + IPA | 1,57 MB | **0,42 MB** |
| + IPA + definición en inglés | 3,37 MB | 1,12 MB |
| Todas las palabras sin espacios (42.985), con IPA | 3,19 MB | 0,82 MB |

Para unas 20-25k entradas con IPA y sin definición en inglés, estimo **1,8-2,2 MB sin comprimir y 0,45-0,55 MB con gzip/brotli**. Troceado por letra, el trozo más grande (la `s`) pesó 55 KB comprimido en el prototipo; los demás son bastante menores.

## 3. Recomendación

**Fuente principal: FreeDict eng-spa 2025.11.23** (WikDict/Wiktionary, CC BY-SA 3.0), filtrada por frecuencia (`en_50k` o NGSL+SUBTLEX), más un **glosario técnico propio** que prevalece sobre FreeDict en términos de software. Razones: es la única fuente de traducción EN→ES lista para usar, trae IPA y categoría, se procesa con un script corto y es unas 100 veces más pequeña que el volcado de kaikki.

No cubre ejemplos de uso. Si se quieren, se extraen de wiktextract solo para las 20-25k palabras elegidas, en un script de build aparte. Lo dejaría como mejora (C), no como MVP.

**Empaquetado: JSON troceado por letra, generado en build, no una tabla en Neon.**

- Cumple RNF-REN-02: no entra en el JS inicial; se descarga un trozo de pocas decenas de KB al tocar la primera palabra y se guarda en caché del navegador y en memoria. La búsqueda es un acceso a objeto (menos de 1 ms); el límite de 300 ms solo depende de la red la primera vez.
- Neon añade un tercero (excepción en `decisiones.md`, pregunta P1), una consulta de red por palabra, arranque en frío de la base y un uso de ~5 MB frente a 512 MB que no aporta nada con 10 usuarios. Solo tendría sentido si la app ya usara Neon para el progreso.
- **Atención a RNF-SEG-04**: los archivos de `public/` se sirven sin pasar por la sesión. Para que el diccionario también exija sesión, no lo pongas en `public/`: sírvelo desde un Route Handler (`/api/dict/[letra]`) que compruebe la cookie y lea el JSON incluido en el bundle (`outputFileTracingIncludes`), con `Cache-Control: private`. Es un cambio de diseño que conviene fijar en el spec.
- Estructura sugerida: `{ "deploy": [{ "p":"v","t":["desplegar"],"i":"/dɪˈplɔɪ/" }] }`, con un índice `forma→lema` pequeño aparte, cargado en la primera búsqueda.
- Licencia: el JSON generado es una obra derivada de datos CC BY-SA. Guárdalo en una carpeta propia con un `LICENSE` y una página «Créditos» en la app. El código de la app no tendría por qué ser CC BY-SA si los datos se cargan como contenido separado. Es mi lectura de la licencia, no asesoría legal.

**Tamaño estimado:** ~0,5 MB comprimido (~2 MB sin comprimir) en unos 26-30 archivos. Con la definición en inglés serían ~1,3 MB comprimidos, que también cabrían, pero cada trozo crecería bastante.

## 4. Pronunciación (EP6-HU04)

Usar `speechSynthesis` del navegador es viable. `SpeechSynthesisVoice.localService` indica si la voz es local o remota (Baseline desde 2018, según [MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)). Recomendaciones:

- Elegir voces con `lang` que empiece por `en` y `localService === true`. Si solo hay voces remotas, mostrar el botón con un aviso o no mostrarlo (riesgo RG10).
- Mostrar siempre el IPA del diccionario como respaldo, porque el audio depende del dispositivo.
- No he probado qué voces locales hay en iPhone, Android, Chrome y Firefox. Entra en la lista manual de QA con dispositivos reales (§7 de los requisitos). Se añade una prueba de que no sale ninguna petición de red al reproducir, para respaldar RNF-PRI-02.
- Los audios de Wiktionary (20,4 GB en kaikki) no valen: demasiado peso.

## 5. Siguientes pasos (propuestos, sin ejecutar)

1. Registrar la decisión en `decisiones.md`: FreeDict + glosario propio, JSON troceado, Route Handler protegido.
2. En el spec de SP2: script `build-dict` (TEI → JSON por letra + índice de formas) con prueba unitaria de «palabra encontrada / no encontrada» (EP6-HU01).
3. Escribir el glosario técnico en YAML con esquema validado en CI (EP11) y revisión humana.
4. Decidir el criterio de corte (`en_50k` frente a NGSL+SUBTLEX) con una muestra de 200 palabras de las lecturas del MVP.

## Fuentes

- [FreeDict, descargas](https://freedict.org/downloads/) y [base de datos JSON](https://freedict.org/freedict-database.json)
- [Paquete FreeDict eng-spa 2025.11.23 (src)](https://download.freedict.org/dictionaries/eng-spa/2025.11.23/freedict-eng-spa-2025.11.23.src.tar.xz) (licencia en su `teiHeader`)
- [WikDict](http://www.wikdict.com/) y [DBnary](http://kaiko.getalp.org/about-dbnary/)
- [CC BY-SA 3.0, texto legal](https://creativecommons.org/licenses/by-sa/3.0/legalcode)
- [kaikki.org, datos en bruto](https://kaikki.org/dictionary/rawdata.html), [extracto inglés](https://kaikki.org/dictionary/English/index.html) y [extracto Wiktionary español](https://kaikki.org/eswiktionary/)
- [Apertium eng-spa](https://github.com/apertium/apertium-eng-spa) y [paquete en AUR](https://aur.archlinux.org/packages/apertium-eng-spa)
- [NGSL 1.2](https://www.newgeneralservicelist.com/new-general-service-list)
- [FrequencyWords](https://github.com/hermitdave/FrequencyWords)
- [SUBTLEX-US, Brysbaert y New](https://www.doi.org/10.3758/S13428-012-0190-4)
- [MDN, SpeechSynthesisVoice.localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)
