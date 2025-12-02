import * as THREE from 'three';

let hitTestSource = null;
let requested = false;
let hitTestAvailable = false;

export function setupHitTest(renderer, reticle) {
  renderer.xr.addEventListener('sessionstart', async () => {
    const session = renderer.xr.getSession();
    if (!requested) {
      requested = true;
      try {
        console.log('[HitTest] Attempting to set up hit test...');

        // Try to request hit test source with 'viewer' space
        try {
          const viewerSpace = await session.requestReferenceSpace('viewer');
          hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
          hitTestAvailable = true;
          console.log('[HitTest] ✓ Hit test enabled with viewer space');
        } catch (err) {
          console.warn('[HitTest] Viewer space hit test failed:', err.message);

          // Try with 'local' space
          try {
            const localSpace = await session.requestReferenceSpace('local');
            hitTestSource = await session.requestHitTestSource({ space: localSpace });
            hitTestAvailable = true;
            console.log('[HitTest] ✓ Hit test enabled with local space');
          } catch (err2) {
            console.warn('[HitTest] Local space hit test also failed:', err2.message);
            console.log('[HitTest] Continuing without hit test - AR will work without reticle');
            hitTestAvailable = false;
          }
        }

        session.addEventListener('end', () => {
          hitTestSource = null;
          requested = false;
          hitTestAvailable = false;
          console.log('[HitTest] Session ended');
        });
      } catch (err) {
        console.error('[HitTest] Unexpected error:', err.message);
        hitTestAvailable = false;
      }
    }
  });

  return function update(frame, referenceSpace) {
    // If hit test is not available, just hide reticle and return
    if (!hitTestAvailable || !hitTestSource || !frame) {
      reticle.visible = false;
      return;
    }

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