# Dominios de VOE · Bump Kino 0.1.2

Requiere Kino 0.9.55+ y la aprobación del permiso general HTTPS de API 9.

- Manifiesto y exportaciones aceptados por el validador, con la nueva línea de consentimiento en rojo.
- 32 pruebas del plugin aprobadas, ninguna fallida. Verifican los 50 capítulos, cinco temporadas, fichas y referencias, redirecciones HTTP/JavaScript a nuevos dominios, permiso no aprobado, rutas distintas, ciclos, límite de tres páginas, cuotas y tiempo total.
- El kit pasa: 207 pruebas aprobadas, 11 omitidas por sus condiciones originales y ninguna fallida. Referencia oficial API 9 y aviso de aprobación igual que en Toku Kino 0.3.5. El shim es anterior y no implementa el permiso nativo general ni sus cuotas: las pruebas modelan hosts ficticios y errores nativos explícitamente.
- Se reutiliza solo el dominio de un reproductor que entregó HLS, hasta 30 días. Nunca se guardan enlaces de reproducción temporales, códigos de video en esta caché, cookies ni sesiones. Sin permiso activo, un dominio nuevo guardado no se consulta.
- La consulta directa conserva la ruta rápida; ante un fallo de transporte o HTTP 404/410 del primer espejo, se puede consultar una vez el enlace estable del mismo video en VOE. Verificaciones humanas y restricciones de acceso no se reintentan.
- El build de plugin.js a partir de src/plugin.js y catalog.json es reproducible. El catálogo coincide con GitHub y no se modifica. Se sincroniza el fuente que había quedado en 0.1.0 al subir manualmente solo el plugin compilado.
- Muestras reales S1E1, S3E1 y S5E1: HLS VOD y variantes HTTP 200, segmentos por rango HTTP 206. Subtítulos en español HTTP 200 en S1 y S3; S5 no entregó pistas. Informe: test/voe-update-live-results.json.
- La aprobación general y la reproducción audiovisual todavía deben probarse en Android TV tras actualizar Kino; no se ha visto todo el catálogo.

Fuentes de referencia: https://kinotvapp.github.io/kino-plugins/reference/contract.json y https://kinotvapp.github.io/kino-plugins/reference/kino.d.ts, descargadas el 14 de octubre de 2026 UTC.

---

Registro de validación de la versión inicial:

# Validación de Bump Kino 0.1.0

Comprobaciones realizadas el 8 de octubre de 2026:

- Cinco carpetas VOE con diez archivos por temporada. Se relacionaron 50 códigos de video únicos por los nombres SxxExx, sin inferir el orden de los archivos.
- Las 50 fichas de BetaSeries coinciden con la temporada y el número del capítulo. Hay 22 miniaturas específicas; los otros 28 capítulos tienen una imagen de respaldo de la misma serie.
- Manifiesto, exports y respuestas de Inicio, búsqueda, catálogo y episodios aceptados por el SDK oficial sin entradas descartadas.
- Diez pruebas automáticas pasan: integridad del catálogo, referencias estables, reproducción y subtítulos en una solicitud, rechazo de redirecciones ajenas y capítulos inexistentes, verificación humana, cambio de formato y límite HTTP 429.
- En el capítulo 1 de cada temporada se recuperaron listas HLS válidas, variantes VOD y un segmento de video con HTTP 206. Los subtítulos en español de las muestras de temporadas 3 y 4 respondieron HTTP 200. Las pistas dependen de cada archivo de VOE.
- Póster de respaldo, fondo y una miniatura específica respondieron HTTP 200.

El SDK usa Node como aproximación del entorno de Kino. Estas comprobaciones verifican los datos y la entrega de video; todavía hace falta instalar este plugin nuevo en el televisor y confirmar reproducción, navegación y continuidad allí. No se afirma haber visto los 50 capítulos completos.

El paquete contiene únicamente código, catálogo, documentación, SDK y pruebas con URLs de ejemplo. No incluye sesiones, cookies, claves de API ni enlaces de video temporales.
