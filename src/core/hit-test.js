import * as THREE from 'three';

let hitTestSource = null;
let requested = false;

export function setupHitTest(renderer, reticle) {
  renderer.xr.addEventListener('sessionstart', async () => {
    const session = renderer.xr.getSession();
    if (!requested) {
      try {
        // Try 'viewer' first, fallback to 'local' if not supported
        let viewerSpace;
        try {
          viewerSpace = await session.requestReferenceSpace('viewer');
        } catch (err) {
          console.warn('[HitTest] viewer space not supported, trying local:', err.message);
          viewerSpace = await session.requestReferenceSpace('local');
        }

        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        requested = true;
        console.log('[HitTest] Hit test source acquired successfully');

        session.addEventListener('end', () => {
          hitTestSource = null;
          requested = false;
        });
      } catch (err) {
        console.error('[HitTest] failed to acquire hit test source:', err);
      }
    }
  });

  return function update(frame, referenceSpace) {
    if (!hitTestSource || !frame) return;
    const results = frame.getHitTestResults(hitTestSource);
    if (results.length) {
      const hit = results[0];
      const pose = hit.getPose(referenceSpace);
      reticle.visible = true;
      reticle.position.set(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      );
      reticle.updateMatrixWorld(true);
    } else {
      reticle.visible = false;
    }
  };
}
