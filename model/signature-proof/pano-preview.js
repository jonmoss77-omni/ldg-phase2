import { Viewer } from '/node_modules/@photo-sphere-viewer/core/index.module.js';

const sources = {
  geometry: './panos/signature-interior-geometry.jpg',
  photoreal: './panos/signature-interior-photoreal-v1-seam8.jpg',
};

const viewer = new Viewer({
  container: document.querySelector('#pano'),
  panorama: sources.geometry,
  defaultYaw: 0,
  defaultPitch: -0.02,
  defaultZoomLvl: 30,
  navbar: false,
  mousewheelCtrlKey: false,
  touchmoveTwoFingers: false,
});

document.querySelectorAll('[data-pano]').forEach((button) => {
  button.addEventListener('click', async () => {
    await viewer.setPanorama(sources[button.dataset.pano], {
      transition: false,
      position: { yaw: 0, pitch: -0.02 },
    });
    document.querySelectorAll('[data-pano]').forEach((item) => {
      item.classList.toggle('active', item === button);
    });
  });
});

window.__signaturePanoViewer = viewer;
