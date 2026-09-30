# Watchly — rediseño (carpeta src completa)

Reemplazá TODA la carpeta src/ de App-Peliculas con esta.

Ronda 5:
- Fondo global nuevo: portadas de películas al azar, full blur (components/layout/AmbientBackground.tsx + AppShell). El color de énfasis de TODA la app sale de ese fondo (lib/tone.ts). Se eliminó el fondo azul/rojo de index.css.
- pages/PublicProfilePage: perfil rediseñado 100% (hero, stats, navegación fija, resumen con barra de estados, destacadas, viendo ahora, últimos agregados, listas)
- pages/LibraryPage: resumen por estado clicable, búsqueda, tipo, orden, vista cuadrícula/lista
- media/MediaDetailModal: nueva organización (panel izquierdo: póster + estado + nota + acciones; derecha: "Sobre el título" / "Mi diario")

Rondas previas: Home, Landing, Auth, Roadmap, Sidebar, Buscar, Listas, menús, modales y demás.
