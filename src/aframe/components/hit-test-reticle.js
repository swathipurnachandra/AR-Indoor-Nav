// A-Frame component: positions the entity using WebXR hit test results
// Shows a green ring reticle when a plane is detected.

/* global AFRAME */
(function register() {
    if (!window.AFRAME) return;

    const THREE = AFRAME.THREE;

    AFRAME.registerComponent('hit-test-reticle', {
        schema: {},
        init() {
            // Build a ring reticle if no geometry is provided
            const obj = this.el.getObject3D('mesh');
            if (!obj) {
                const ringGeo = new THREE.RingGeometry(0.08, 0.1, 32);
                ringGeo.rotateX(-Math.PI / 2);
                const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, side: THREE.DoubleSide });
                const mesh = new THREE.Mesh(ringGeo, ringMat);
                this.el.setObject3D('mesh', mesh);
            }

            this.el.object3D.visible = false;
            this._requested = false;
            this._hitTestSource = null;

            // When entering AR, set up hit test
            this._onEnterVR = () => {
                const scene = this.el.sceneEl;
                const isAR = scene && scene.is('ar-mode');
                if (!isAR) return;

                const renderer = scene.renderer;
                const session = renderer && renderer.xr && renderer.xr.getSession();
                if (!session || this._requested) return;
                this._requested = true;

                session.requestReferenceSpace('viewer').then(viewerSpace =>
                    session.requestHitTestSource({ space: viewerSpace })
                ).then(src => {
                    this._hitTestSource = src;
                    session.addEventListener('end', () => {
                        this._hitTestSource = null;
                        this._requested = false;
                        this.el.object3D.visible = false;
                    });
                }).catch(err => {
                    console.warn('[hit-test-reticle] failed to create hit test source', err);
                });
            };

            this.el.sceneEl.addEventListener('enter-vr', this._onEnterVR);
        },

        tick() {
            const scene = this.el.sceneEl;
            if (!scene || !scene.is('ar-mode') || !this._hitTestSource) return;

            // frame is exposed by A-Frame during XR; fallback to renderer.xr.getFrame if available
            const frame = scene.frame || (scene.renderer && scene.renderer.xr && scene.renderer.xr.getFrame && scene.renderer.xr.getFrame());
            const refSpace = scene.renderer && scene.renderer.xr && scene.renderer.xr.getReferenceSpace && scene.renderer.xr.getReferenceSpace();
            if (!frame || !refSpace) return;

            const results = frame.getHitTestResults(this._hitTestSource);
            if (results && results.length) {
                const pose = results[0].getPose(refSpace);
                const t = pose.transform.position;
                this.el.object3D.position.set(t.x, t.y, t.z);
                this.el.object3D.visible = true;
            } else {
                this.el.object3D.visible = false;
            }
        },

        remove() {
            this.el.sceneEl.removeEventListener('enter-vr', this._onEnterVR);
            this._onEnterVR = null;
            if (this._hitTestSource) this._hitTestSource.cancel && this._hitTestSource.cancel();
            this._hitTestSource = null;
        }
    });
})();
