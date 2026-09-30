# Watchly — rediseño (carpeta src completa)

Reemplazá TODA la carpeta src/ de App-Peliculas con esta.

Ronda 5:
- Fondo global nuevo: portadas de películas al azar, full blur (components/layout/AmbientBackground.tsx + AppShell). El color de énfasis de TODA la app sale de ese fondo (lib/tone.ts). Se eliminó el fondo azul/rojo de index.css.
- pages/PublicProfilePage: perfil rediseñado 100% (hero, stats, navegación fija, resumen con barra de estados, destacadas, viendo ahora, últimos agregados, listas)
- pages/LibraryPage: resumen por estado clicable, búsqueda, tipo, orden, vista cuadrícula/lista
- media/MediaDetailModal: nueva organización (panel izquierdo: póster + estado + nota + acciones; derecha: "Sobre el título" / "Mi diario")

Ronda 6:
- pages/HomePage: rework completo (hero sin cortes, "Quiero verla" con guardado directo, panel "Tu cine", "Seguí donde quedaste", "Tu lista para ver" + "Elegir por mí", recientes, tendencia con botón +, populares, listas)
- home/HeroBackdrop: nuevo modo soft (la imagen se funde con el fondo global por todos los bordes)

Rondas previas: Home, Landing, Auth, Roadmap, Sidebar, Buscar, Listas, menús, modales y demás.
