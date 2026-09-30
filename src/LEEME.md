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

Ronda 7:
- ADN rediseñado: components/dna/DNAView.tsx (nuevo, lo usan DNAPage y PublicDNAPage). Hero con dona de géneros + 3 pestañas: Gustos / Cómo mirás / Perfil y confianza
- Textos siempre en blanco: el color de énfasis ahora solo se usa en gráficos, barras, íconos y fondos (no en textos)
- Los componentes viejos de components/dna/* (DNAHero, DNATags, etc.) ya no se usan; podés borrarlos

Rondas previas: Home, Landing, Auth, Roadmap, Sidebar, Buscar, Listas, menús, modales y demás.
