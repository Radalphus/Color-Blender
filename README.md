# Color Blender

A color blending tool built with React, TypeScript, and Vite. Upload an image, pick colors from it with the eyedropper, and blend them on a palette grid.

The app source lives in [`color-blender-react/`](color-blender-react/).

**Live site:** https://radalphus.github.io/Color-Blender/

## Running locally

```bash
cd color-blender-react
npm install
npm run dev
```

## Deployment

Deploys happen automatically via GitHub Actions on every push to `main` (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). The workflow builds the app and publishes it to GitHub Pages.

The old `npm run deploy` / `gh-pages` flow is no longer used.
