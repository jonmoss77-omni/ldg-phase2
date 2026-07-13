import * as THREE from '/node_modules/three/build/three.module.js';
import { MTLLoader } from '/node_modules/three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from '/node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { mergeGeometries } from '/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

const params = new URLSearchParams(location.search);
const nodeName = params.get('node') || 'mid';
const faceName = params.get('face') || 'nz';
const size = Math.max(512, Math.min(2048, Number(params.get('size')) || 1024));

const nodes = {
  aerial: new THREE.Vector3(0, 130, 600),
  south: new THREE.Vector3(-95, 7.2, -40),
  mid: new THREE.Vector3(-95, 7.2, -80),
  north: new THREE.Vector3(-95, 7.2, -330),
};

const faces = {
  px: { direction: [1, 0, 0], up: [0, 1, 0] },
  nx: { direction: [-1, 0, 0], up: [0, 1, 0] },
  py: { direction: [0, 1, 0], up: [0, 0, -1] },
  ny: { direction: [0, -1, 0], up: [0, 0, 1] },
  pz: { direction: [0, 0, 1], up: [0, 1, 0] },
  nz: { direction: [0, 0, -1], up: [0, 1, 0] },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9d4e5);

const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 2200);
camera.position.copy(nodes[nodeName] || nodes.mid);
camera.up.set(...(faces[faceName] || faces.nz).up);
const direction = new THREE.Vector3(...(faces[faceName] || faces.nz).direction);
camera.lookAt(camera.position.clone().add(direction));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(size, size, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.querySelector('#render').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf4f8fb, 0x777266, 3.0));
const sun = new THREE.DirectionalLight(0xfff1d9, 3.5);
sun.position.set(-420, 650, 520);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2600, 2600),
  new THREE.MeshStandardMaterial({ color: 0x7a8269, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.32;
scene.add(ground);

new MTLLoader().setPath('./').load('ldg-phase2-detailed-rows.mtl', (materials) => {
  materials.preload();
  new OBJLoader().setMaterials(materials).setPath('./').load('ldg-phase2-detailed-rows.obj', (model) => {
    model.updateMatrixWorld(true);
    const byMaterial = new Map();
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.material.side = THREE.DoubleSide;
      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
      const key = child.material.name || child.material.uuid;
      if (!byMaterial.has(key)) byMaterial.set(key, { material: child.material, geometries: [] });
      byMaterial.get(key).geometries.push(geometry);
    });
    const mergedModel = new THREE.Group();
    for (const { material, geometries } of byMaterial.values()) {
      const geometry = mergeGeometries(geometries, false);
      mergedModel.add(new THREE.Mesh(geometry, material));
      geometries.forEach((part) => part.dispose());
    }
    mergedModel.rotation.x = -Math.PI / 2;
    scene.add(mergedModel);
    renderer.render(scene, camera);
    const exportImage = document.createElement('img');
    exportImage.id = 'render-export';
    exportImage.hidden = true;
    exportImage.src = renderer.domElement.toDataURL('image/png');
    document.body.append(exportImage);
    document.body.classList.add('ready');
    document.body.dataset.node = nodeName;
    document.body.dataset.face = faceName;
  });
});
