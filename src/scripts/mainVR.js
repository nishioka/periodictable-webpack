'use strict';

import * as THREE from 'three';
import TWEEN from 'tween.js';

import AbstractVRApplication from 'scripts/views/AbstractVRApplication';

import { elements } from 'data/elements';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

class Main extends AbstractVRApplication {

  constructor() {
    super();

    this.objects = [];

    this.formState = 0;

    // 変形用の配置テーブルを作成する
    this.targets = {};
    this.targets.table = this.createTableObjects(elements.length);
    this.targets.sphere = this.createSphereObjects(elements.length);
    this.targets.helix = this.createHelixObjects(elements.length);
    this.targets.grid = this.createGridObjects(elements.length);

    // 周期表のテクスチャを作成する
    const promises = [];
    for (let i = 0; i < elements.length; i++) {
      elements[i].number = i + 1;
      promises.push(this.createElementMesh(elements[i]));
    }
    Promise.all(promises)
    .then(values => {
      values.forEach(mesh => {
        this._scene.add(mesh);
        this.objects.push(mesh);
      });

      this.transform(this.targets.table, 5000);
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
      element.style.backgroundColor = `rgba(0,127,127,${Math.random() * 0.5 + 0.25})`;
      element.style.width = `${canvas.width}px`;
      element.style.height = `${canvas.height}px`;
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
      const url = `data:image/svg+xml;charset=utf-8,${svg.outerHTML}`;
      const image = new Image();
      image.addEventListener('load', () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // 生成したCanvasをtextureとしてTHREE.Textureオブジェクトを生成
        const texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          transparent: true,
          map: texture
        });

        // 初期位置はランダムで配置
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * 4000 - 2000;
        mesh.position.y = Math.random() * 4000 - 2000;
        mesh.position.z = Math.random() * 4000 - 2000;

        // オブジェクト破棄
        const DOMURL = self.URL || self.webkitURL || self;
        DOMURL.revokeObjectURL(url);

        resolver(mesh);
      });
      image.addEventListener('error', err => {
        rejector(err);
      });
      image.src = url;
    });
  }

  createTableObjects(length) {
    const tables = [];
    for (let i = 0; i < length; i++) {
      const object = new THREE.Object3D();
      object.position.x = elements[i].x * 140 - 1330;
      object.position.y = 990 - elements[i].y * 180;

      tables.push(object);
    }
    return tables;
  }

  createSphereObjects(length) {
    const spheres = [];
    const vector = new THREE.Vector3();
    const spherical = new THREE.Spherical();
    for (let i = 0; i < length; i++) {
      const phi = Math.acos(2 * i / length - 1);
      const theta = Math.sqrt(length * Math.PI) * phi;

      const object = new THREE.Object3D();
      spherical.set(800, phi, theta);
      object.position.setFromSpherical(spherical);
      vector.copy(object.position).multiplyScalar(2);

      object.lookAt(vector);

      spheres.push(object);
    }
    return spheres;
  }

  createHelixObjects(length) {
    const helixes = [];
    const vector = new THREE.Vector3();
    const cylindrical = new THREE.Cylindrical();
    for (let i = 0; i < length; i++) {
      const theta = i * 0.175 + Math.PI;
      const y = 450 - i * 8;

      const object = new THREE.Object3D();
      cylindrical.set(900, theta, y);
      object.position.setFromCylindrical(cylindrical);
      vector.x = object.position.x * 2;
      vector.y = object.position.y;
      vector.z = object.position.z * 2;

      object.lookAt(vector);

      helixes.push(object);
    }
    return helixes;
  }

  createGridObjects(length) {
    const grids = [];
    for (let i = 0; i < length; i++) {
      const object = new THREE.Object3D();
      object.position.x = i % 5 * 400 - 800;
      object.position.y = 800 - Math.floor(i / 5) % 5 * 400;
      object.position.z = Math.floor(i / 25) * 1000 - 2000;

      grids.push(object);
    }
    return grids;
  }

  transform(positions, duration) {
    TWEEN.removeAll();

    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      const target = positions[i];

      if (i === 0) {
        console.log('object.position:', object.position);
        console.log('target.position:', target.position);
      }
      const position = new TWEEN.Tween(object.position);
      position.to({
        x: target.position.x,
        y: target.position.y,
        z: target.position.z
      }, Math.random() * duration + duration)
      .delay(1000)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

      const rotation = new TWEEN.Tween(object.rotation);
      rotation.to({
        x: target.rotation.x,
        y: target.rotation.y,
        z: target.rotation.z
      }, Math.random() * duration + duration)
      .delay(1000)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
    }

    // lotate form
    const tween = new TWEEN.Tween();
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
      if (this.formState > 3) {
        this.formState = 0;
      }
    })
    .start();
  }
}

export default Main;
