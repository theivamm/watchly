# Watchly — Ampliación del ADN Audiovisual

## Experiencia de visualización, etiquetas y cierre del módulo

**Estado:** Especificación lista para implementar  
**Producto:** Watchly  
**Módulo existente:** ADN Audiovisual  
**Tipo de cambio:** Ampliación compatible, sin reemplazar la implementación actual  
**Versión funcional propuesta:** ADN 1.1 y 1.2

---

## 1. Propósito

El ADN Audiovisual actual describe qué consume una persona: géneros, formatos, décadas, países, idiomas, calificaciones y otros patrones de su biblioteca.

Esta ampliación incorpora una segunda dimensión:

> No solamente qué ve el usuario, sino también cómo, cuándo, dónde y de qué manera vive cada experiencia audiovisual.

El objetivo es enriquecer el ADN con datos reales sin convertir el registro de una película o serie en un formulario pesado.

El módulo ampliado debe poder responder preguntas como:

- ¿Ve más películas en cine o en casa?
- ¿Suele mirar contenido de noche o de madrugada?
- ¿Prefiere mirar solo, en pareja, con amigos o en familia?
- ¿Consume contenido en idioma original o doblado?
- ¿Qué emociones aparecen con mayor frecuencia?
- ¿Cuánto vuelve a ver títulos ya conocidos?
- ¿Qué patrones justifican cada etiqueta de su ADN?

El ADN continúa siendo descriptivo. No debe presentar diagnósticos psicológicos ni conclusiones que no puedan explicarse mediante los datos registrados.

---

## 2. Principios del módulo

1. **Carga opcional:** ningún dato contextual debe impedir agregar o marcar un título como visto.
2. **Interfaz progresiva:** los detalles aparecen en una sección secundaria desplegable.
3. **Datos explicables:** toda etiqueta del ADN debe tener una regla conocida y una explicación visible.
4. **Privacidad por defecto:** los registros individuales son privados; el perfil público solo muestra conclusiones agregadas autorizadas.
5. **Sin IA obligatoria:** el núcleo funciona con reglas deterministas y versionadas.
6. **Compatibilidad:** no se eliminan ni reemplazan las estructuras actuales de `watchly.user_dna`.
7. **Múltiples visualizaciones:** una persona puede ver el mismo título más de una vez y conservar cada experiencia.
8. **Taxonomía controlada:** no se permiten etiquetas libres como fuente principal del algoritmo.
9. **Datos insuficientes:** no se genera una etiqueta cuando la muestra no alcanza el mínimo definido.
10. **Una ampliación, un objetivo:** esta etapa cierra el ADN; no incorpora recomendaciones, compatibilidad entre perfiles ni funciones sociales adicionales.

---

## 3. Separación de conceptos

La implementación debe distinguir tres capas.

### 3.1. Metadatos objetivos del contenido

Provienen del catálogo normalizado:

- Tipo: película o serie.
- Géneros.
- Año y década.
- Países de origen.
- Idioma original.
- Duración.
- Dirección.
- Reparto principal.

Estos datos viven en `watchly.media` o en las relaciones normalizadas correspondientes.

### 3.2. Etiquetas descriptivas del contenido

Describen la experiencia general de una obra:

- Oscura.
- Emotiva.
- Liviana.
- Inquietante.
- Ritmo lento.
- Ritmo ágil.
- Compleja.
- Final abierto.
- Visualmente impactante.
- Para ver en familia.
- Basada en hechos reales.

Son atributos del título, no del usuario. Deben utilizar una taxonomía controlada.

### 3.3. Etiquetas del ADN del usuario

Son conclusiones calculadas a partir de su biblioteca y sus sesiones:

- Explorador de géneros.
- Noctámbulo audiovisual.
- Experiencia de pantalla grande.
- Maratonista serial.
- Viajero audiovisual.
- Cazador de estrenos.
- Alma cinéfila.
- Corazón sensible.

Estas etiquetas se almacenan como resultados calculados y deben incluir evidencia explicable.

---

## 4. Taxonomía de etiquetas del contenido

No se deben aceptar etiquetas libres como sistema principal. Se crea un catálogo cerrado, extensible y administrable.

### 4.1. Categorías iniciales

#### Atmósfera

- Oscura.
- Melancólica.
- Esperanzadora.
- Inquietante.
- Liviana.
- Emotiva.
- Inspiradora.
- Divertida.
- Tensa.
- Nostálgica.

#### Ritmo

- Lento.
- Moderado.
- Ágil.
- Frenético.

#### Complejidad narrativa

- Fácil de seguir.
- Atención media.
- Compleja.
- Narrativa no lineal.
- Final abierto.

#### Tipo de experiencia

- Para maratonear.
- Para ver en familia.
- Para ver en pareja.
- Para desconectar.
- Para pensar.
- Visualmente impactante.
- Basada en hechos reales.
- Mucha acción.

#### Temáticas

- Relaciones.
- Familia.
- Supervivencia.
- Crimen.
- Política.
- Tecnología.
- Identidad.
- Viajes.
- Guerra.
- Música.

### 4.2. Origen de las etiquetas

Cada relación entre un contenido y una etiqueta debe registrar su origen:

```text
rule
admin
community
ai_suggestion
```

Reglas:

- `rule`: inferencia controlada desde metadatos objetivos.
- `admin`: asignación validada por administración.
- `community`: consenso suficiente de usuarios; queda fuera de esta primera implementación.
- `ai_suggestion`: sugerencia pendiente de validación; no participa automáticamente del ADN.
- Solamente etiquetas validadas pueden alimentar resultados públicos.
- La IA no debe escribir etiquetas definitivas directamente en producción.

### 4.3. Primera implementación

Para esta etapa:

1. Crear la taxonomía.
2. Implementar etiquetas por reglas cuando sean seguras.
3. Permitir asignación administrativa para títulos relevantes.
4. Dejar preparadas las fuentes `community` y `ai_suggestion`, sin habilitarlas como fuente automática.

---

## 5. Registro de una experiencia de visualización

Cada vez que el usuario registra un título visto puede guardar el contexto de esa visualización.

La unidad de información no debe ser solamente la relación `user_media`. Se necesita una entidad nueva llamada `viewing_sessions`.

Esto resuelve:

- Rewatch de una película.
- Distintas experiencias del mismo título.
- Cambio de puntuación con el tiempo.
- Una visualización en cine y otra posterior en casa.
- Historial cronológico sin sobrescribir datos anteriores.

### 5.1. Datos básicos

- Fecha de visualización.
- Hora aproximada u hora exacta opcional.
- Lugar o contexto.
- Compañía.
- Modalidad de idioma.
- Primera vez o rewatch.
- Hasta tres reacciones.
- Puntuación de esa visualización.
- Nota personal opcional.
- Visibilidad.

### 5.2. Lugar

Valores internos:

```text
cinema
home
friend_home
travel
other
unknown
```

Textos de interfaz:

```text
En el cine
En casa
En otra casa
Durante un viaje
Otro
No recuerdo
```

No se guardan direcciones ni coordenadas.

### 5.3. Fecha y hora

`watched_at` debe ser un timestamp con zona horaria cuando se conoce la hora. Si el usuario solo conoce la fecha, la aplicación no debe inventar una hora.

Las franjas se calculan automáticamente:

```text
06:00–11:59  morning
12:00–18:59  afternoon
19:00–23:59  night
00:00–05:59  late_night
```

Textos visibles:

```text
Mañana
Tarde
Noche
Madrugada
```

La franja se deriva en la zona horaria del registro. No se solicita como un campo adicional si ya existe una hora.

### 5.4. Compañía

Valores:

```text
alone
partner
friends
family
children
other
unknown
```

No se registran nombres de personas en esta versión.

### 5.5. Modalidad de idioma

Valores:

```text
original_subtitled
dubbed
original_no_subtitles
unknown
```

Textos:

```text
Idioma original con subtítulos
Doblada
Idioma original sin subtítulos
No recuerdo
```

### 5.6. Plataforma o soporte

Campo opcional:

```text
streaming
television
rental
physical
download
other
unknown
```

En esta etapa no es obligatorio mantener un catálogo completo de servicios de streaming. Si se incorpora `provider_id`, debe ser opcional y referenciar una tabla normalizada.

### 5.7. Primera vez o rewatch

```text
is_rewatch = false
is_rewatch = true
```

Cuando ya existe una sesión previa del mismo usuario y contenido, la interfaz puede sugerir `is_rewatch = true`, pero el usuario debe poder corregirlo.

---

## 6. Reacciones personales

Las reacciones describen lo que una experiencia le produjo a una persona. No son atributos globales de la película o serie.

Pregunta de interfaz:

> ¿Qué te dejó?

El usuario puede elegir hasta tres:

- Me hizo reír.
- Me emocionó.
- Me sorprendió.
- Me dejó pensando.
- Me inquietó.
- Me decepcionó.
- Me dio nostalgia.
- Me atrapó.
- Me costó terminarla.
- Quiero volver a verla.

Slugs sugeridos:

```text
made_me_laugh
moved_me
surprised_me
made_me_think
unsettled_me
disappointed_me
made_me_nostalgic
hooked_me
hard_to_finish
want_to_rewatch
```

Reglas:

- Máximo tres reacciones por sesión.
- Se pueden editar.
- Participan del ADN personal.
- No convierten automáticamente una reacción individual en etiqueta del contenido.
- La nota libre no debe ser analizada ni publicada automáticamente.

---

## 7. Experiencia de usuario

### 7.1. Flujo principal al agregar un título

Mantener visible únicamente lo esencial:

```text
Estado
Puntuación
Fecha
Comentario
```

Debajo:

```text
+ Agregar detalles de cómo la viste
```

Al desplegar:

```text
¿Dónde la viste?
¿Cuándo la viste?
¿Con quién?
¿Cómo la viste?
¿Qué te dejó?
¿Era la primera vez?
```

Todos estos campos son opcionales.

### 7.2. Confirmación

Después de guardar una sesión con contexto:

> Este registro ayudó a enriquecer tu ADN Audiovisual.

No se debe prometer que una única sesión cambiará una etiqueta.

### 7.3. Edición e historial

Desde la ficha del usuario para un título:

- Ver sesiones anteriores.
- Editar una sesión propia.
- Eliminar una sesión propia.
- Agregar una nueva visualización.
- Comparar puntuaciones entre visualizaciones.

Eliminar una sesión debe disparar el recálculo asíncrono del ADN.

### 7.4. Series

En esta etapa no se registra obligatoriamente cada episodio.

Para una serie, una sesión puede representar:

- El momento en que se marcó como completada.
- Una temporada terminada.
- Una sesión relevante añadida manualmente.

Si se necesita distinguirlo, usar un campo opcional `scope`:

```text
full_title
season
viewing_session
```

Y campos opcionales:

```text
season_number
episode_number
```

No bloquear el cierre de esta etapa por un tracking exhaustivo de episodios.

---

## 8. Nuevas etiquetas calculadas del ADN

Las reglas deben ser deterministas, tener muestra mínima y poder explicarse.

### 8.1. Noctámbulo audiovisual

Condición inicial:

```text
night + late_night >= 60% de sesiones con hora
Muestra mínima: 10 sesiones con hora válida
```

Explicación:

> Sos un Noctámbulo Audiovisual porque el 68% de tus registros con horario ocurrieron de noche o madrugada.

### 8.2. Experiencia de pantalla grande

```text
venue = cinema en >= 30% de las películas con lugar registrado
Muestra mínima: 10 películas con lugar
```

### 8.3. Explorador de géneros

```text
Al menos 8 géneros con representación relevante
Ningún género supera el 35%
Muestra mínima: 20 títulos válidos
```

### 8.4. Maratonista serial

```text
Series >= 65% del consumo válido
Muestra mínima: 15 títulos
```

### 8.5. Viajero audiovisual

```text
Contenido de al menos 10 países
Ningún país supera el 60%
Muestra mínima: 25 títulos con país
```

### 8.6. Cazador de estrenos

```text
>= 50% de títulos vistos dentro de los 2 años posteriores a su estreno
Muestra mínima: 15 títulos con fecha de visualización y estreno
```

### 8.7. Corazón sensible

```text
moved_me + made_me_nostalgic en >= 40% de sesiones con reacciones
Muestra mínima: 10 sesiones con reacciones
```

### 8.8. Mirada en idioma original

```text
original_subtitled + original_no_subtitles >= 70% de títulos cuyo idioma original no coincide con el idioma principal del usuario
Muestra mínima: 10 sesiones con modalidad de idioma
```

### 8.9. Espíritu de rewatch

```text
is_rewatch = true en >= 25% de sesiones
Muestra mínima: 12 sesiones
```

### 8.10. Reglas generales

- Los umbrales iniciales deben guardarse como configuración versionada.
- Nunca evaluar porcentajes sobre registros sin el dato requerido.
- Mostrar el tamaño de la muestra en el detalle privado.
- No publicar una etiqueta con confianza insuficiente.
- Una etiqueta puede perderse si el patrón deja de cumplirse; conservar historial solo en una etapa futura.
- Evitar más de cinco etiquetas principales visibles al mismo tiempo.
- Ordenar por fuerza de evidencia, relevancia y diversidad.

---

## 9. Confianza y cobertura

El sistema actual de confianza del ADN se mantiene:

```text
Cantidad válida: 50%
Cobertura de metadata: 30%
Porcentaje puntuado: 20%
```

La nueva información contextual debe mostrar una cobertura separada y no degradar el ADN original.

Ejemplo:

```text
ADN general: Muy representativo
Hábitos de visualización: En desarrollo
18 de 42 títulos tienen contexto registrado
```

Coberturas sugeridas:

```text
venue_coverage
time_coverage
companionship_coverage
language_mode_coverage
reaction_coverage
```

No promediar campos opcionales ausentes como si fueran respuestas negativas.

---

## 10. Modelo de datos

Todas las tablas pertenecen al schema `watchly`.

### 10.1. `watchly.tags`

```sql
create table watchly.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Categorías iniciales:

```text
atmosphere
pace
complexity
experience
theme
```

### 10.2. `watchly.media_tags`

```sql
create table watchly.media_tags (
  media_id uuid not null references watchly.media(id) on delete cascade,
  tag_id uuid not null references watchly.tags(id) on delete cascade,
  source text not null,
  confidence numeric(5,4),
  validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (media_id, tag_id, source)
);
```

Validar `source` mediante enum o check constraint.

### 10.3. `watchly.viewing_sessions`

```sql
create table watchly.viewing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id uuid not null references watchly.media(id) on delete cascade,
  watched_at timestamptz,
  watched_date date,
  timezone text,
  venue text not null default 'unknown',
  platform text not null default 'unknown',
  provider_id uuid,
  companionship text not null default 'unknown',
  language_mode text not null default 'unknown',
  is_rewatch boolean not null default false,
  scope text not null default 'full_title',
  season_number integer,
  episode_number integer,
  rating numeric(3,1),
  notes text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notas:

- Usar `watched_at` cuando se conoce fecha y hora.
- Usar `watched_date` cuando solamente se conoce la fecha.
- No completar `watched_at` con mediodía u otra hora ficticia.
- Aplicar checks o enums a todos los valores controlados.
- Validar rating según la escala ya utilizada por Watchly.
- `provider_id` puede permanecer nulo hasta incorporar proveedores normalizados.

### 10.4. `watchly.reaction_tags`

```sql
create table watchly.reaction_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 10.5. `watchly.viewing_session_reactions`

```sql
create table watchly.viewing_session_reactions (
  viewing_session_id uuid not null references watchly.viewing_sessions(id) on delete cascade,
  reaction_tag_id uuid not null references watchly.reaction_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (viewing_session_id, reaction_tag_id)
);
```

La restricción de máximo tres reacciones debe validarse en servidor, no solamente en React.

### 10.6. Ampliación de `watchly.user_dna`

Agregar sin eliminar campos actuales:

```text
venue_distribution jsonb
time_distribution jsonb
companionship_distribution jsonb
language_mode_distribution jsonb
reaction_distribution jsonb
rewatch_profile jsonb
context_tags jsonb
context_coverage jsonb
```

`context_tags` debe guardar objetos explicables, no solo strings:

```json
{
  "slug": "night_owl",
  "label": "Noctámbulo audiovisual",
  "score": 0.68,
  "sampleSize": 22,
  "ruleVersion": "1.1.0",
  "explanation": "El 68% de tus registros con horario ocurrieron de noche o madrugada."
}
```

---

## 11. Migración y compatibilidad

### 11.1. No modificar registros históricos de forma destructiva

- `user_media` continúa representando la relación vigente del usuario con el título.
- `viewing_sessions` representa eventos históricos.
- No crear sesiones ficticias para registros anteriores si no existe una fecha real.
- Se puede ofrecer al usuario completar retrospectivamente el contexto.

### 11.2. Sesión inicial opcional

Cuando un usuario edite un título ya completado y todavía no tenga sesiones:

> ¿Querés agregar cómo fue la vez que lo viste?

No mostrar este pedido de manera repetitiva si el usuario lo descarta.

### 11.3. Versionado

```text
1.0.x  ADN original
1.1.x  Sesiones y hábitos de visualización
1.2.x  Reacciones y etiquetas descriptivas validadas
```

Guardar en cada cálculo:

```text
algorithm_version
rule_version
source_updated_at
calculated_at
```

### 11.4. Recálculo

Disparar un recálculo asíncrono cuando:

- Se crea, edita o elimina una sesión.
- Cambia el estado o puntuación relevante de `user_media`.
- Se valida o retira una etiqueta de un contenido consumido.
- Se modifica una regla del algoritmo.

El guardado de una sesión no debe esperar a que finalice el recálculo.

---

## 12. Seguridad y RLS

### 12.1. Sesiones

- El usuario autenticado puede crear, leer, editar y eliminar únicamente sus sesiones.
- Nadie puede consultar sesiones ajenas individuales desde el cliente.
- `is_public` no habilita por sí solo acceso directo a la fila completa.
- Las vistas públicas deben devolver únicamente campos expresamente permitidos o agregados.

### 12.2. Etiquetas del catálogo

- Lectura pública únicamente para etiquetas activas y validadas.
- Escritura restringida a procesos seguros o rol administrativo.
- Las sugerencias de IA o comunidad no son públicas hasta ser validadas.

### 12.3. ADN público

Respetar `profiles.show_dna_publicly` y cualquier preferencia específica que se agregue.

Preferencias sugeridas:

```text
show_dna_publicly
show_context_dna_publicly
show_emotional_dna_publicly
```

Los registros privados participan del cálculo personal, pero no deben revelar títulos, horas exactas, notas ni ubicaciones en la vista pública.

---

## 13. Reglas de privacidad de la interfaz

Permitido públicamente con autorización:

> El 70% de sus películas registradas las disfruta de noche.

> Su contexto más frecuente es el cine.

No permitido:

> Vio esta película en su casa el viernes a las 23:42.

> Registró una sesión con su pareja el 7 de agosto.

Nunca publicar:

- Hora exacta.
- Notas privadas.
- Dirección o ubicación precisa.
- Identidad de acompañantes.
- Historial completo de sesiones sin una función y consentimiento específicos.

---

## 14. Presentación dentro del ADN

El ADN completo puede organizarse en cinco bloques.

### 14.1. ADN de gustos

- Géneros.
- Formatos.
- Décadas.
- Países.
- Idiomas de origen.
- Calificaciones.

### 14.2. ADN de hábitos

- Lugar predominante.
- Franja horaria.
- Compañía.
- Modalidad de idioma.
- Rewatch.

### 14.3. ADN emocional

- Reacciones predominantes.
- Reacciones secundarias.
- Cantidad de experiencias con reacciones.

### 14.4. ADN de exploración

- Diversidad de géneros.
- Diversidad de países.
- Estrenos frente a clásicos.
- Afinidad frente a exploración.

### 14.5. Etiquetas principales

Mostrar como máximo cinco etiquetas de identidad, mezclando categorías sin repetir la misma idea.

Cada etiqueta debe permitir abrir:

- Qué significa.
- Qué datos la activaron.
- Tamaño de la muestra.
- Fecha de actualización.

---

## 15. Tarjeta compartible

La tarjeta existente puede incorporar, cuando exista cobertura suficiente:

- Una etiqueta de gustos.
- Una etiqueta de hábitos.
- Una etiqueta de exploración o emocional.
- Cantidad de títulos analizados.
- Nivel de representatividad.
- Color de acento del perfil.

No incluir:

- Horas exactas.
- Títulos privados.
- Notas.
- Contexto de una sesión identificable.
- Etiquetas con muestra insuficiente.

Si no existe información contextual suficiente, la tarjeta actual debe seguir funcionando sin espacios vacíos ni mensajes de error.

---

## 16. Analítica de producto

Eventos sugeridos:

```text
viewing_details_opened
viewing_session_created
viewing_session_updated
viewing_session_deleted
viewing_context_skipped
reaction_selected
context_dna_viewed
context_tag_explanation_opened
context_dna_shared
```

Propiedades permitidas:

```text
has_venue
has_time
has_companionship
has_language_mode
reaction_count
is_rewatch
context_coverage_level
```

No enviar a analítica:

- Notas.
- Texto de reseñas.
- Hora exacta.
- Identidades de acompañantes.

Métricas principales:

- Porcentaje de títulos completados con al menos una sesión.
- Porcentaje de sesiones con contexto.
- Campos opcionales más utilizados.
- Abandono del flujo desplegable.
- Usuarios que desbloquean al menos una etiqueta contextual.
- Apertura de explicaciones.
- Compartidos del ADN ampliado.

---

## 17. Estados vacíos y mensajes

### Sin contexto

> Tu ADN ya conoce tus gustos. Agregá detalles de cómo ves tus títulos para descubrir tus hábitos audiovisuales.

### Progreso inicial

> Registraste el contexto de 4 experiencias. Con algunas más podremos detectar patrones de forma confiable.

### Datos insuficientes para una etiqueta

No mostrar una etiqueta falsa. Mostrar progreso neutral:

> Todavía estamos conociendo tus horarios de visualización.

### Cobertura parcial

> Este resultado se basa en 12 de tus 30 títulos registrados.

---

## 18. Accesibilidad y diseño

- Todos los selectores deben ser utilizables con teclado.
- No comunicar categorías únicamente con color.
- Mantener contraste adecuado en dark y light mode.
- Adaptar chips y gráficos al color de acento elegido por el usuario.
- Permitir deseleccionar respuestas.
- Mostrar siempre una opción `No recuerdo` cuando corresponda.
- No preseleccionar datos personales salvo `is_rewatch` cuando exista evidencia y se muestre como sugerencia editable.
- Las gráficas deben tener equivalentes textuales.

---

## 19. Casos de prueba esenciales

1. Agregar una película sin detalles contextuales.
2. Agregar una película vista en cine con fecha, pero sin hora.
3. Agregar una película vista en casa con hora y compañía.
4. Registrar una segunda visualización del mismo título.
5. Corregir una sesión marcada erróneamente como rewatch.
6. Elegir más de tres reacciones y verificar el bloqueo del servidor.
7. Eliminar una sesión y confirmar recálculo.
8. Tener sesiones con y sin hora sin distorsionar porcentajes.
9. Comprobar cambio de franja según zona horaria.
10. Verificar que registros privados alimentan el ADN personal.
11. Verificar que la vista pública no expone sesiones individuales.
12. Desactivar ADN contextual público.
13. Usuario sin sesiones: el ADN original continúa intacto.
14. Etiqueta con muestra insuficiente: no se muestra.
15. Etiqueta validada por administrador: participa del cálculo.
16. Sugerencia de IA no validada: no participa del resultado público.
17. Serie registrada sin episodios: flujo válido.
18. Película con fecha pero sin hora: no se asigna franja horaria.
19. Eliminar un título y revisar cascadas y consistencia.
20. Cambiar la versión de reglas y recalcular sin duplicar etiquetas.

---

## 20. Criterios de aceptación

La ampliación queda terminada cuando:

- Se pueden registrar múltiples sesiones para un mismo título.
- Todos los datos contextuales son opcionales.
- Es posible registrar cine, casa, otra casa, viaje u otro contexto.
- Fecha sin hora se guarda sin inventar un horario.
- La franja horaria se deriva correctamente cuando existe hora.
- Se puede registrar compañía, modalidad de idioma y rewatch.
- El usuario puede elegir hasta tres reacciones.
- Las reacciones pertenecen a la sesión, no al contenido.
- Existe una taxonomía controlada de etiquetas descriptivas.
- Cada etiqueta del contenido conserva origen, confianza y validación.
- Ninguna sugerencia no validada alimenta resultados públicos.
- Las nuevas etiquetas del ADN respetan muestra mínima.
- Cada etiqueta puede explicar por qué fue asignada.
- La confianza contextual se muestra separada de la confianza general.
- El ADN original funciona aunque no existan sesiones.
- El recálculo es asíncrono y versionado.
- Las políticas RLS impiden consultar sesiones ajenas.
- El perfil público solo presenta información agregada autorizada.
- La tarjeta compartible funciona con y sin ADN contextual.
- Los modos dark, light y colores de acento mantienen accesibilidad.

---

## 21. Orden recomendado de implementación

### Fase 1 — Estructura y sesiones

1. Crear tablas y enums/checks.
2. Implementar RLS.
3. Agregar `viewing_sessions` al flujo de títulos.
4. Permitir múltiples visualizaciones.
5. Implementar edición y eliminación.

### Fase 2 — Contexto y reacciones

1. Añadir lugar, fecha/hora, compañía e idioma.
2. Añadir rewatch.
3. Crear catálogo de reacciones.
4. Limitar a tres reacciones en servidor.
5. Incorporar estados vacíos y cobertura.

### Fase 3 — Cálculo del ADN 1.1

1. Calcular distribuciones contextuales.
2. Implementar reglas y muestras mínimas.
3. Guardar explicaciones y versiones.
4. Integrar recálculo asíncrono.
5. Añadir las nuevas secciones privadas del ADN.

### Fase 4 — Taxonomía descriptiva 1.2

1. Crear `tags` y `media_tags`.
2. Cargar taxonomía inicial.
3. Implementar asignación por reglas seguras.
4. Crear mecanismo administrativo de validación.
5. Integrar etiquetas validadas al ADN.

### Fase 5 — Privacidad y presentación pública

1. Agregar controles específicos de visibilidad.
2. Crear agregados públicos seguros.
3. Actualizar tarjeta compartible.
4. Validar accesibilidad.
5. Activar analítica y revisar adopción.

---

## 22. Fuera de alcance

No incorporar en esta etapa:

- Recomendaciones con IA.
- Chat conversacional.
- Compatibilidad entre perfiles.
- Modo pareja o grupo.
- Seguimiento obligatorio episodio por episodio.
- Identificación de acompañantes.
- Geolocalización exacta.
- Publicación automática de sesiones.
- Interpretación de notas privadas mediante IA.
- Etiquetas libres sin normalización.
- Aprendizaje automático como requisito del cálculo.

Estas funciones pertenecen a etapas posteriores de la hoja de ruta.

---

## 23. Definición final del módulo

Una vez implementada esta ampliación, el ADN Audiovisual de Watchly se compone de:

1. **ADN de gustos:** qué consume el usuario.
2. **ADN de hábitos:** dónde, cuándo y cómo lo consume.
3. **ADN emocional:** qué reacciones le generan sus experiencias.
4. **ADN de exploración:** cuánto varía entre géneros, países, épocas y formatos.
5. **ADN compartible:** una síntesis visual explicable y con privacidad controlada.

La promesa del producto queda expresada así:

> Watchly no solo recuerda lo que viste. También entiende cómo vivís cada historia.

