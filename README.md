# React + TypeScript + Vite

## Acceso en desarrollo local

`npm run dev` usa `http://localhost:5174` con puerto estricto para mantener estables los retornos OAuth. Si está ocupado, cerrar el servidor anterior o usarlo; Vite no cambia de puerto automáticamente.

En Supabase → Authentication → URL Configuration, mantener Site URL en `https://watchly-sigma.vercel.app` y agregar a Redirect URLs:

```text
http://localhost:5174/inicio
http://localhost:5174/confirmar-email
http://localhost:5174/actualizar-password
```

Conservar también los retornos de producción. Google Cloud mantiene como URI de redireccionamiento el callback del proyecto Supabase, no localhost. Los flujos de la app usan `window.location.origin` para volver al entorno donde se iniciaron.

El proyecto de `VITE_SUPABASE_URL` debe coincidir con el configurado en Vercel para usar las mismas cuentas. Una cuenta creada con Google no implica una contraseña de Watchly: usar el botón Google o configurar una contraseña mediante recuperación. La contraseña de Gmail no se usa en el formulario de Watchly.

Estos ajustes del panel de Supabase no se aplican al editar el repositorio. Validar el acceso desde localhost después de guardarlos.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
