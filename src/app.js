let xrSession;
let viewerSpace;
let hitTestSource;

AFRAME.registerComponent("ar-hit-test", {
  init: function () {
    const sceneEl = this.el.sceneEl;

    sceneEl.renderer.xr.addEventListener("sessionstart", async () => {
      xrSession = sceneEl.renderer.xr.getSession();

      viewerSpace = await xrSession.requestReferenceSpace("viewer");
      hitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace });

      console.log("Hit test ready.");
    });

    sceneEl.renderer.xr.addEventListener("sessionend", () => {
      xrSession = null;
      hitTestSource = null;
    });

    this.reticle = document.getElementById("reticle");
  },

  tick: function (time, frame) {
    if (!frame || !hitTestSource) return;

    const refSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(refSpace);

      this.reticle.visible = true;
      this.reticle.object3D.position.set(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      );

      this.reticle.object3D.quaternion.set(
        pose.transform.orientation.x,
        pose.transform.orientation.y,
        pose.transform.orientation.z,
        pose.transform.orientation.w
      );
    } else {
      this.reticle.visible = false;
    }
  }
});

// Load GLB Model
AFRAME.registerComponent("load-model", {
  init: function () {
    const url = "your_model.glb"; // change your file here!
    const loader = new THREE.GLTFLoader();

    loader.load(
      url,
      gltf => {
        this.el.setObject3D("mesh", gltf.scene);
        console.log("Model loaded!");
      },
      xhr => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
      err => console.error("Model load error", err)
    );
  }
});
