import * as THREE from 'three';
import { setupHitTest } from './core/hit-test.js';
import { showBlocker, showOverlayButton, showToast } from './utils/ui.js';

let renderer, scene, camera;
let reticle, updateHitTest;

// Entry
initScene();
detectAndStart();

// -------------------- Capability / Start Flow --------------------
async function detectAndStart() {
  const xrAvailable = 'xr' in navigator;
  console.log('[WebXR] navigator.xr:', xrAvailable);

  if (!xrAvailable) {
    await startCameraFallback('WebXR not available on this browser/device.');
    return;
  }

  let arSupported = false;
  try {
    arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    console.log('[WebXR] immersive-ar supported:', arSupported);
  } catch (err) {
    console.warn('[WebXR] isSessionSupported error:', err);
  }

  if (!arSupported) {
    await startCameraFallback('immersive-ar not supported. Using camera preview fallback.');
    return;
  }

  // AR is supported; show start button
  showOverlayButton({
    label: 'Start AR',
    onClick: async () => {
      try {
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test']
        });
        await renderer.xr.setSession(session);
        showToast('AR session started');
      } catch (err) {
        console.error('[WebXR] Failed to start AR session:', err);
        await startCameraFallback('Failed to start AR. Camera fallback active.');
      }
    }
  });
}

// -------------------- Fallback Camera --------------------
async function startCameraFallback(message) {
  showBlocker(message);
  try {
    const stream = await navigator.mediaDevices?.getUserMedia?.({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
    const v = document.getElementById('cam');
    if (v) {
      v.srcObject = stream;
      await v.play().catch(() => { });
      console.log('[Camera] Fallback preview started.');
    }
  } catch (err) {
    console.error('[Camera] getUserMedia error:', err);
    showToast('Camera access failed.');
  }
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

  // Placeholder arrow
  const arrow = createPlaceholderArrow();
  scene.add(arrow);

  // Hit test integration
  updateHitTest = setupHitTest(renderer, reticle);

  // Render loop
  renderer.setAnimationLoop((ts, frame) => {
    const refSpace = renderer.xr.getReferenceSpace();
    if (frame) updateHitTest(frame, refSpace);

    // Follow reticle
    if (reticle.visible) {
      arrow.position.copy(reticle.position);
    }

    renderer.render(scene, camera);
  });
}

function createPlaceholderArrow() {
  // Simple box as a navigation arrow stand-in
  const geo = new THREE.BoxGeometry(0.1, 0.1, 0.25);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff3f3f });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'placeholder-arrow';
  mesh.castShadow = false;
  return mesh;
}
