# Bump Kino · 0.1.1

Plugin independiente para ver **Bump (2021)** en Kino, compatible con la versión 0.9.53.
Incluye cinco temporadas con diez capítulos cada una: **50 videos**, asociados por los nombres
`SxxExx` de tus archivos en VOE. Fichas e imágenes de [BetaSeries](https://www.betaseries.com/es/show/bump-2021).

## Actualización de VOE · 13 de octubre de 2026

VOE cambió el dominio público de su reproductor. La 0.1.1 declara el nuevo servidor y obtiene
los enlaces HLS desde él. Conserva el identificador `bump-kino`, los 50 capítulos, sus fichas
y las referencias del progreso.

Si ya lo tienes instalado, sube los archivos actualizados a tu mismo repositorio y ve a
**Ajustes → Plugins → Bump Kino → Buscar actualización**. Acepta el nuevo dominio que Kino
mostrará y comprueba que la versión sea **0.1.1**.

## Contenido

- Una tarjeta de Bump en Inicio y en la búsqueda. Al abrirla, Kino ofrece el selector de temporadas.
- Título original y sinopsis breve en español de los 50 capítulos, basada en las fichas de BetaSeries.
- Miniatura específica de 22 capítulos. Los otros 28 usan el póster de la serie porque BetaSeries
  no publica una imagen específica en sus fichas.
- Reproducción HLS desde el reproductor público de VOE y los subtítulos que ese reproductor entrega.
- Enlaces de reproducción obtenidos al pulsar Play, sin guardar direcciones temporales de video.

BetaSeries incluye un especial como episodio 11 de la temporada 4, **Bump: A Christmas Film**.
No está en las carpetas proporcionadas y no se muestra como un capítulo reproducible.

## Instalación desde GitHub

1. Crea un repositorio público nuevo llamado **BumpKino** en tu cuenta. Puedes usar
   [la plantilla oficial](https://github.com/kinotvapp/kino-plugin-archive) con **Use this template → Create a new repository**.
2. Descomprime este paquete y sube **el contenido** de `Bump-Kino-0.1.1` al repositorio.
   `kino-plugin.json` y `plugin.js` deben quedar en la raíz.
3. Cuando estén subidos, en el televisor abre **Ajustes → Plugins → Agregar un plugin** y escribe
   `efraynns-stack/BumpKino` si lo creaste con ese nombre y en esa cuenta.
4. Instala el plugin. Abre Bump, selecciona la temporada y prueba un capítulo.

Este paquete no crea ni publica el repositorio por sí mismo. No reemplaza PSXtv ni Toku Kino.

## Permisos y límites

El catálogo está incluido: abrirlo no descarga 50 fichas cada vez. VOE se consulta al reproducir.
Los dominios declarados son `voe.sx`, el anterior `teresapoliticallearn.com` y el actual
`megankiddifference.com`. Se abre directamente el actual para evitar una
consulta extra antes de encontrar el video. El tiempo total de resolución está limitado a 18 segundos.
El manifiesto usa `apiVersion: 4` y `streamHosts: "any"`, porque VOE entrega videos y subtítulos
desde servidores CDN variables. Kino muestra ese permiso al instalar. No se usa navegador oculto,
sesión de usuario, clave de API, descarga de videos ni telemetría.

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

Los archivos `sdk/`, `contract.json`, `kino.d.ts` y `GUIDE.md` proceden de la plantilla oficial de
Kino. El lector VOE está adaptado del trabajo previo en Toku Kino. La licencia del código no
concede derechos sobre las fichas, las imágenes de BetaSeries, la serie ni los videos.
