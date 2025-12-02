import * as THREE from 'three';

let hitTestSource = null;
let requested = false;

export function setupHitTest(renderer, reticle) {
  renderer.xr.addEventListener('sessionstart', async () => {
    const session = renderer.xr.getSession();
    if (!requested) {
      try {
        console.log('[HitTest] Attempting to set up hit test source...');

        // Request hit test source using 'viewer' space
        // The browser will handle reference space conversion internally
        hitTestSource = await session.requestHitTestSource({
          space: await session.requestReferenceSpace('viewer')
        });

        requested = true;
        console.log('[HitTest] Hit test source created successfully');

        session.addEventListener('end', () => {
          hitTestSource = null;
          requested = false;
          console.log('[HitTest] Session ended, hit test source cleared');
        });
      } catch (err) {
        console.error('[HitTest] Failed to set up hit test:', err.message);
        console.warn('[HitTest] Continuing without hit test - AR may not display reticle');
      }
    }
  });

  return function update(frame, referenceSpace) {
    if (!hitTestSource || !frame) return;

    try {
      const results = frame.getHitTestResults(hitTestSource);
      if (results.length > 0) {
        const hit = results[0];
        const pose = hit.getPose(referenceSpace);

        if (pose) {
          reticle.visible = true;
          reticle.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          );
          reticle.updateMatrixWorld(true);
        }
      } else {
        reticle.visible = false;
      }
    } catch (err) {
      console.warn('[HitTest] Error during update:', err.message);
      reticle.visible = false;
    }
  };
}
