# ¿Qué vemos hoy?

Implementación terminada el 16 de octubre de 2026. Ruta privada: `/que-vemos-hoy`.

## Experiencia

La pantalla ofrece dos fuentes: **Entre mis pendientes** y **Descubrir con mi ADN**. La segunda consulta películas del catálogo por los tres géneros principales del ADN, excluye toda la biblioteca por tipo e ID y ordena por el peso de los géneros coincidentes. Presenta hasta tres opciones con una explicación; permite descartar, elegir y guardar explícitamente en Quiero ver o Viendo. El guardado no sobrescribe títulos existentes si otra pestaña ya los agregó. Un ADN bloqueado o sin géneros muestra una invitación a completarlo; los errores de catálogo, ADN o biblioteca tienen reintento.

Descubrimiento consulta una selección acotada de tres páginas del catálogo, no todo el catálogo; al agotarse lo informa. Usa los criterios de calidad del servicio de recomendaciones existente y no aplica los filtros de tiempo de la selección de pendientes. La afinidad usa géneros, no directores ni el ADN completo. Los eventos `tonight_dna_accepted`, `tonight_dna_dismissed` y `tonight_dna_saved` identifican este flujo separado.

Elegir un modo, ajustar preferencias y buscar. Se presentan una propuesta con motivo y hasta dos alternativas. Abrir una ficha no implica aceptar. `Elegir esta` registra una decisión; `Sí, pasar a Viendo` modifica la biblioteca mediante el servicio existente y sus políticas RLS. Se vuelve a consultar el estado antes de guardar para evitar sobrescribir un título eliminado o terminado desde otra pantalla.

Los seis modos son Sorprendeme, Algo rápido, Quiero reírme, Quiero tensión, Para compartir y Seguir una serie. Para compartir selecciona géneros de la biblioteca individual: no calcula compatibilidad ni garantiza clasificación por edades. Seguir una serie usa únicamente series en Viendo; los otros modos usan pendientes.

## Reglas

- Película, serie o cualquiera; tiempo máximo para películas; exclusión opcional de terror.
- Algo rápido limita a 90 minutos como máximo; puede reducirse a 60.
- Las duraciones desconocidas, no positivas o no finitas no cumplen un límite. No se estima la duración del siguiente episodio de una serie.
- Comedia: género 35. Tensión: thriller 53, misterio 9648 o terror 27. Para compartir: comedia 35, aventura 12/10759 o familia 10751.
- Sin terror exige géneros conocidos y excluye cualquier título con género 27, incluso una comedia de terror.
- Selección aleatoria sin reemplazo entre coincidencias. No usa la calificación externa como preferencia personal ni promete afinidad calculada.
- Otras opciones descarta todas las propuestas visibles durante esta visita. Los descartes se conservan al cambiar filtros. Al agotarse, se pueden recuperar explícitamente o cambiar preferencias; nunca se relajan filtros automáticamente.
- Biblioteca vacía, un solo candidato, falta de coincidencias, fallos de carga y error al guardar tienen estados propios.

## Datos y rendimiento

Se consulta la biblioteca mediante el servicio existente. Se cargan solo los títulos elegibles por estado y formato, con un máximo de cuatro solicitudes simultáneas, progreso visible y cancelación que detiene solicitudes pendientes. Cada consulta de metadata tiene un límite de 15 segundos. La caché de metadata pública en memoria dura 30 minutos y admite hasta 1000 entradas; no guarda datos privados ni persiste la biblioteca. Una solicitud ya iniciada puede terminar después de cancelar, pero su resultado no modifica la pantalla cancelada.

Los fallos de metadata no se almacenan y permiten reintentar. Un título sin metadata puede entrar en Sorprendeme sin filtros, pero nunca en reglas que necesiten confirmar duración o género. Las bibliotecas muy grandes pueden requerir más tiempo en la primera búsqueda; la UI informa el avance y permite cancelar.

El motor puro está en `src/lib/watchTonight.ts`, separado de la carga y la interfaz para reutilizarlo en futuras salas. No requiere migraciones ni nuevos secretos. Se corrigió la lectura de `genreIds` de las respuestas de detalle del catálogo.

## Medición

Eventos: `tonight_started`, `tonight_suggested`, `tonight_empty`, `tonight_dismissed`, `tonight_reset_dismissals`, `tonight_accepted`, `tonight_watching`.

Cada búsqueda nueva crea `decision_id`; las alternativas conservan el identificador. La aceptación incluye tiempo transcurrido. Los eventos incluyen filtros y los identificadores internos de títulos cuando corresponde, sin notas ni reseñas. Utilizan la analítica existente, activa en producción.

Medir decisiones distintas aceptadas / decisiones distintas iniciadas, tiempo hasta aceptar y usuarios que regresan a siete días. Publicar el tamaño de muestra. La meta de aceptación del 30% todavía requiere datos reales.

## Validación y límites del cierre

`npm run test:tonight` cubre filtros, géneros, duración, desconocidos, formatos, estado, descartes y selección sin duplicados. `npm run build` valida TypeScript y compilación; `npm run lint` revisa el código.

Pendiente en producción: comprobar la experiencia móvil y escritorio con una cuenta real, guardar y recargar Viendo, simular un fallo de catálogo y verificar eventos en analítica. No se da por validada la adopción ni el despliegue solo por completar la implementación.

El nivel de atención y filtros arbitrarios de géneros quedan fuera de esta entrega: no hay metadata fiable para inferir atención y los modos cubren los géneros iniciales. Plataformas, votación compartida y compatibilidad pertenecen a etapas posteriores.
