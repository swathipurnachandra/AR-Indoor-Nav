import * as THREE from 'three';

// Derive forward/right on the XZ plane from the given camera
export function deriveXZAxesFromCamera(camera) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward); // camera looks toward -Z in view, this returns world forward
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return { forward, right };
}

// Build a simple demo path: straight, then right turn, then straight
// origin: THREE.Vector3
// camera: THREE.Camera (used only for forward/right derivation)
export function buildDemoPath(origin, camera) {
    const { forward, right } = deriveXZAxesFromCamera(camera);

    const p0 = origin.clone();
    const p1 = origin.clone().addScaledVector(forward, 0.8);
    const p2 = p1.clone().addScaledVector(right, 0.6);
    const p3 = p2.clone().addScaledVector(forward, 0.6);
    return [p0, p1, p2, p3];
}

