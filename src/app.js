AFRAME.registerComponent("ar-hit-test", {
  init: function () {
    const sceneEl = this.el.sceneEl;

    this.reticle = document.getElementById("reticle");
    this.hitTestSource = null;
    this.viewerSpace = null;

    sceneEl.renderer.xr.addEventListener("sessionstart", async () => {
      const session = sceneEl.renderer.xr.getSession();

      this.viewerSpace = await session.requestReferenceSpace("viewer");
      this.hitTestSource = await session.requestHitTestSource({
        space: this.viewerSpace
      });

      console.log("Hit-test ready.");
    });

    sceneEl.renderer.xr.addEventListener("sessionend", () => {
      this.hitTestSource = null;
    });
  },

  tick: function (t, frame) {
    if (!frame || !this.hitTestSource) return;

    const refSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
    const results = frame.getHitTestResults(this.hitTestSource);

    if (results.length > 0) {
      const pose = results[0].getPose(refSpace);

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

      this.reticle.setAttribute("visible", "true");
    } else {
      this.reticle.setAttribute("visible", "false");
    }
  }
});
