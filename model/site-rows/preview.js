import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { MTLLoader } from '/node_modules/three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from '/node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { mergeGeometries } from '/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

const host = document.querySelector('#viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121110);
scene.fog = new THREE.Fog(0x121110, 700, 1500);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 2600);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = false;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdfe8f2, 0x4a4037, 2.25));
const sun = new THREE.DirectionalLight(0xfff0dc, 4.1);
sun.position.set(-420, 650, 520);
scene.add(sun);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 8;
controls.maxDistance = 1350;
controls.maxPolarAngle = Math.PI * 0.49;

const views = {
  overview: { position: [360, 315, 540], target: [-20, 0, -25], fov: 42 },
  south: { position: [-95, 12, 328], target: [-95, 7.5, 70], fov: 54 },
  mid: { position: [-95, 12, 88], target: [-95, 7.5, -195], fov: 54 },
  north: { position: [-95, 13, -238], target: [-95, 7.5, -430], fov: 54 },
};

let moveStart = 0;
let moveDuration = 0;
const fromPosition = new THREE.Vector3();
const toPosition = new THREE.Vector3();
const fromTarget = new THREE.Vector3();
const toTarget = new THREE.Vector3();

function moveTo(name, immediate = false) {
  const view = views[name];
  fromPosition.copy(camera.position);
  fromTarget.copy(controls.target);
  toPosition.set(...view.position);
  toTarget.set(...view.target);
  moveStart = performance.now();
  moveDuration = immediate ? 0 : 1050;
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === name);
  });
}

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => moveTo(button.dataset.view));
});

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
    moveTo('overview', true);
    document.body.classList.add('loaded');
  });
});

function ease(t) { return 1 - Math.pow(1 - t, 3); }
function animate(now) {
  requestAnimationFrame(animate);
  if (moveStart) {
    const raw = moveDuration === 0 ? 1 : Math.min(1, (now - moveStart) / moveDuration);
    const t = ease(raw);
    camera.position.lerpVectors(fromPosition, toPosition, t);
    controls.target.lerpVectors(fromTarget, toTarget, t);
    if (raw === 1) moveStart = 0;
  }
  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
