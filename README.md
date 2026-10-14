# Bump Kino · 0.1.2

Plugin independiente para ver **Bump (2021)** en Kino, para Kino 0.9.55 o superior.
Incluye cinco temporadas con diez capítulos cada una: **50 videos**, asociados por los nombres
`SxxExx` de tus archivos en VOE. Fichas e imágenes de [BetaSeries](https://www.betaseries.com/es/show/bump-2021).

## Dominios de VOE · 0.1.2

La resolución sigue las redirecciones HTTP y JavaScript de VOE al mismo video, incluso a un
dominio nuevo, con el permiso general HTTPS de API 9 aprobado. No hace falta publicar una
versión por cada cambio de dirección. El plugin no concede permisos por sí mismo.

Se guarda solo el dominio del reproductor que resolvió correctamente, durante hasta 30 días,
para conservar la consulta directa en las próximas reproducciones. Si el reproductor directo
no responde o devuelve HTTP 404/410, se puede consultar una vez el enlace base de VOE, dentro
del mismo límite de tiempo. Las restricciones de acceso y verificaciones humanas no se reintentan.

El máximo sigue siendo tres páginas y 18 segundos de resolución, con margen para el límite de
20 segundos de Kino. Cambios en el formato del reproductor, contenido eliminado o verificaciones
humanas todavía pueden requerir una corrección o impedir reproducir.

Se mantienen el identificador `bump-kino`, los 50 capítulos, fichas, imágenes y referencias del progreso.

## Contenido

- Una tarjeta de Bump en Inicio y en la búsqueda. Al abrirla, Kino ofrece el selector de temporadas.
- Título original y sinopsis breve en español de los 50 capítulos, basada en las fichas de BetaSeries.
- Miniatura específica de 22 capítulos. Los otros 28 usan el póster de la serie porque BetaSeries
  no publica una imagen específica en sus fichas.
- Reproducción HLS desde el reproductor público de VOE y los subtítulos que ese reproductor entrega.
- Enlaces de reproducción obtenidos al pulsar Play, sin guardar direcciones temporales de video.

BetaSeries incluye un especial como episodio 11 de la temporada 4, **Bump: A Christmas Film**.
No está en las carpetas proporcionadas y no se muestra como un capítulo reproducible.

## Instalar o actualizar

1. Actualiza Kino a **0.9.55 o superior**.
2. Abre **Ajustes → Plugins → Bump Kino → Buscar actualización**.
3. Acepta una vez el permiso en rojo **Puede conectarse a cualquier servidor público de internet
   (solo https, nunca tu red local)** y comprueba que muestre **0.1.2**.
4. Para instalar desde cero, agrega `efraynns-stack/Bump`. Abre Bump, selecciona una temporada
   y prueba un capítulo.

Repositorio: [efraynns-stack/Bump](https://github.com/efraynns-stack/Bump).

## Permisos y límites

El catálogo está incluido: abrirlo no descarga 50 fichas cada vez. VOE se consulta al reproducir.
Los dominios principales declarados siguen siendo `voe.sx`, `teresapoliticallearn.com` y
`megankiddifference.com`. El manifiesto usa `apiVersion: 9`, `fetchHosts: "any"` y
`streamHosts: "any"`. El permiso general permite nuevas direcciones públicas por HTTPS en el
puerto 443; Kino aplica el bloqueo de redes locales y los límites de consultas. Si ese permiso
no está activo, solo se siguen los dominios conocidos y no se utiliza un nuevo dominio guardado.
No se usa navegador oculto, sesión de usuario, clave de API, descarga de videos ni telemetría.

Una verificación humana, un archivo eliminado o un cambio del reproductor termina con un error
controlado. El plugin no resuelve CAPTCHA ni evita restricciones de acceso o DRM.

## Desarrollo

Kino instala `plugin.js`, generado a partir de `catalog.json` y `src/plugin.js`.
Para modificarlo, edita esos archivos y ejecuta:

```sh
node build.mjs
node sdk/validate.mjs .
node --test test/plugin.test.mjs
```

Conserva los identificadores `bump:temporada:numero` para mantener el progreso. Para cambiar un
video, actualiza su `videoCode` en `catalog.json`, genera de nuevo `plugin.js` y aumenta la versión
del manifiesto. El catálogo es una instantánea del 8 de octubre de 2026; no se actualiza
automáticamente desde las carpetas.

El SDK procede de la plantilla oficial. `contract.json` y `kino.d.ts` se actualizaron a la
referencia oficial API 9. El validador muestra el nuevo consentimiento; las expectativas del
kit se adaptaron a la referencia. El shim sigue siendo anterior y no reproduce el permiso
nativo general ni sus cuotas: las pruebas de dominio nuevo modelan únicamente hosts ficticios
permitidos. La aprobación real debe comprobarse en Kino. El lector VOE está adaptado del trabajo previo en Toku Kino. La licencia del código no
concede derechos sobre las fichas, las imágenes de BetaSeries, la serie ni los videos.
