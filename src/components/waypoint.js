import * as THREE from 'three';
import { createArrow } from './arrow.js';

// Creates a floor marker + oriented arrow.
// position: THREE.Vector3 (world)
// yaw: rotation around Y in radians (0 means facing +Z)
export function createWaypoint({ position, yaw = 0, scale = 1, ringColor = 0x00ff66, arrowColor = 0xff3f3f } = {}) {
    const group = new THREE.Group();
    group.name = 'waypoint';

    // Thin ring lying on the floor
    const ringGeo = new THREE.RingGeometry(0.08 * scale, 0.1 * scale, 32).rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: ringColor });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'wp-ring';
    group.add(ring);

    // Arrow slightly above the ring, oriented by yaw
    const arrow = createArrow({ color: arrowColor, length: 0.3 * scale, headRadius: 0.05 * scale });
    arrow.position.y = 0.05 * scale;
    arrow.rotation.y = yaw;
    arrow.name = 'wp-arrow';
    group.add(arrow);

    // Place in world
    if (position) group.position.copy(position);
    group.updateMatrixWorld(true);
    return group;
}

