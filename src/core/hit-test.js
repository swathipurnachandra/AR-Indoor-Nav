import * as THREE from 'three';

let hitTestSource = null;
let requested = false;
let usedReferenceSpace = null;

export function setupHitTest(renderer, reticle) {
  renderer.xr.addEventListener('sessionstart', async () => {
    const session = renderer.xr.getSession();
    if (!requested) {
      try {
        console.log('[HitTest] Setting up hit test source...');

        // Try different reference space types in order of preference
        const spacesToTry = ['viewer', 'local', 'local-floor'];
        let refSpace = null;

        for (const spaceType of spacesToTry) {
          try {
            refSpace = await session.requestReferenceSpace(spaceType);
            usedReferenceSpace = spaceType;
            console.log(`[HitTest] Successfully created '${spaceType}' reference space`);
            break;
          } catch (err) {
            console.warn(`[HitTest] '${spaceType}' not available: ${err.message}`);
          }
        }

        if (!refSpace) {
          console.error('[HitTest] No supported reference spaces available!');
          return;
        }

        // Request hit test source
        try {
          hitTestSource = await session.requestHitTestSource({ space: refSpace });
          requested = true;
          console.log(`[HitTest] Hit test source created successfully using '${usedReferenceSpace}'`);
        } catch (err) {
          console.error('[HitTest] Failed to create hit test source:', err.message);
          // Continue without hit test - still show 3D objects
        }

        session.addEventListener('end', () => {
          hitTestSource = null;
          requested = false;
          usedReferenceSpace = null;
          console.log('[HitTest] Session ended');
        });
      } catch (err) {
        console.error('[HitTest] Unexpected error:', err.message);
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
      console.warn('[HitTest] Error during hit test update:', err.message);
    }
  };
}