import * as THREE from 'three';
import { setupHitTest } from './core/hit-test.js';
import { createWaypoint } from './components/waypoint.js';
import { computeYaw, createArrow } from './components/arrow.js';
import { buildDemoPath } from './navigation/path.js';
import { showBlocker, showOverlayButton, showToast } from './utils/ui.js';

let renderer, scene, camera;
let reticle, updateHitTest;
let controller; // XR select controller
let waypoints = [];
let pathPlaced = false;

// Entry
initScene();
detectAndStart().catch(err => {
  console.error('[App] Fatal error:', err);
  showBlocker(`Fatal error: ${err.message}`);
});

// -------------------- Capability / Start Flow --------------------
async function detectAndStart() {
  console.log('=== AR Diagnostic Info ===');
  console.log('Browser:', navigator.userAgent);
  console.log('Platform:', navigator.platform);

  const xrAvailable = 'xr' in navigator;
  console.log('[WebXR] navigator.xr available:', xrAvailable);

  if (!xrAvailable) {
    showBlocker('WebXR not available on this browser/device. Try Chrome, Edge, or Samsung Internet on Android.');
    return;
  }

  let arSupported = false;
  try {
    arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    console.log('[WebXR] immersive-ar supported:', arSupported);
  } catch (err) {
    console.warn('[WebXR] isSessionSupported error:', err);
    showBlocker(`WebXR check failed: ${err.message}`);
    return;
  }

  if (!arSupported) {
    showBlocker('immersive-ar not supported on this device. Ensure you have an AR-capable phone with Android/ARCore or iPhone with iOS 14+.');
    return;
  }

  // AR is supported; show start button
  showOverlayButton({
    label: 'Start AR',
    onClick: async () => {
      if (!renderer) await new Promise(r => setTimeout(r, 50));
      // then requestSession...
      try {
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test', 'dom-overlay'],
          optionalFeatures: ['dom-overlay-for-handheld-ar'],
          domOverlay: { root: document.getElementById('app-overlay') }
        });
        await renderer.xr.setSession(session);
        showToast('AR session started');
      } catch (err) {
        console.error('[WebXR] Failed to start AR session:', err);
        console.error('[WebXR] Error name:', err.name);
        console.error('[WebXR] Error message:', err.message);
        showBlocker(`Failed to start AR session:\n${err.message}`);
      }
    }
  });
}

// -------------------- 3D Scene Setup --------------------
function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1));

  // Reticle
  const ringGeo = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
  reticle = new THREE.Mesh(ringGeo, ringMat);
  reticle.visible = false;
  scene.add(reticle);

  // A small reference arrow (follows reticle until a path is placed)
  const reticleArrow = createArrow({ color: 0x3fa9ff, length: 0.22, headRadius: 0.04 });
  reticleArrow.name = 'reticle-arrow';
  scene.add(reticleArrow);

  // Hit test integration
  updateHitTest = setupHitTest(renderer, reticle);

  // XR controller (tap/select) to place a demo path at the reticle once
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', () => {
    if (pathPlaced) return;
    if (!reticle.visible) {
      showToast('Aim at a surface until the ring appears, then tap.');
      return;
    }
    placeDemoPathAtReticle();
  });
  scene.add(controller);

  // Render loop
  renderer.setAnimationLoop((ts, frame) => {
    const refSpace = renderer.xr.getReferenceSpace();
    if (frame) updateHitTest(frame, refSpace);

    // Follow reticle
    if (!pathPlaced && reticle.visible) {
      reticleArrow.visible = true;
      reticleArrow.position.copy(reticle.position);
      // orient reticle arrow to match camera forward on XZ
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0; camDir.normalize();
      const target = reticle.position.clone().add(camDir);
      reticleArrow.rotation.y = computeYaw(reticle.position, target);
    } else {
      reticleArrow.visible = false;
    }

    renderer.render(scene, camera);
  });
}

function placeDemoPathAtReticle() {
  const origin = reticle.position.clone();
  const points = buildDemoPath(origin, camera);

  // clear if re-placing (shouldn't happen with pathPlaced guard, but safe)
  for (const wp of waypoints) scene.remove(wp);
  waypoints = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = points[i + 1] ?? points[i];
    const yaw = computeYaw(p, next);
    const wp = createWaypoint({ position: p, yaw });
    scene.add(wp);
    waypoints.push(wp);
  }
  pathPlaced = true;
  showToast('Path placed. Tap again to do nothing (demo).');
}
