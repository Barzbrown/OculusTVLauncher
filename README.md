# Nova Construct

Nova Construct is a WebXR spatial workspace for Meta Quest headsets (Quest 2 and newer). It provides a voice-enabled AI assistant named Nova who collaborates with you inside an infinite "Construct" space inspired by The Matrix.

## Features

- Immersive WebXR environment rendered with Three.js and vanilla ES modules.
- Floating AI-powered boards for notes, web summaries, file uploads, memories, and generated images.
- Voice-enabled assistant avatar with speech bubble and mouth animation synced to browser text-to-speech.
- Left wrist menu toolbelt for spawning new content, uploading files, asking Nova questions, performing web searches, opening external web windows, generating AI art, toggling sketch mode, loading persistent memory, and customizing Nova's avatar.
- Right-hand ray-based interactions and 3D sketching similar to Tilt Brush when sketch mode is enabled.

## Running Locally

Serve the repository statically so that `/public` is available at the root and `/src` can be imported directly. For example:

```bash
npx http-server .
```

Then open `http://localhost:8080/public/index.html` in the Meta Quest browser, press the **Enter VR** button, and interact with Nova Construct.

## Backend Endpoints

This client expects Emergent backend endpoints to be reachable relative to the same origin:

- `POST /api/chat`
- `POST /api/web`
- `POST /api/image`
- `POST /api/upload`
- `GET /api/memory`

These endpoints return JSON payloads documented in `src/api.js`.
