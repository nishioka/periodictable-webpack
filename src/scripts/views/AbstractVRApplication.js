'use strict';

import * as THREE from 'three';
import TWEEN from 'tween.js';

import 'webvr-polyfill';
import WebVRManager from 'webvr-boilerplate';

// import 'VRControls';
import 'fly-controls';
import 'OrbitControls';
import 'VREffect';

class AbstractVRApplication {
  constructor() {
    this._scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    this._camera.position.x = 200;
    this._camera.position.y = 200;
    this._camera.position.z = 2000;
    this._scene.add(this._camera);

    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setClearColor(0x222222);
    document.body.appendChild(this._renderer.domElement);

    this._effect = new THREE.VREffect(this._renderer);
    this._effect.setSize(window.innerWidth, window.innerHeight);

    // this._controlsVR = new THREE.VRControls(this._camera);
    this._controlsFly = new THREE.VRFlyControls(this._camera, this._renderer.domElement);
    this._controlsOrbit = new THREE.OrbitControls(this._camera, this._renderer.domElement);

    this._manager = new WebVRManager(this._renderer, this._effect, { hideButton: false });

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    window.addEventListener('keydown', this.onKey.bind(this), false);

    this.addAxisGrid();

    this.animate();
  }

  get renderer() {
    return this._renderer;
  }

  get camera() {
    return this._camera;
  }

  get scene() {
    return this._scene;
  }

  animate(timestamp) {
    // keep looping
    requestAnimationFrame(this.animate.bind(this));

    // Object update
    TWEEN.update();

    // Update VR headset position and apply to camera.
    switch (this._manager.mode) {
    case 1:
      this._controlsOrbit.update();
      break;
    case 3:
      // this._controlsVR.update();
      this._controlsFly.update();
      break;
    }

    // Render the scene through the VREffect.
    this._manager.render(this._scene, this._camera, timestamp);
  }

  onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onKey(event) {
    event.preventDefault();

    if (event.keyCode === 72) { //h
      console.log('camera.rotation: x=', this._camera.rotation.x, ', y=', this._camera.rotation.y, ', z=', this._camera.rotation.z);
      if (this.helper) {
        this.removeAxisGrid();
      } else {
        this.addAxisGrid();
      }
    }
  }
}

export default AbstractVRApplication;
