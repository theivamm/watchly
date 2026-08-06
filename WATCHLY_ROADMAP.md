# Watchly — Hoja de ruta de producto

## 1. Propósito

Este documento define la evolución planificada de Watchly después de su primera versión funcional.

La hoja de ruta organiza las próximas mejoras de la aplicación bajo una regla central:

> **Incorporar una función diferencial por etapa, medir su uso y consolidarla antes de avanzar.**

No es un calendario rígido. Es un orden de producto basado en dependencias, valor para el usuario y complejidad técnica. Las fechas se asignarán cuando se conozcan la capacidad del equipo, el estado real de la aplicación y los resultados de cada fase.

---

## 2. Visión

Watchly comenzó como un perfil público para registrar películas y series. Su evolución debe convertirla en una plataforma que:

1. Guarda lo que viste y lo que querés ver.
2. Entiende cómo es tu gusto audiovisual.
3. Te ayuda a elegir qué mirar.
4. Te conecta con otras personas a partir de afinidades reales.
5. Conserva los recuerdos asociados a cada historia.
6. Convierte tu recorrido audiovisual en algo visual y compartible.

### Posicionamiento buscado

> **Watchly es tu identidad audiovisual: lo que viste, lo que sentiste y lo próximo que querés descubrir.**

La aplicación no debe competir únicamente por tener el catálogo más grande. Su diferencial estará en transformar una biblioteca en identidad, decisiones, recuerdos y conexiones.

---

## 3. Principios de producto

### 3.1 Una función principal por etapa

Cada etapa tendrá:

- Un problema concreto.
- Una función protagonista.
- Un alcance controlado.
- Métricas de adopción.
- Criterios de salida.

Las mejoras técnicas necesarias para sostener esa función no cuentan como funciones adicionales, pero deben limitarse a lo indispensable.

### 3.2 Mobile-first

Todas las experiencias deben diseñarse primero para celular y luego adaptarse a desktop.

### 3.3 Valor antes que complejidad social

Watchly debe ser útil aun cuando el usuario no siga a nadie. La capa social se incorporará sobre una experiencia personal ya valiosa.

### 3.4 Privacidad controlada

El usuario decide qué títulos, listas, estadísticas, notas y módulos aparecen públicamente.

### 3.5 Explicabilidad

Los cálculos de ADN, compatibilidad o selección deben poder explicarse. No se utilizarán resultados opacos cuando una regla determinista sea suficiente.

### 3.6 Compartir sin obligar

Las tarjetas y perfiles públicos deben ser atractivos, pero ninguna función deberá obligar al usuario a publicar información.

### 3.7 No depender de IA para la propuesta central

La inteligencia artificial puede mejorar redacción o recomendaciones más adelante, pero la experiencia principal debe funcionar sin costos variables elevados ni dependencia de un proveedor de IA.

### 3.8 Medir antes de expandir

Una función no se considera terminada solo porque esté publicada. Debe demostrar que resuelve su problema y que los usuarios la entienden.

---

## 4. Estado base de Watchly

Antes de esta hoja de ruta, Watchly debe contar con una base estable:

- Registro con Google.
- Registro con email y confirmación.
- Recuperación de contraseña.
- Perfil con foto, nombre, username y biografía.
- Perfil público compartible.
- Tema light, dark y system.
- Color de acento por perfil.
- Búsqueda de películas y series mediante un proveedor audiovisual.
- Biblioteca personal.
- Estados: quiero ver, viendo, terminada, en pausa y abandonada.
- Calificación y reseña.
- Favoritos.
- Progreso para series.
- Listas públicas y privadas.
- Responsive mobile y desktop.
- Supabase Auth, Database, Storage y Edge Functions.
- Schema propio `watchly`.
- RLS y privacidad probadas.

### Condición para comenzar la hoja de ruta

La base se considera estable cuando:

- El flujo registro → onboarding → primer título funciona sin intervención.
- La búsqueda tiene una tasa de error aceptable.
- No existen filtraciones de datos privados.
- El perfil público carga correctamente sin sesión.
- La aplicación tiene analítica básica y registro de errores.

---

## 5. Resumen de etapas

| Etapa | Función protagonista | Valor principal | Dependencia clave |
| ---: | --- | --- | --- |
| 0 | Consolidación del núcleo | Confianza y estabilidad | MVP existente |
| 1 | ADN Audiovisual | Identidad y viralidad | Biblioteca + metadata |
| 2 | ¿Qué vemos hoy? | Ayuda para decidir | Watchlist y filtros |
| 3 | Compatibilidad | Conexión entre perfiles | ADN estable |
| 4 | Modo pareja o grupo | Decisión compartida | Compatibilidad y salas |
| 5 | Cápsula después de verla | Recuerdo emocional | Historial y reseñas |
| 6 | Línea de tiempo y rewatch | Memoria longitudinal | Fechas y eventos |
| 7 | Pasaporte cinematográfico | Exploración cultural | Países normalizados |
| 8 | Retos personales | Hábitos y retención | Estadísticas confiables |
| 9 | Estanterías por contexto | Organización útil | Etiquetas y filtros |
| 10 | Prestame tu perfil | Recomendación social | Perfiles y colecciones |
| 11 | Mensaje al futuro | Vínculo emocional | Notas y tareas programadas |
| 12 | Créditos personales del año | Recapitulación compartible | Historial anual completo |

---

# Etapa 0 — Consolidación del núcleo

## Objetivo

Asegurar que la aplicación actual sea confiable antes de incorporar funciones diferenciales.

## Problema que resuelve

Una función atractiva no genera valor si el usuario no puede registrarse, encontrar un título o guardar correctamente su biblioteca.

## Alcance

- Auditoría completa de autenticación.
- Revisión de emails de confirmación y recuperación.
- Pruebas de Google OAuth.
- QA de biblioteca, listas y perfil público.
- Revisión de RLS con diferentes usuarios y sesión anónima.
- Manejo de errores del proveedor audiovisual.
- Caché y rate limiting de búsquedas.
- Estados de carga, vacío y error.
- Analítica base.
- Registro de errores del frontend y Edge Functions.
- Mejora de rendimiento de imágenes.
- Revisión de accesibilidad.
- Páginas legales y eliminación de cuenta.

## No incluye

- Nuevas funciones sociales.
- Recomendaciones.
- Gamificación.
- Inteligencia artificial.

## Métricas

- Registro completado.
- Onboarding completado.
- Primer título agregado.
- Errores por sesión.
- Tiempo de respuesta de búsqueda.
- Tasa de éxito de escritura en biblioteca.

## Criterio de salida

- Flujo principal probado de punta a punta.
- RLS validada.
- Errores críticos resueltos.
- Analítica y observabilidad activas.
- Al menos una prueba controlada con usuarios reales.

---

# Etapa 1 — ADN Audiovisual

## Objetivo

Transformar la biblioteca del usuario en un perfil visual de gustos.

## Propuesta de valor

> Descubrí qué dice tu biblioteca sobre tu forma de mirar historias.

## Función protagonista

Un ADN calculado con:

- Géneros principales.
- Películas versus series.
- Décadas predominantes.
- Países e idiomas frecuentes.
- Duración media de películas.
- Tendencia de calificaciones.
- Directores y actores recurrentes.
- Etiquetas de gusto.
- Frase resumen.
- Nivel de confianza.

## Experiencia

- Bloqueado entre 0 y 4 títulos válidos.
- Preliminar desde 5 títulos.
- Completo desde 10 títulos.
- Evoluciona al actualizar la biblioteca.
- Visible en el perfil si el usuario lo permite.
- Tarjeta compartible en formatos sociales.

## Dependencias

- Géneros normalizados.
- Fechas de estreno.
- Países e idiomas.
- Runtime.
- Creadores y reparto cuando estén disponibles.
- Calificaciones personales.

## Alcance técnico

- Tabla `watchly.user_dna`.
- Algoritmo determinista versionado.
- Recálculo asíncrono.
- Configuración de visibilidad.
- Ruta privada `/adn`.
- Ruta pública `/@:username/adn`.
- Generación de tarjeta compartible.

## Métrica norte

Porcentaje de usuarios elegibles que visualizan y comparten su ADN.

## Criterio de salida

- Cálculos probados y consistentes.
- ADN funcional en light y dark.
- Privacidad validada.
- Al menos 20% de usuarios con ADN desbloqueado inicia una acción de compartir o guardar la tarjeta.

## Documento específico

Consultar `WATCHLY_ADN_AUDIOVISUAL.md` para reglas, datos y criterios completos.

---

# Etapa 2 — ¿Qué vemos hoy?

## Objetivo

Ayudar al usuario a decidir qué mirar entre sus propios títulos pendientes.

## Problema

Las personas guardan muchos títulos, pero vuelven a perder tiempo eligiendo.

## Propuesta de valor

> Decinos cómo es tu momento y Watchly elige entre lo que ya querías ver.

## Flujo principal

1. El usuario abre `¿Qué vemos hoy?`.
2. Selecciona condiciones rápidas.
3. Watchly filtra su watchlist.
4. Presenta una elección principal y hasta dos alternativas.
5. El usuario acepta, descarta o vuelve a sortear.
6. Si acepta, el título pasa opcionalmente a `watching`.

## Filtros iniciales

- Película o serie.
- Tiempo disponible.
- Estado de ánimo.
- Nivel de atención.
- Solo o acompañado.
- Géneros permitidos.
- Géneros a evitar.
- Solo títulos no vistos.

## Modos

```text
Sorprendeme
Algo rápido
Quiero reírme
Quiero tensión
Para ver acompañado
Seguir una serie
```

## Algoritmo inicial

- Reglas deterministas.
- Selección aleatoria ponderada.
- No requiere IA.
- Prioriza títulos con metadata completa.
- Evita repetir descartes recientes.
- No confunde calificación externa con gusto personal.

## Alcance técnico

- Preferencias de sesión.
- Historial breve de sugerencias.
- Normalización de runtime y géneros.
- Endpoint seguro de selección.
- Eventos de aceptación y descarte.

## Privacidad

- Los filtros no se publican.
- La selección no cambia el estado automáticamente sin confirmación.

## Métricas

- Sesiones iniciadas.
- Selecciones aceptadas.
- Tiempo hasta elegir.
- Títulos iniciados desde la función.
- Repetición de uso a 7 días.

## Criterio de salida

- El usuario obtiene una sugerencia válida en pocos pasos.
- Se manejan correctamente watchlists pequeñas y vacías.
- Al menos 30% de las sesiones termina en una elección aceptada.

---

# Etapa 3 — Compatibilidad entre perfiles

## Objetivo

Convertir el ADN en una conexión significativa entre dos personas.

## Problema

Ver bibliotecas ajenas es interesante, pero no explica rápidamente qué gustos se comparten.

## Propuesta de valor

> Descubrí cuánto comparten sus pantallas.

## Experiencia

Al visitar un perfil público, el usuario autenticado puede ver:

- Porcentaje de compatibilidad.
- Géneros compartidos.
- Títulos vistos por ambos.
- Títulos en los que coinciden en calificación.
- Diferencias llamativas.
- Pendientes compartidos.
- Una película o serie sugerida para ver juntos.

## Reglas iniciales

La compatibilidad debe considerar:

- Coincidencia de géneros.
- Coincidencia de títulos.
- Cercanía de calificaciones.
- Preferencia por películas o series.
- Décadas y países.

No debe basarse solo en títulos idénticos, porque bibliotecas pequeñas producirían resultados pobres.

## Condiciones

- Ambos usuarios deben tener ADN al menos `developing`.
- Solo se usan datos autorizados para comparación.
- Los títulos privados pueden aportar a un cálculo agregado únicamente si el usuario lo permite expresamente.
- No se revelan títulos privados.

## Alcance técnico

- Algoritmo de compatibilidad versionado.
- Caché temporal de resultados.
- Preferencia `allow_compatibility`.
- Tarjeta compartible opcional.

## Métricas

- Comparaciones realizadas.
- Visitas a perfiles desde comparaciones compartidas.
- Uso de `Ver algo juntos`.

## Criterio de salida

- El resultado es estable, explicable y respeta privacidad.
- La comparación genera una acción posterior medible.

---

# Etapa 4 — Modo pareja o grupo

## Objetivo

Resolver la elección de contenido entre varias personas.

## Problema

Los grupos suelen pasar más tiempo comparando opciones que mirando algo.

## Propuesta de valor

> Una sala, varias personas y una decisión sin discusiones eternas.

## Flujo

1. Una persona crea una sala.
2. Comparte un enlace o código.
3. Los participantes se unen con cuenta o como invitados.
4. Definen plataformas, tiempo y tipo de contenido.
5. Cada uno vota portadas con `Sí`, `No` o `Me da igual`.
6. Watchly encuentra coincidencias.
7. Si hay empate, propone un desempate o selección aleatoria.

## Alcance inicial

- Salas temporales.
- Entre 2 y 8 participantes.
- Votación asincrónica breve.
- Resultado final.
- Sin chat.
- Sin videollamada.
- Sin grupos permanentes.

## Dependencias

- Motor de selección de Etapa 2.
- Compatibilidad de Etapa 3.
- Realtime o polling controlado.
- Expiración automática de salas.

## Métricas

- Salas creadas.
- Participantes por sala.
- Salas que llegan a una selección.
- Tiempo promedio de decisión.

## Criterio de salida

- La mayoría de las salas activas produce un resultado.
- El flujo invitado funciona sin fricción.
- Las salas expiran y no generan acumulación innecesaria.

---

# Etapa 5 — Cápsula después de verla

## Objetivo

Capturar la memoria emocional de una película o serie.

## Problema

Una calificación resume cuánto gustó, pero no conserva por qué fue importante.

## Propuesta de valor

> Guardá lo que te dejó una historia antes de que se te escape.

## Flujo

Al marcar un título como terminado, Watchly pregunta opcionalmente:

1. ¿Qué sensación te dejó?
2. ¿La volverías a ver?
3. ¿A quién se la recomendarías?
4. ¿Dónde o con quién la viste?
5. ¿Querés dejar una nota privada?

## Características

- Respuestas rápidas mediante chips.
- Texto libre opcional.
- Bloque sin spoilers.
- Bloque con spoilers protegido.
- Visibilidad pública o privada.
- Edición posterior.

## Datos sugeridos

```text
emotion_tags
rewatch_intent
recommendation_context
memory_note
spoiler_note
watched_with
watched_context
visibility
```

## Métricas

- Cápsulas iniciadas.
- Cápsulas completadas.
- Porcentaje de títulos terminados con cápsula.
- Relecturas posteriores.

## Criterio de salida

- La cápsula puede completarse en menos de un minuto.
- Las notas con spoilers están correctamente protegidas.
- El usuario entiende la diferencia entre reseña y recuerdo.

---

# Etapa 6 — Línea de tiempo y rewatch

## Objetivo

Convertir Watchly en un historial audiovisual longitudinal.

## Problema

Sobrescribir un estado o una calificación elimina la evolución del usuario.

## Propuesta de valor

> Mirá cómo cambió tu relación con las historias a lo largo del tiempo.

## Funciones

- Línea de tiempo por mes y año.
- Fechas de inicio y finalización.
- Historial de revisiones.
- Calificación diferente por cada visualización.
- Cápsula diferente por cada revisión.
- Hitos personales.

## Ejemplo

```text
Primera vez — 2022: 3 estrellas
Segunda vez — 2026: 4,5 estrellas
```

## Cambio de modelo requerido

Separar conceptualmente:

- Relación permanente con el título.
- Evento individual de visualización.

Tabla sugerida:

```text
watchly.watch_events
```

## Hitos iniciales

- Película número 100.
- Serie número 25.
- Primera revisión.
- Mes con más títulos.
- Década nueva explorada.

## Métricas

- Eventos históricos registrados.
- Rewatches registrados.
- Visitas a la línea de tiempo.

## Criterio de salida

- Migración sin pérdida de datos existentes.
- Varias visualizaciones del mismo título se representan correctamente.

---

# Etapa 7 — Pasaporte cinematográfico

## Objetivo

Mostrar la diversidad geográfica de la biblioteca e incentivar exploración.

## Problema

El usuario ve países de origen como metadata aislada, no como parte de su recorrido.

## Propuesta de valor

> Recorré el mundo a través de las historias que viste.

## Experiencia

- Mapa del mundo coloreado por títulos vistos.
- Países descubiertos.
- Cantidad de títulos por país.
- Primer título visto de cada país.
- Regiones todavía no exploradas.
- Tarjeta compartible.

## Reglas

- Las coproducciones cuentan proporcionalmente en estadísticas.
- Para desbloquear un país en el mapa alcanza con una producción asociada.
- Debe diferenciar país de producción y ubicación de la historia cuando corresponda.
- La primera versión usa país de producción.

## Dependencias

- Países normalizados desde Etapa 1.
- Mapa accesible.
- Historial confiable.

## Métricas

- Visitas al pasaporte.
- Nuevos países agregados por usuario.
- Tarjetas compartidas.

## Criterio de salida

- El mapa tiene alternativa textual completa.
- Las coproducciones se representan sin duplicar totales.

---

# Etapa 8 — Retos personales

## Objetivo

Ayudar al usuario a explorar y sostener un hábito sin convertir Watchly en una competencia tóxica.

## Problema

Las personas quieren ampliar sus gustos, pero una watchlist abierta no ofrece dirección.

## Propuesta de valor

> Elegí un recorrido y seguí tu progreso a tu manera.

## Retos iniciales

- Ver una cantidad de películas durante el año.
- Terminar una cantidad de series.
- Explorar determinados países.
- Recorrer décadas.
- Completar una saga.
- Ver una película argentina por mes.
- Explorar nuevos géneros.

## Tipos

- Plantillas de Watchly.
- Retos personales configurables.
- Retos privados por defecto.

## Reglas de bienestar

- Sin rankings globales iniciales.
- Sin rachas punitivas.
- Sin mensajes que incentiven consumo excesivo.
- El progreso puede pausarse.
- Priorizar exploración sobre cantidad de horas.

## Métricas

- Retos creados.
- Retos con progreso.
- Retos completados.
- Retención de usuarios con reto activo.

## Criterio de salida

- El progreso se actualiza automáticamente.
- Los retos no alteran datos históricos.
- La comunicación evita presión innecesaria.

---

# Etapa 9 — Estanterías por contexto

## Objetivo

Organizar contenido según el momento en que sería útil verlo.

## Problema

Las listas por género no siempre responden a situaciones reales.

## Propuesta de valor

> Guardá cada historia para el momento indicado.

## Estanterías sugeridas

- Para una noche de lluvia.
- Para ver en pareja.
- Para ver con chicos.
- Para cuando no quiero pensar.
- Menos de 90 minutos.
- Para llorar tranquilo.
- Para recomendar sin quedar mal.
- Para prestar atención de verdad.

## Diferencia con listas

- Una lista es una colección manual y temática.
- Una estantería combina reglas automáticas con selección personal.
- Puede actualizarse cuando cambia la biblioteca.

## Alcance

- Plantillas de contexto.
- Reglas editables.
- Agregado manual.
- Sugerencias basadas en metadata y cápsulas.
- Visibilidad privada por defecto.

## Métricas

- Estanterías creadas.
- Títulos iniciados desde una estantería.
- Reutilización de una misma estantería.

## Criterio de salida

- Las reglas son comprensibles y editables.
- No se duplican innecesariamente las listas existentes.

---

# Etapa 10 — Prestame tu perfil

## Objetivo

Permitir compartir una selección personal sin exponer toda la biblioteca.

## Problema

Compartir el perfil completo puede ser demasiado cuando solo se quiere recomendar algo concreto.

## Propuesta de valor

> Armá una ventana a tu gusto y compartila con quien quieras.

## Formatos

- Mis 10 recomendaciones.
- Películas para conocerme.
- Lo mejor que vi este año.
- Qué ver conmigo.
- Series que siempre recomiendo.
- Selección personalizada.

## Experiencia

- Selección manual o asistida.
- Portada y descripción.
- URL propia.
- Duración opcional del enlace.
- Perfil simplificado.
- Sin necesidad de mostrar estadísticas generales.

## Privacidad

- Nunca incluir títulos privados sin confirmación explícita.
- Permitir desactivar el enlace.
- Permitir fecha de vencimiento.

## Métricas

- Perfiles prestados creados.
- Visitas externas.
- Títulos abiertos desde esas selecciones.

## Criterio de salida

- La selección puede compartirse en menos de dos minutos.
- Los enlaces desactivados dejan de ser accesibles inmediatamente.

---

# Etapa 11 — Mensaje al futuro

## Objetivo

Crear una relación emocional entre el usuario actual y sus propias opiniones futuras.

## Problema

Las impresiones cambian, pero normalmente no queda registro de lo que se pensaba en un momento determinado.

## Propuesta de valor

> Dejá una nota para la próxima vez que esta historia vuelva a encontrarte.

## Flujo

Después de terminar o volver a ver un título:

1. Escribir una nota privada.
2. Elegir cuándo desbloquearla.
3. Recibirla dentro de Watchly al llegar la fecha.

## Desbloqueos

- En seis meses.
- En un año.
- En una fecha personalizada.
- La próxima vez que marque el título como visto.

## Alcance inicial

- Notas privadas.
- Centro de mensajes desbloqueados.
- Aviso por email opcional.
- Sin push notification obligatoria.

## Seguridad

- Cifrado en tránsito y controles estrictos de acceso.
- Las notas nunca aparecen en el perfil público.
- Eliminación disponible antes del desbloqueo.

## Métricas

- Mensajes creados.
- Mensajes desbloqueados.
- Mensajes abiertos.
- Usuarios que registran un rewatch después de abrirlos.

## Criterio de salida

- Programación confiable.
- Zona horaria correcta.
- Ningún mensaje privado accesible por terceros.

---

# Etapa 12 — Créditos personales del año

## Objetivo

Cerrar el ciclo anual con una experiencia visual, emocional y compartible.

## Problema

Las estadísticas anuales suelen reducirse a números y no cuentan una historia personal.

## Propuesta de valor

> Tu año tuvo historias. Estos son sus créditos finales.

## Contenido posible

- Primera y última película del año.
- Series terminadas.
- Mejor calificada.
- Mayor sorpresa.
- Género principal.
- Países recorridos.
- Década más vista.
- Actor y director recurrentes.
- Título más revisitado.
- Evolución del ADN.
- Cápsulas destacadas.
- Retos completados.

## Formato

- Historia vertical animada.
- Resumen navegable dentro de Watchly.
- Tarjetas estáticas descargables.
- URL pública opcional.

## Requisitos

- Historial anual completo.
- Eventos de visualización.
- ADN y snapshots.
- Metadata estable.
- Generación eficiente para muchos usuarios.

## Métricas

- Recaps generados.
- Recaps completados.
- Compartidos.
- Nuevas visitas y registros desde enlaces.

## Criterio de salida

- Los resultados son correctos y reproducibles.
- El usuario puede ocultar cualquier dato.
- La generación escala sin degradar la aplicación principal.

---

## 6. Trabajo transversal entre etapas

Aunque se lance una función protagonista por vez, existen líneas de trabajo permanentes.

### Seguridad

- RLS para todas las tablas.
- Auditoría de endpoints.
- Rotación de secretos.
- Prevención de abuso.
- Rate limiting.
- Eliminación y exportación de cuenta.

### Rendimiento

- Optimización de imágenes.
- Caché de metadata.
- Paginación.
- Cálculos asíncronos.
- Monitoreo de consultas lentas.
- Presupuesto de rendimiento por pantalla.

### Accesibilidad

- WCAG AA.
- Navegación con teclado.
- Lectores de pantalla.
- Alternativas textuales para visualizaciones.
- Reduced motion.
- Contraste en todos los acentos.

### Analítica

- Embudo de registro.
- Activación con primer título.
- Retención a 7 y 30 días.
- Adopción de cada nueva función.
- Compartidos y adquisición referida.
- No enviar contenido privado a analítica.

### Calidad de datos

- Modelo audiovisual normalizado.
- Independencia relativa del proveedor externo.
- Corrección de duplicados.
- Actualización de metadata.
- Versionado de algoritmos.

### Internacionalización

- Textos preparados para traducción.
- Fechas y números localizados.
- Países e idiomas normalizados.
- Zona horaria del usuario.

### Diseño

- Sistema de componentes.
- Consistencia light/dark.
- Acentos controlados.
- Estados de carga, vacío y error.
- Tarjetas compartibles coherentes.

---

## 7. Estrategia social

La capa social debe incorporarse progresivamente.

### Nivel 1 — Identidad pública

- Perfil.
- Biblioteca pública.
- Listas.
- ADN.

### Nivel 2 — Conexión sin red social

- Compatibilidad.
- Perfiles prestados.
- Salas temporales.

### Nivel 3 — Relaciones persistentes, solo si existe demanda

Posibles funciones futuras no comprometidas:

- Seguir perfiles.
- Feed de actividad.
- Reacciones.
- Comentarios.

Estas funciones no deben implementarse automáticamente. Requieren moderación, bloqueo, reportes, controles de privacidad y evidencia de demanda.

---

## 8. Notificaciones

No crear un sistema complejo de notificaciones desde el inicio.

### Primera etapa

- Confirmación de cuenta.
- Recuperación de contraseña.
- Mensajes transaccionales esenciales.

### Etapas posteriores

- ADN actualizado, preferentemente dentro de la app.
- Invitación a sala.
- Mensaje al futuro desbloqueado.
- Resumen anual disponible.

### Reglas

- Opt-in para emails no esenciales.
- Centro de preferencias.
- Sin notificaciones diseñadas para generar ansiedad.
- Frecuencia controlada.

---

## 9. Monetización futura

La monetización no debe introducirse antes de validar activación y retención.

### Posible modelo gratuito

- Biblioteca.
- Perfil público.
- Listas básicas.
- ADN principal.
- ¿Qué vemos hoy?
- Compatibilidad básica.

### Posible Watchly Plus

- Historial avanzado y rewatch ilimitado.
- ADN histórico.
- Más formatos de tarjetas.
- Retos personalizados avanzados.
- Estanterías automáticas adicionales.
- Créditos anuales ampliados.
- Personalización visual premium.

### Principios

- No cobrar por privacidad.
- No vender datos de gustos individuales.
- No bloquear exportación o eliminación de datos.
- No introducir publicidad invasiva dentro de perfiles personales.
- Validar disposición de pago antes de desarrollar un sistema de suscripción completo.

---

## 10. Backlog no comprometido

Ideas que pueden evaluarse después de las etapas principales:

- Importación desde otras plataformas.
- Exportación completa de biblioteca.
- Extensión de navegador.
- Aplicación móvil nativa.
- Widgets para pantalla de inicio.
- Integración con calendario de estrenos.
- Disponibilidad por plataforma de streaming.
- Recordatorios de nuevos episodios.
- Recomendaciones con inteligencia artificial.
- Escaneo de entradas o tickets de cine.
- Perfiles familiares.
- Integración con cines y festivales.
- API pública de Watchly.

Estas ideas no tienen prioridad asignada y no deben desplazar las etapas definidas sin evidencia.

---

## 11. Método para iniciar una etapa

Antes de comenzar cada función:

1. Revisar las métricas de la etapa anterior.
2. Confirmar que no existan errores críticos pendientes.
3. Definir la hipótesis principal.
4. Escribir la especificación funcional independiente.
5. Diseñar wireframes mobile y desktop.
6. Auditar datos y dependencias.
7. Definir eventos de analítica.
8. Establecer criterios de aceptación.
9. Implementar feature flag.
10. Probar con un grupo reducido.

---

## 12. Método para cerrar una etapa

Una etapa se cierra cuando:

- Cumple sus criterios funcionales.
- Pasó pruebas de seguridad y privacidad.
- Funciona en mobile y desktop.
- Funciona en light y dark.
- Tiene estados de carga, vacío y error.
- Tiene analítica.
- Fue utilizada por usuarios reales.
- Se documentaron aprendizajes.
- Se decidió mantener, ajustar o retirar la función.

Publicar no equivale a cerrar.

---

## 13. Priorización si hay recursos limitados

### Prioridad inmediata

1. Consolidación del núcleo.
2. ADN Audiovisual.
3. ¿Qué vemos hoy?
4. Compatibilidad.

Estas cuatro etapas forman el diferencial central de Watchly:

```text
Registrar → Entender → Elegir → Conectar
```

### Prioridad media

5. Modo pareja o grupo.
6. Cápsula después de verla.
7. Línea de tiempo y rewatch.
8. Pasaporte cinematográfico.

### Prioridad de expansión

9. Retos personales.
10. Estanterías por contexto.
11. Prestame tu perfil.
12. Mensaje al futuro.
13. Créditos personales del año.

El orden puede ajustarse con datos. Por ejemplo, si `¿Qué vemos hoy?` muestra fuerte uso compartido, el modo grupo puede adelantarse. Si las reseñas y fechas tienen alta adopción, la cápsula y la línea de tiempo pueden ganar prioridad.

---

## 14. Riesgos principales

### Demasiadas funciones antes de tener usuarios activos

Mitigación: una función por etapa y criterios de salida.

### Dependencia del proveedor audiovisual

Mitigación: modelo interno con `external_source`, `external_id` y metadata normalizada.

### Resultados pobres con bibliotecas pequeñas

Mitigación: estados preliminares, confidence score y mínimos de activación.

### Exposición accidental de contenido privado

Mitigación: RLS, pruebas con sesión anónima y agregados que nunca revelen títulos privados.

### Costos de generación de imágenes o IA

Mitigación: plantillas, canvas server-side, caché y algoritmos deterministas.

### Gamificación que incentive consumo excesivo

Mitigación: retos de exploración, sin rankings ni rachas punitivas.

### Complejidad de moderación social

Mitigación: comenzar con conexiones privadas y salas temporales antes de seguidores, comentarios o feed.

### Roadmap demasiado largo

Mitigación: tratar cada etapa como una decisión independiente. Las etapas futuras son dirección, no obligación.

---

## 15. Métricas generales de Watchly

### Activación

- Registro completado.
- Onboarding completado.
- Primer título agregado.
- Cinco títulos agregados.
- ADN desbloqueado.

### Engagement

- Usuarios activos semanales y mensuales.
- Títulos agregados por usuario activo.
- Calificaciones completadas.
- Visitas a biblioteca y perfil.
- Uso de funciones diferenciales.

### Retención

- Retención a 1, 7 y 30 días.
- Usuarios que vuelven a actualizar estados.
- Usuarios que registran nuevas visualizaciones.

### Crecimiento

- Perfiles compartidos.
- Tarjetas compartidas.
- Visitas públicas.
- Registros atribuidos a enlaces compartidos.

### Calidad

- Errores por sesión.
- Tiempo de carga.
- Fallos de búsqueda.
- Errores de autenticación.
- Solicitudes rechazadas por RLS esperadas e inesperadas.

---

## 16. Documentos del proyecto

La documentación debe mantenerse modular:

```text
WATCHLY_PRODUCT_SPEC.md
WATCHLY_ROADMAP.md
WATCHLY_ADN_AUDIOVISUAL.md
WATCHLY_QUE_VEMOS_HOY.md             futuro
WATCHLY_COMPATIBILIDAD.md            futuro
WATCHLY_MODO_GRUPO.md                futuro
WATCHLY_CAPSULAS.md                  futuro
WATCHLY_TIMELINE_REWATCH.md          futuro
WATCHLY_PASAPORTE.md                 futuro
WATCHLY_RETOS.md                     futuro
```

### Jerarquía

- `WATCHLY_PRODUCT_SPEC.md`: núcleo y arquitectura original.
- `WATCHLY_ROADMAP.md`: orden estratégico de evolución.
- Documentos por función: reglas funcionales y técnicas detalladas.

Si existe una contradicción:

1. Una decisión explícita más reciente prevalece.
2. El documento específico de una función prevalece dentro de su módulo.
3. Seguridad y privacidad prevalecen sobre conveniencia.

---

## 17. Decisiones adoptadas

- Watchly crecerá por etapas.
- Se incorporará una función diferencial principal por etapa.
- El ADN Audiovisual será la primera función de expansión.
- `¿Qué vemos hoy?` será la siguiente función recomendada.
- La compatibilidad se construirá sobre el ADN.
- La capa social comenzará con afinidad y salas, no con un feed.
- Las cápsulas y la línea de tiempo convertirán la biblioteca en memoria personal.
- El pasaporte y los retos impulsarán exploración, no competencia.
- La monetización se evaluará después de validar retención.
- Las etapas futuras podrán reordenarse según datos reales.

---

## 18. Próximo paso inmediato

El próximo trabajo recomendado es:

1. Confirmar que la Etapa 0 está estable.
2. Implementar y probar el ADN Audiovisual.
3. Medir desbloqueo, visualización y compartidos.
4. Escribir la especificación detallada de `¿Qué vemos hoy?` únicamente cuando el ADN esté consolidado o próximo a publicarse.

La hoja de ruta debe revisarse al cierre de cada etapa y actualizarse con aprendizajes reales.

