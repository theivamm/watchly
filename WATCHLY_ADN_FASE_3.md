# Watchly — ADN Audiovisual Fase 3

## Objetivo

Conectar las sesiones de visualización y sus reacciones con el ADN Audiovisual existente. Esta fase debe calcular y mostrar **cómo mira** el usuario y **qué le generan** las historias, sin reemplazar el cálculo actual de gustos.

## Estado previo

Ya existen y funcionan:

- `public.viewing_sessions`.
- `public.reaction_tags`.
- `public.viewing_session_reactions`.
- Múltiples sesiones por título.
- Fecha y hora opcional con zona horaria.
- Lugar, compañía, idioma, plataforma, rewatch y nota de la sesión.
- Máximo de tres reacciones por sesión.
- RLS y triggers `dna_dirty`.
- ADN actual basado en `public.entries` y `public.user_dna`.

No modificar ni volver a ejecutar las migraciones 024 y 025.

## Ajustes previos de interfaz

1. Confirmar que `¿Qué te dejó?` esté dentro del formulario de la sesión y permita elegir hasta tres reacciones.
2. Cambiar `Lo vi más de una vez` por:

```text
¿Ya la habías visto antes?
```

Opciones:

```text
Es la primera vez
Ya la había visto
```

Cada rewatch debe crear una nueva sesión; nunca sobrescribir la anterior.

## Reglas de cálculo

Mantener separadas las fuentes:

- Gustos, géneros, décadas y países: títulos únicos de `entries`.
- Hábitos: sesiones de `viewing_sessions`.
- Reacciones: sesiones que tengan reacciones.
- Rating principal: `entries.rating`.
- Rating de una experiencia: `viewing_sessions.rating`; no reemplaza el rating principal.

Una película vista tres veces cuenta una vez para géneros y tres veces para hábitos.

## Datos a calcular

### Lugar

Distribución porcentual de:

```text
cinema
home
friend_home
travel
other
```

Excluir `unknown` del denominador.

### Horario

Calcular únicamente cuando exista `watched_at` real:

```text
06:00–11:59  morning
12:00–18:59  afternoon
19:00–23:59  night
00:00–05:59  late_night
```

Usar la zona horaria guardada en la sesión. No inferir horario desde `watched_date`.

### Compañía

```text
alone
partner
friends
family
children
other
```

Excluir `unknown`.

### Idioma

```text
original_subtitled
original_no_subtitles
dubbed
```

Excluir `unknown`.

### Plataforma

```text
streaming
television
rental
physical
download
other
```

Excluir `unknown`. No mezclar `cinema` con plataforma.

### Rewatch

Calcular:

```text
total_sessions
unique_titles
rewatch_sessions
rewatch_rate
```

`rewatch_rate = rewatch_sessions / total_sessions`, usando sesiones válidas.

### Reacciones

Calcular frecuencia y porcentaje de cada reacción sobre sesiones que tengan al menos una reacción. Una sesión puede aportar hasta tres reacciones.

## Nuevas etiquetas contextuales

Generar únicamente cuando exista la muestra mínima:

| Etiqueta | Condición inicial | Muestra mínima |
|---|---|---:|
| Noctámbulo audiovisual | Noche + madrugada ≥ 60% | 10 sesiones con hora |
| Experiencia de pantalla grande | Cine ≥ 30% | 10 sesiones con lugar |
| Mirada en idioma original | Original con/sin subtítulos ≥ 70% | 10 sesiones con idioma |
| Espíritu de rewatch | Rewatch ≥ 25% | 12 sesiones |
| Cinéfilo solitario | Solo/a ≥ 65% | 10 sesiones con compañía |
| Pantalla compartida | Con otras personas ≥ 60% | 10 sesiones con compañía |
| Corazón sensible | Emoción + nostalgia ≥ 40% | 10 sesiones con reacciones |
| Mente inquieta | `made_me_think` ≥ 40% | 10 sesiones con reacciones |

Cada etiqueta debe guardar:

```json
{
  "slug": "night_owl",
  "label": "Noctámbulo audiovisual",
  "score": 0.68,
  "sampleSize": 22,
  "ruleVersion": "1.1.0",
  "explanation": "El 68% de tus sesiones con horario ocurrieron de noche o madrugada."
}
```

Máximo cinco etiquetas contextuales visibles. Ordenar por evidencia y evitar etiquetas contradictorias.

## Cobertura contextual

No reducir la confianza del ADN actual por falta de sesiones. Guardar y mostrar una cobertura separada:

```text
0 sesiones    Sin datos
1–4           Primeros registros
5–9           Tendencias iniciales
10–24         En desarrollo
25–49         Consistente
50+           Muy representativo
```

Calcular cobertura individual para lugar, horario, compañía, idioma y reacciones.

## Persistencia

Ampliar `public.user_dna` mediante una nueva migración aditiva. No eliminar ni renombrar campos existentes.

Campos sugeridos:

```text
venue_distribution jsonb
time_distribution jsonb
companionship_distribution jsonb
language_mode_distribution jsonb
platform_distribution jsonb
reaction_distribution jsonb
rewatch_profile jsonb
context_tags jsonb
context_coverage jsonb
```

Actualizar `algorithm_version` a una versión 1.1.x. Mantener compatibilidad con usuarios sin sesiones.

## Edge Function

Ampliar el cálculo existente de `calculate-user-dna` y su módulo `_lib/dna.ts`:

1. Leer sesiones del usuario.
2. Leer reacciones asociadas.
3. Calcular distribuciones excluyendo valores desconocidos.
4. Aplicar muestras mínimas.
5. Generar explicaciones deterministas.
6. Guardar resultados junto al ADN actual.
7. Limpiar `dna_dirty` solo después de guardar correctamente.

No usar IA. No enviar notas privadas al cálculo.

## Interfaz `/adn`

Agregar debajo del ADN actual:

### Tu forma de mirar

- Lugar predominante.
- Horario predominante.
- Compañía.
- Idioma.
- Plataforma.

### Lo que te generan las historias

- Reacciones predominantes.
- Porcentajes.
- Cantidad de sesiones analizadas.

### Tu relación con lo que ves

- Sesiones totales.
- Títulos únicos.
- Rewatches.
- Tasa de rewatch.

Mostrar porcentajes, explicación y tamaño de muestra. Incorporar estados vacíos. Mantener dark/light, color de acento, mobile y accesibilidad.

## Privacidad

- Las sesiones individuales siguen siendo privadas.
- El ADN privado puede usar todas las sesiones del dueño.
- La vista pública solo puede mostrar agregados si el usuario habilitó su ADN público.
- Nunca mostrar públicamente hora exacta, notas, acompañantes identificables ni sesiones individuales.

## Fuera de alcance

No implementar en esta fase:

- IA.
- Recomendaciones.
- Compatibilidad social.
- Feed, seguidores o mensajes.
- Taxonomía automática de películas.
- Tracking obligatorio por episodio.
- Cambios en la tarjeta compartible.
- Catálogo específico de servicios de streaming.

## Validación

Verificar:

1. Usuario sin sesiones: ADN actual sin cambios ni errores.
2. Sesión sin hora: no entra en distribución horaria.
3. Valores `unknown`: no entran en porcentajes.
4. Varias sesiones del mismo título: una para gustos, todas para hábitos.
5. Rewatch correctamente calculado.
6. Reacciones correctamente agregadas.
7. Ninguna etiqueta sin muestra mínima.
8. Explicaciones consistentes con porcentajes.
9. RLS y privacidad pública.
10. Recálculo por `dna_dirty`.
11. Typecheck, lint y build sin errores nuevos.

## Entrega esperada

Antes de modificar código, presentar un plan breve con:

- Migración nueva.
- Archivos del Edge Function a modificar.
- Cambios en `user_dna`.
- Componentes de `/adn` a crear o editar.
- Pruebas que se ejecutarán.

Después implementar solo esta fase e informar archivos modificados, migraciones pendientes de aplicar y resultados de validación. No avanzar a otra fase sin aprobación.
