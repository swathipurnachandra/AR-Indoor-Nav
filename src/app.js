import * as THREE from 'three';
import { createWaypoint } from './components/waypoint.js';
import { computeYaw, createArrow } from './components/arrow.js';
import { buildDemoPath } from './navigation/path.js';
import { showBlocker, showOverlayButton, showToast } from './utils/ui.js';

let renderer, scene, camera;
let reticle;
let controller;
let waypoints = [];
let pathPlaced = false;
let xrSession = null;
let isARMode = false;

// Entry
initScene();
startApp().catch(err => {
  console.error('[App] Fatal error:', err);
  showBlocker(`Fatal error: ${err.message}`);
});

// -------------------- Main App Entry --------------------
async function startApp() {
  console.log('=== AR Navigation App ===');
  console.log('Browser:', navigator.userAgent);
  console.log('Platform:', navigator.platform);

  // Try AR first, fallback to camera mode
  const arAvailable = await tryARMode();

  if (!arAvailable) {
    await tryCameraMode();
  }
}

// -------------------- AR Mode (Progressive Enhancement) --------------------
async function tryARMode() {
  console.log('[App] Attempting AR mode...');

  const xrAvailable = 'xr' in navigator;
  if (!xrAvailable) {
    console.log('[App] WebXR not available, will try camera mode');
    return false;
  }

  let arSupported = false;
  try {
    arSupported = await navigator.xr.isSessionSupported('immersive-ar');
  } catch (err) {
    console.warn('[App] AR support check failed:', err.message);
    return false;
  }

  if (!arSupported) {
    console.log('[App] immersive-ar not supported');
    return false;
  }

  // AR is supported
  showOverlayButton({
    label: 'Start AR Navigation',
    onClick: async () => {
      try {
        console.log('[App] Starting AR session...');
        const session = await navigator.xr.requestSession('immersive-ar', {
          optionalFeatures: ['hit-test']
        }).catch(err => {
          console.warn('[App] AR session request failed, trying minimal config:', err.message);
          return navigator.xr.requestSession('immersive-ar');
        });

        xrSession = session;
        isARMode = true;
        await renderer.xr.setSession(session);
        showToast('AR Navigation Active');
      } catch (err) {
        console.error('[App] Failed to start AR:', err);
        showToast('AR failed, using camera mode');
        // Fall back to camera mode
        await startCameraMode();
      }
    }
  });

  return true;
}

// -------------------- Camera Fallback Mode --------------------
async function tryCameraMode() {
  console.log('[App] Attempting camera mode...');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    const videoElement = document.getElementById('cam');
    if (videoElement) {
      videoElement.srcObject = stream;
      await videoElement.play();
      console.log('[App] Camera stream active');
    }

    // Show start button for camera mode
    showOverlayButton({
      label: 'Start Navigation',
      onClick: async () => {
        startCameraMode();
      }
    });

    return true;
  } catch (err) {
    console.error('[App] Camera access failed:', err);
    showBlocker('Camera access denied. Please grant permission and reload.');
    return false;
  }
}

async function startCameraMode() {
  console.log('[App] Starting camera navigation mode');
  isARMode = false;
  showToast('Camera Navigation Active');
  // The 3D scene will render on top of the camera feed
}// -------------------- 3D Scene Setup --------------------
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

  // Lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.6));

  // Reticle (ring on the floor)
  const ringGeo = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
  reticle = new THREE.Mesh(ringGeo, ringMat);
  reticle.visible = false;
  scene.add(reticle);

  // Arrow visual
  const reticleArrow = createArrow({ color: 0x3fa9ff, length: 0.22, headRadius: 0.04 });
  reticleArrow.name = 'reticle-arrow';
  scene.add(reticleArrow);

  // Controller
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', () => {
    if (pathPlaced) return;
    placeDemoPathAtReticle();
  });
  scene.add(controller);

  // Animation loop - works in both AR and camera mode
  renderer.setAnimationLoop((ts, frame) => {
    renderer.render(scene, camera);
  });
}

function placeDemoPathAtReticle() {
  // Use center of screen as origin in camera mode, reticle position in AR mode
  const origin = isARMode && reticle.visible
    ? reticle.position.clone()
    : new THREE.Vector3(0, 0, -1);

  const points = buildDemoPath(origin, camera);

  // Clear existing waypoints
  for (const wp of waypoints) scene.remove(wp);
  waypoints = [];

  // Create new waypoints
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = points[i + 1] ?? points[i];
    const yaw = computeYaw(p, next);
    const wp = createWaypoint({ position: p, yaw });
    scene.add(wp);
    waypoints.push(wp);
  }

  pathPlaced = true;
  showToast('Navigation path placed! 🎯');
}
