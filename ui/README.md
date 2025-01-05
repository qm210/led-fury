# `create-preact`

<h2 align="center">
  <img height="256" width="256" src="./src/assets/preact.svg">
</h2>

<h3 align="center">Get started using Preact and Vite!</h3>

## Getting Started

-   `npm run dev` - Starts a dev server at http://localhost:5173/

-   `npm run build` - Builds for production, emitting to `dist/`

-   `npm run preview` - Starts a server at http://localhost:4173/ to test production build locally


## Tailwind
For development mode, run:
```
npx tailwindcss -i src/styles/global.css -c tailwind.config.js --watch
```
This will watch for changes and generate the final CSS file.

For production build, run:
```
NODE_ENV=production npx tailwindcss -i src/styles/global.css -c tailwind.config.js --minify
```
This will generate an optimized CSS file for production use.