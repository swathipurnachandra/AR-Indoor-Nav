# AR Indoor Navigation System (WebXR + Three.js)

Browser-based AR that overlays 3D navigation arrows onto the real world to guide users indoors — no native app required.

> Real-time floor detection (WebXR Hit Test), pose tracking, and lightweight waypoints provide turn-by-turn guidance using only the device camera and modern web tech.


## ✨ Features

- Environment scanning & floor detection via WebXR Hit Test API
- AR path navigation with 3D arrows (waypoints) placed on the floor
- Real-time pose tracking to keep arrows stable as you move
- 100% web-based — runs in the browser, installation-free
- Dynamic waypoints for clear, step-by-step guidance
- Mobile-friendly performance with low-poly assets


## 🧠 How it works

At a high level, the app opens an immersive-ar WebXR session, performs hit tests to find floor planes, and renders a sequence of waypoints (arrows) along a precomputed path. As the user moves, the render loop updates object transforms using the latest XR viewer pose to maintain anchoring.

Key modules in this repository:

- `src/core/xr-session.js` — Starts and manages the WebXR AR session (features, reference space, permissions)
- `src/core/hit-test.js` — Requests XR hit-test source and computes floor intersections for object placement
- `src/core/renderer.js` — Three.js scene, camera, lights, renderer setup
- `src/core/loop.js` — Per-frame render/update loop tied to XR animation frames
- `src/navigation/path.js` — Path definition and waypoint generation utilities
- `src/navigation/tracking.js` — Device pose handling and stabilization helpers
- `src/components/arrow.js` — 3D arrow/waypoint component (size, color, orientation)
- `src/components/waypoint.js` — Waypoint wrapper that positions arrows along the path
- `src/utils/math.js` — Vector math and heading helpers
- `src/utils/ui.js` — Lightweight UI overlays (buttons, hints)
- `src/app.js` — App bootstrap and orchestration


## 🧱 Project structure

```
index.html
package.json
README.md
vite.config.js
public/
	icons/
	models/
	textures/
src/
	app.js
	styles.css
	components/
		arrow.js
		waypoint.js
	core/
		hit-test.js
		loop.js
		renderer.js
		xr-session.js
	navigation/
		path.js
		tracking.js
	utils/
		math.js
		ui.js
```


## 📋 Requirements

- An AR-capable mobile device with camera access
- A modern browser with WebXR and Hit Test support
	- Recommended: Chrome for Android (latest)
	- iOS/Safari: support is limited/experimental; behavior may vary
- Secure context (HTTPS) is required for camera/WebXR on mobile devices


## 🚀 Quickstart

1) Install dependencies

```pwsh
npm install
```

2) Run the dev server

```pwsh
# Start the Vite dev server
npm run dev

# Optional: expose to your local network (for testing on a phone)
# npm run dev -- --host
```

3) Open on your device

- Navigate to the URL shown in your terminal.
- Use HTTPS for camera + WebXR on mobile. If you need HTTPS locally, consider using a proxy/tunnel or a Vite SSL plugin.

4) Start AR

- Tap the “Start AR” button (or the browser’s AR prompt) and point the camera at the floor.
- Once a plane is detected, waypoints (arrows) appear aligned to the path.

5) Build for production

```pwsh
npm run build
npm run preview
```


## 🔧 Configuration

- Waypoints / Path: edit `src/navigation/path.js` to define waypoint coordinates and spacing.
- Arrow appearance: tweak size, color, and geometry in `src/components/arrow.js`.
- Placement logic: floor hit-test behavior lives in `src/core/hit-test.js`.
- Session flags: enable/disable WebXR features in `src/core/xr-session.js`.


## 📐 Navigation behavior

- Waypoints are spaced along a predefined path (e.g., every 1–1.5 m) and oriented toward the next segment.
- When the heading change between segments exceeds a threshold (e.g., 25–35°), turn arrows can be emphasized.
- For maximum stability, prefer anchors (if available in your device/browser) with a fallback to per-frame pose updates.


Notes:

- WebXR AR requires a secure context (HTTPS). Localhost is considered secure; LAN IPs are not.
- Hit Test may not be available on all devices; the app should show a graceful message when unavailable.


## 🧪 Tips for better results

- Use low-poly models and small textures (prefer compressed textures in `public/textures/`).
- Keep arrow meshes simple; avoid heavy materials or post-processing on mobile.
- Maintain consistent waypoint spacing and align arrows to the path heading.


## ☁️ Deployment (Vercel or any static host)

1) Build the app: `npm run build` (outputs to `dist/`)
2) Deploy `dist/` to a static host with HTTPS (e.g., Vercel, Netlify, GitHub Pages + HTTPS)

Vercel (CLI):

```pwsh
npm i -g vercel
vercel
```

Vercel will detect a Vite app and serve the production build over HTTPS.


## 🗺️ Use cases

- University campus buildings (classrooms, labs, offices)
- Hospitals (departments, labs, wards)
- Shopping malls (stores, sections)
- Office buildings (meeting rooms, amenities)
- Event halls/expo centers (booths, stages)


## 🛣️ Roadmap

- Destination picker UI to swap paths at runtime
- Anchors API integration where supported
- Occlusion and depth-based placement
- Optional spatial maps / indoor positioning integration
- Offline route packs and waypoint caching


## 🙌 Credits

- Built with WebXR and Three.js
- Dev server/build: Vite



