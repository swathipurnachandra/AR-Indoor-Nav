import * as THREE from 'three';

// Factory to create a reusable 3D arrow pointing along +Z (local forward)
// Options: length, shaftRadius, headLength, headRadius, color
export function createArrow(options = {}) {
    const {
        length = 0.28,
        shaftRadius = 0.015,
        headLength = 0.12,
        headRadius = 0.05,
        color = 0xff3f3f,
    } = options;

    const group = new THREE.Group();

    const shaftLen = Math.max(0.01, length - headLength);
    const mat = new THREE.MeshStandardMaterial({ color });

    // Cylinder (shaft) is Y-aligned by default -> rotate to align with +Z
    const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 16);
    const shaft = new THREE.Mesh(shaftGeo, mat);
    shaft.rotation.x = Math.PI / 2; // now axis along Z
    // center shaft so its end meets the cone base
    shaft.position.z = shaftLen / 2;
    shaft.castShadow = false;
    group.add(shaft);

    // Cone (head), Y-aligned -> rotate to +Z
    const headGeo = new THREE.ConeGeometry(headRadius, headLength, 20);
    const head = new THREE.Mesh(headGeo, mat);
    head.rotation.x = Math.PI / 2;
    head.position.z = shaftLen + headLength / 2;
    head.castShadow = false;
    group.add(head);

    // Helpful name for debugging
    group.name = 'nav-arrow';
    return group;
}

// Convenience: compute yaw (rotation around Y) so +Z faces from `from` toward `to`
export function computeYaw(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    // yaw: +Y rotation, with forward +Z
    return Math.atan2(dx, dz);
}

