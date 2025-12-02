// A-Frame component: tap/select to place a short demo path of waypoints at the reticle.
// Optionally uses a GLTF model (via gltf-model) for the arrow if provided; otherwise uses primitives.

/* global AFRAME */
(function register() {
    if (!window.AFRAME) return;

    const THREE = AFRAME.THREE;

    function computeYaw(from, to) {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        return Math.atan2(dx, dz);
    }

    function deriveXZAxesFromCamera(camera) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0; forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        return { forward, right };
    }

    function buildDemoPath(origin, camera) {
        const { forward, right } = deriveXZAxesFromCamera(camera);
        const p0 = origin.clone();
        const p1 = origin.clone().addScaledVector(forward, 0.8);
        const p2 = p1.clone().addScaledVector(right, 0.6);
        const p3 = p2.clone().addScaledVector(forward, 0.6);
        return [p0, p1, p2, p3];
    }

    AFRAME.registerComponent('place-demo-path', {
        schema: {
            reticle: { type: 'selector' },
            arrowModel: { type: 'selector', default: null }, // <a-asset-item id="arrowModel" src="/public/models/arrow.glb">
            scale: { type: 'number', default: 1 }
        },
        init() {
            this._placed = false;
            this._waypoints = [];

            const scene = this.el.sceneEl;
            const renderer = scene.renderer;

            // Listen to XR controller 'select' gesture
            this._controller = null;
            const setupController = () => {
                try {
                    this._controller = renderer.xr.getController(0);
                    this._controller.addEventListener('select', this._onSelect);
                } catch { /* no-op */ }
            };

            this._onSelect = () => {
                if (this._placed) return;
                const reticle = this.data.reticle;
                if (!reticle || !reticle.object3D.visible) return;
                this.placeAt(reticle.object3D.position);
            };

            this._onEnterVR = () => {
                if (scene.is('ar-mode')) setupController();
            };

            scene.addEventListener('enter-vr', this._onEnterVR);
            // Fallback: also handle normal taps on the scene
            scene.canvas && scene.canvas.addEventListener('click', this._onSelect);
        },

        placeAt(worldPos) {
            const scene = this.el.sceneEl;
            const camera = scene.camera;
            const origin = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
            const points = buildDemoPath(origin, camera);

            // Clear old
            for (const e of this._waypoints) e.parentNode && e.parentNode.removeChild(e);
            this._waypoints.length = 0;

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const next = points[i + 1] || points[i];
                const yaw = computeYaw(p, next);

                const wp = document.createElement('a-entity');
                wp.setAttribute('position', `${p.x} ${p.y} ${p.z}`);

                // Ring
                const ring = document.createElement('a-entity');
                ring.setAttribute('geometry', `primitive:ring; radiusInner:${0.08 * this.data.scale}; radiusOuter:${0.1 * this.data.scale}; segmentsTheta:32`);
                ring.setAttribute('rotation', '-90 0 0');
                ring.setAttribute('material', 'color:#00ff66; side:double');
                wp.appendChild(ring);

                // Arrow (GLTF if provided, else primitives)
                const arrow = document.createElement('a-entity');
                arrow.setAttribute('rotation', `0 ${THREE.MathUtils.radToDeg(yaw)} 0`);
                arrow.setAttribute('position', `0 ${0.05 * this.data.scale} 0`);

                if (this.data.arrowModel) {
                    arrow.setAttribute('gltf-model', `#${this.data.arrowModel.id}`);
                    arrow.setAttribute('scale', `${0.3 * this.data.scale} ${0.3 * this.data.scale} ${0.3 * this.data.scale}`);
                } else {
                    // Shaft
                    const shaft = document.createElement('a-entity');
                    shaft.setAttribute('geometry', `primitive:cylinder; radius:${0.015 * this.data.scale}; height:${0.16 * this.data.scale}`);
                    shaft.setAttribute('rotation', '90 0 0');
                    shaft.setAttribute('position', `${0} ${0} ${0.08 * this.data.scale}`);
                    shaft.setAttribute('material', 'color:#ff3f3f');
                    arrow.appendChild(shaft);
                    // Head
                    const head = document.createElement('a-entity');
                    head.setAttribute('geometry', `primitive:cone; radiusBottom:${0.05 * this.data.scale}; height:${0.12 * this.data.scale}`);
                    head.setAttribute('rotation', '90 0 0');
                    head.setAttribute('position', `${0} ${0} ${0.16 * this.data.scale}`);
                    head.setAttribute('material', 'color:#ff3f3f');
                    arrow.appendChild(head);
                }

                wp.appendChild(arrow);
                this.el.appendChild(wp);
                this._waypoints.push(wp);
            }

            this._placed = true;
        },

        remove() {
            const scene = this.el.sceneEl;
            scene.removeEventListener('enter-vr', this._onEnterVR);
            scene.canvas && scene.canvas.removeEventListener('click', this._onSelect);
            if (this._controller) this._controller.removeEventListener('select', this._onSelect);
            for (const e of this._waypoints) e.parentNode && e.parentNode.removeChild(e);
            this._waypoints.length = 0;
        }
    });
})();
