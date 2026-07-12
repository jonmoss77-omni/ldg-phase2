import * as THREE from '/node_modules/three/build/three.module.js';
import { MTLLoader } from '/node_modules/three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from '/node_modules/three/examples/jsm/loaders/OBJLoader.js';

const params = new URLSearchParams(location.search);
const faceName = params.get('face') || 'nz';
const size = Math.max(512, Math.min(2048, Number(params.get('size')) || 1024));

const faces = {
  px: { direction: [1, 0, 0], up: [0, 1, 0] },
  nx: { direction: [-1, 0, 0], up: [0, 1, 0] },
  py: { direction: [0, 1, 0], up: [0, 0, -1] },
  ny: { direction: [0, -1, 0], up: [0, 0, 1] },
  pz: { direction: [0, 0, 1], up: [0, 1, 0] },
  nz: { direction: [0, 0, -1], up: [0, 1, 0] },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9e1e6);

const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 240);
camera.position.set(14, 5.5, -8);
camera.up.set(...(faces[faceName] || faces.nz).up);
const direction = new THREE.Vector3(...(faces[faceName] || faces.nz).direction);
camera.lookAt(camera.position.clone().add(direction));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(size, size, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.querySelector('#render').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf3f7fa, 0x75685c, 2.8));
scene.add(new THREE.AmbientLight(0xffffff, 1.15));

const frontLight = new THREE.PointLight(0xfff2df, 70, 90, 1.5);
frontLight.position.set(14, 14, -8);
scene.add(frontLight);

const rearLight = new THREE.PointLight(0xe5eff8, 55, 80, 1.5);
rearLight.position.set(14, 16, -42);
scene.add(rearLight);

new MTLLoader()
  .setPath('./')
  .load('ldg-deluxe-proof-scene.mtl', (materials) => {
    materials.preload();
    new OBJLoader()
      .setMaterials(materials)
      .setPath('./')
      .load('ldg-deluxe-proof-scene.obj', (model) => {
        model.rotation.x = -Math.PI / 2;
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.material.side = THREE.DoubleSide;
          child.castShadow = false;
          child.receiveShadow = false;
        });
        scene.add(model);
        renderer.render(scene, camera);
        const exportImage = document.createElement('img');
        exportImage.id = 'render-export';
        exportImage.hidden = true;
        exportImage.src = renderer.domElement.toDataURL('image/png');
        document.body.append(exportImage);
        document.body.classList.add('ready');
        document.body.dataset.face = faceName;
      });
  });
