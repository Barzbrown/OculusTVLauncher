# Oculus TV Launcher

A zero-build WebXR playground for testing Oculus TV integrations directly in the Quest Browser. The site serves static assets and streams Three.js from a CDN so you can iterate on scripts without installing an Android APK.

## Getting started

1. Install the Node.js LTS runtime (v18 or newer).
2. Clone this repository and install dependencies (there are none, so this step is instant).
3. Start the static server:

   ```bash
   npm start
   ```

4. Navigate to `http://<your-machine-ip>:4173` in the Quest Browser. The landing page loads `public/index.html`, which in turn imports `src/main.js` without any bundling.

The server hosts both the `public/` and `src/` directories, allowing you to edit JavaScript modules in `src/` and reload the page immediately.

## File structure

```text
public/
  index.html     # Entry point loaded by the Quest Browser
src/
  main.js        # Three.js scene and UI wiring
server.js        # Lightweight static file server
package.json     # npm scripts and metadata
```

## Serving the site without Node.js

Any static file host will work because the project has no build step. For example:

- Python: `python3 -m http.server --directory public 4173`
- nginx: map `/` to `public/` and `/src/` to the repository's `src/`
- GitHub Pages: commit `public/` as your site root and keep `src/` alongside it

Ensure that `/src/main.js` is reachable from the same origin as `index.html`, as the HTML file loads it via a relative path.

## Development tips

- Quest Browser caches aggressively. Use the browser's reload menu or toggle Wi-Fi to force-refresh static assets.
- Keep developer tools open on your desktop machine via `chrome://inspect` for easier debugging of console logs.
- The VR button in the bottom-right corner of the page is provided by Three.js' `VRButton` helper.
