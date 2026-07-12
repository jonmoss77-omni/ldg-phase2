import { Viewer } from '/node_modules/@photo-sphere-viewer/core/index.module.js';

const sources = {
  mid: './panos/mid-campus-geometry.jpg',
  north: './panos/north-turnaround-geometry.jpg',
};

const viewer = new Viewer({
  container: document.querySelector('#pano'),
  panorama: sources.mid,
  defaultYaw: 0,
  defaultPitch: -0.02,
  defaultZoomLvl: 36,
  navbar: false,
  mousewheelCtrlKey: false,
  touchmoveTwoFingers: false,
});

document.querySelectorAll('[data-pano]').forEach((button) => {
  button.addEventListener('click', async () => {
    const key = button.dataset.pano;
    await viewer.setPanorama(sources[key], { transition: false, position: { yaw: 0, pitch: -0.02 } });
    document.querySelectorAll('[data-pano]').forEach((item) => item.classList.toggle('active', item === button));
  });
});

window.__geometryPanoViewer = viewer;
