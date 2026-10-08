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
