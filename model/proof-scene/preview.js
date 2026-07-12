import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { MTLLoader } from '/node_modules/three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from '/node_modules/three/examples/jsm/loaders/OBJLoader.js';

const host = document.querySelector('#viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121110);
scene.fog = new THREE.Fog(0x121110, 125, 270);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdfe8f2, 0x53483d, 2.15));
const sun = new THREE.DirectionalLight(0xfff2df, 4.2);
sun.position.set(-48, 78, 62);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -95;
sun.shadow.camera.right = 95;
sun.shadow.camera.top = 95;
sun.shadow.camera.bottom = -95;
scene.add(sun);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 4;
controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI * 0.49;

const views = {
  exterior: { position: [73, 35, 88], target: [12, 9, -18], fov: 38, doorOpen: false, roofOpen: false },
  threshold: { position: [9.8, 6.8, 23], target: [12, 8.5, -31], fov: 46, doorOpen: true, roofOpen: false },
  interior: { position: [9.8, 6.2, -5], target: [14, 8.8, -40], fov: 55, doorOpen: true, roofOpen: true },
};

let model;
let moveStart = 0;
let moveDuration = 0;
let fromPosition = new THREE.Vector3();
let toPosition = new THREE.Vector3();
let fromTarget = new THREE.Vector3();
let toTarget = new THREE.Vector3();

function setDoorOpen(open) {
  if (!model) return;
  model.traverse((object) => {
    if (object.name.startsWith('proof_unit_garage_door')) object.visible = !open;
  });
}

function setRoofOpen(open) {
  if (!model) return;
  model.traverse((object) => {
    if (object.name === 'proof_unit_roof') object.visible = !open;
  });
}

function moveTo(name, immediate = false) {
  const view = views[name];
  fromPosition.copy(camera.position);
  fromTarget.copy(controls.target);
  toPosition.set(...view.position);
  toTarget.set(...view.target);
  moveStart = performance.now();
  moveDuration = immediate ? 0 : 850;
  setDoorOpen(view.doorOpen);
  setRoofOpen(view.roofOpen);
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === name);
  });
}

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => moveTo(button.dataset.view));
});

new MTLLoader()
  .setPath('./')
  .load('ldg-deluxe-proof-scene.mtl', (materials) => {
    materials.preload();
    new OBJLoader()
      .setMaterials(materials)
      .setPath('./')
      .load('ldg-deluxe-proof-scene.obj', (object) => {
        model = object;
        model.rotation.x = -Math.PI / 2;
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.side = THREE.DoubleSide;
        });
        scene.add(model);
        moveTo('exterior', true);
        document.body.classList.add('loaded');
      });
  });

function ease(t) {
  return 1 - Math.pow(1 - t, 3);
}

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
