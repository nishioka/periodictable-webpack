'use strict';

import * as THREE from 'three';
import TWEEN from 'tween.js'

import AbstractVRApplication from 'scripts/views/AbstractVRApplication';

// const glslify = require('glslify');
// const shaderVert = glslify('./../shaders/custom.vert');
// const shaderFrag = glslify('./../shaders/custom.frag');
// const noiseMaterial = require('materials/noise');

const elements = require('data/elements');

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

// const gl = document.createElement('canvas').getContext('webgl');

class Main extends AbstractVRApplication {

  constructor() {
    super();

    const promises = [];
    // 周期表のテクスチャを作成する
    for (let i = 0; i < elements.length; i++) {
      elements[i].number = i + 1;
      promises.push(this.createElementMesh(elements[i]));
    }
    this.objects = [];
    Promise.all(promises)
    .then((values) => {
      values.forEach((mesh) => {
        this._scene.add(mesh);
        this.objects.push(mesh);
      });

      // 変形用の配置テーブルを作成する
      this.targets = {};
      this.targets.table = this.createTableObjects(this.objects.length);
      this.targets.sphere = this.createSphereObjects(this.objects.length);
      this.targets.helix = this.createHelixObjects(this.objects.length);
      this.targets.grid = this.createGridObjects(this.objects.length);

      this.formState = 0;

      // var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
      //
      // var geometry = new THREE.BoxGeometry( 200, 200, 200 );
      // var material = new THREE.MeshBasicMaterial( { map: texture } );
      //
      // var material2 = new THREE.ShaderMaterial({
      //     vertexShader: shaderVert,
      //     fragmentShader: shaderFrag
      // });
      // this._mesh = new THREE.Mesh(geometry, material2);//noiseMaterial );
      // this._mesh.position.set(0,0,-300);
      // //const mat1 = noiseMaterial();
      // //this._mesh = new THREE.Mesh( geometry, mat1 );
      //
      // this._scene.add(this._mesh);

      this.transform(this.targets.table, 5000);

      // this.animate();
    });
  }

  createElementMesh(entity) {
    return new Promise((resolver, rejector) => {
      let canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;

      let context = canvas.getContext('2d');
      let geometry = new THREE.PlaneBufferGeometry(canvas.width, canvas.height);

      // SVGの作成
      let svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttributeNS(null, 'version', '1.1');
      svg.setAttribute('xmlns', SVG_NS);
      svg.setAttribute('width', canvas.width);
      svg.setAttribute('height', canvas.height);

      // DOMをforeignObjectでSVGに描画
      let object = document.createElementNS(SVG_NS, 'foreignObject');
      object.setAttribute('width', '100%');
      object.setAttribute('height', '100%');
      svg.appendChild(object);

      // DOMオブジェクトの作成
      let html = document.createElementNS(XHTML_NS, 'div');
      html.setAttribute('xmlns', XHTML_NS);
      object.appendChild(html);

      let element = document.createElementNS(XHTML_NS, 'div');
      element.style.backgroundColor = 'rgba(0,127,127,' + (Math.random() * 0.5 + 0.25) + ')';
      element.style.width = '120px';
      element.style.height = '160px';
      element.style.boxShadow = '0px 0px 12px rgba(0, 255, 255, 0.5)';
      element.style.border = '1px solid rgba(127, 255, 255, 0.25)';
      element.style.textAlign = 'center';
      html.appendChild(element);

      let number = document.createElementNS(XHTML_NS, 'div');
      number.style.position = 'absolute';
      number.style.top = '20px';
      number.style.right = '20px';
      number.style.fontSize = '12px';
      number.style.color = 'rgba(127, 255, 255, 0.75)';
      number.textContent = entity.number;
      element.appendChild(number);

      let symbol = document.createElementNS(XHTML_NS, 'div');
      symbol.style.position = 'absolute';
      symbol.style.top = '40px';
      symbol.style.left = '0px';
      symbol.style.right = '0px';
      symbol.style.fontSize = '60px';
      symbol.style.fontWeight = 'bold';
      symbol.style.color = 'rgba(255, 255, 255, 0.75)';
      symbol.style.textShadow = '0px 0px 10px rgba(0, 255, 255, 0.95)';
      symbol.textContent = entity.symbol;
      element.appendChild(symbol);

      let details = document.createElementNS(XHTML_NS, 'div');
      details.style.position = 'absolute';
      details.style.top = '110px';
      details.style.left = '0px';
      details.style.right = '0px';
      details.style.fontSize = '12px';
      details.style.color = 'rgba(127, 255, 255, 0.75)';
      details.textContent = entity.details;
      element.appendChild(details);

      let mol = document.createElementNS(XHTML_NS, 'div');
      mol.style.position = 'absolute';
      mol.style.bottom = '15px';
      mol.style.left = '0px';
      mol.style.right = '0px';
      mol.style.fontSize = '12px';
      mol.style.color = 'rgba(127, 255, 255, 0.75)';
      mol.textContent = entity.mol;
      element.appendChild(mol);

      // SVGをCanvasに描画する
      var url = 'data:image/svg+xml;charset=utf-8,' + svg.outerHTML;
      var image = new Image();
      image.addEventListener('load', function() {
        context.drawImage(this, 0, 0, canvas.width, canvas.height);

        // 生成したCanvasをtextureとしてTHREE.Textureオブジェクトを生成
        var texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        var material = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          transparent: true,
          map: texture
        });

        // 初期位置はランダムで配置
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * 4000 - 2000;
        mesh.position.y = Math.random() * 4000 - 2000;
        mesh.position.z = Math.random() * 4000 - 2000;

        // オブジェクト破棄
        var DOMURL = self.URL || self.webkitURL || self;
        DOMURL.revokeObjectURL(url);

        resolver(mesh)
      });
      image.addEventListener('error', function() { rejector(this) });
      image.src = url;
    });
  }

  createTableObjects(length) {
    var tables = [];
    var object;
    for (var i = 0; i < length; i++) {
      object = new THREE.Object3D();
      object.position.x = (elements[i].x * 140) - 1330;
      object.position.y = -(elements[i].y * 180) + 990;

      tables.push(object);
    }
    return tables;
  }

  createSphereObjects(length) {
    var spheres = [];
    var phi, theta, object;
    var vector = new THREE.Vector3();
    for (var i = 0; i < length; i++) {
      phi = Math.acos(-1 + (2 * i) / length);
      theta = Math.sqrt(length * Math.PI) * phi;

      object = new THREE.Object3D();
      object.position.x = 800 * Math.cos(theta) * Math.sin(phi);
      object.position.y = 800 * Math.sin(theta) * Math.sin(phi);
      object.position.z = 800 * Math.cos(phi);

      vector.copy(object.position).multiplyScalar(2);

      object.lookAt(vector);

      spheres.push(object);
    }
    return spheres;
  }

  createHelixObjects(length) {
    var helixes = [];
    var phi, object;
    var vector = new THREE.Vector3();
    for (var i = 0; i < length; i++) {
      phi = i * 0.175 + Math.PI;

      object = new THREE.Object3D();
      object.position.x = 900 * Math.sin(phi);
      object.position.y = -(i * 8) + 450;
      object.position.z = 900 * Math.cos(phi);

      vector.x = object.position.x * 2;
      vector.y = object.position.y;
      vector.z = object.position.z * 2;

      object.lookAt(vector);

      helixes.push(object);
    }
    return helixes;
  }

  createGridObjects(length) {
    var grids = [];
    var object;
    for (var i = 0; i < length; i++) {
      object = new THREE.Object3D();
      object.position.x = ((i % 5) * 400) - 800;
      object.position.y = (-(Math.floor(i / 5) % 5) * 400) + 800;
      object.position.z = (Math.floor(i / 25)) * 1000 - 2000;

      grids.push(object);
    }
    return grids;
  }

  transform(positions, duration) {
    TWEEN.removeAll();

    for (var i = 0; i < this.objects.length; i++) {
      var object = this.objects[i];
      var target = positions[i];

      var position = new TWEEN.Tween(object.position);
      position.to({
        x: target.position.x,
        y: target.position.y,
        z: target.position.z
      }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

      var rotation = new TWEEN.Tween(object.rotation);
      rotation.to({
        x: target.rotation.x,
        y: target.rotation.y,
        z: target.rotation.z
      }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
    }

    // lotate form
    var tween = new TWEEN.Tween();
    tween.to({}, duration * 2)
    .onComplete(() => {
      switch (this.formState) {
        case 0:
          this.transform(this.targets.sphere, 5000);
          break;
        case 1:
          this.transform(this.targets.helix, 5000);
          break;
        case 2:
          this.transform(this.targets.grid, 5000);
          break;
        case 3:
          this.transform(this.targets.table, 5000);
          break;
      }

      this.formState = this.formState + 1;
      if (this.formState > 3) {this.formState = 0;}
    })
    .start();
  }
}

export default Main;
