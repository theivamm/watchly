# Preferencias y explicaciones

## Historial y gusto

El ADN descriptivo conserva los títulos consumidos aunque hayan recibido una nota baja. Su algoritmo 1.2 interpola los pesos de todas las medias estrellas (0,5 a 5); antes solo reconocía notas enteras. El cambio de Edge Function requiere desplegar `calculate-user-dna` y recalcular el ADN; editar el archivo local no actualiza resultados almacenados en Supabase.

El perfil de recomendaciones se calcula separadamente con la biblioteca actual y metadata pública del catálogo. Funciona en el frontend sin migración ni despliegue de la Edge Function. Se aplica a Inicio, Para vos y Descubrir con mi ADN.

## Reglas de afinidad

- Las notas personales aportan `(nota - 3) / 2` por género: 3 es neutral, las notas menores reducen la afinidad y las mayores la aumentan.
- Se divide la suma por `cantidad + 2` para moderar conclusiones con pocas observaciones. El ADN descriptivo aporta un respaldo pequeño, de hasta 0,15 por género. Se recorta a cero el resultado negativo.
- Sin nota no hay señal negativa. Quiero ver no se usa como valoración de consumo, aun si tiene una nota cargada. Abandonar por sí solo tampoco significa rechazo.
- La metadata se obtiene con el cargador existente, cuatro consultas simultáneas y caché pública de 30 minutos. Si falta, ese título no genera evidencia; no se inventa su género.
- La afinidad entre una propuesta y el perfil suma los pesos de géneros coincidentes. No se presenta como porcentaje de probabilidad de que guste. TMDB mantiene su papel de selección de catálogo y desempate, no reemplaza las estrellas personales.
- Las equivalencias entre géneros de series y películas son aproximaciones explícitas (acción/aventura, ciencia ficción/fantasía, guerra).

## Por qué se recomienda

Si hay un título con al menos 4 estrellas y un género compartido, se cita su nombre, nota y género. Sin evidencia positiva se explica que el género aparece en el ADN pero aún no tiene una valoración positiva confirmatoria. Si no existe afinidad, se etiqueta como exploración. Las filas coreanas son editoriales y no afirman personalización.

Las explicaciones son privadas, dentro de la sesión del usuario; no se agregan a perfiles públicos.

## Límites y siguientes iteraciones

Esta entrega usa estrellas y géneros. No afirma usar directores, reacciones, revisiones ni feedback persistente de «No es para mí». Esas señales necesitan un modelo específico antes de incorporarse. Los descartes de la sesión de elección no se interpretan como un rechazo permanente del género.

Validación: `npm run test:tonight`, compilación y lint. Falta desplegar el cálculo de ADN 1.2, recalcular y verificar con cuentas reales; las pruebas locales no demuestran adopción ni calidad percibida.
