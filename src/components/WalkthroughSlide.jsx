import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { NODES, NODE_ORDER, NODE_CHIP } from '../data/walkthrough';

function markerHtml(link) {
  if (link.kind === 'move') {
    return `<div class="wt-marker-move"><span class="wt-marker-chev">${
      Math.abs(link.yaw) > 2 ? '↓' : '↑'
    }</span><span class="wt-marker-label">${link.label}</span></div>`;
  }
  return `<div class="wt-marker"><span class="wt-marker-dot"></span><span class="wt-marker-label">${link.label}</span></div>`;
}

export default function WalkthroughSlide({ mounted }) {
  const mountRef = useRef(null);
  const viewerRef = useRef(null);
  const markersRef = useRef(null);
  const [node, setNode] = useState('arrival');
  const nodeRef = useRef('arrival');
  const faceYawRef = useRef(NODES.arrival.initialYaw ?? 0);
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);

  const goTo = (key, faceYaw = 0) => {
    if (key === nodeRef.current) return;
    faceYawRef.current = faceYaw;
    nodeRef.current = key;
    setNode(key);
  };

  // Create the viewer only once the slide has been visited
  useEffect(() => {
    if (!mounted || viewerRef.current) return;
    const viewer = new Viewer({
      container: mountRef.current,
      navbar: ['zoom', 'fullscreen'],
      defaultZoomLvl: 5,
      mousewheel: true,
      touchmoveTwoFingers: false,
      plugins: [[MarkersPlugin, {}]],
    });
    viewerRef.current = viewer;
    window.__psv = viewer;
    const markers = viewer.getPlugin(MarkersPlugin);
    markersRef.current = markers;
    markers.addEventListener('select-marker', ({ marker }) => {
      if (marker.data?.to) goTo(marker.data.to, marker.data.faceYaw ?? 0);
    });
    setReady(true);
    return () => {
      viewer.destroy();
      viewerRef.current = null;
      setReady(false);
    };
  }, [mounted]);

  // Load / swap panoramas
  useEffect(() => {
    const viewer = viewerRef.current;
    const markers = markersRef.current;
    if (!ready || !viewer || !markers) return;
    const def = NODES[node];
    if (def.mode === 'still') {
      markers.clearMarkers();
      setFading(false);
      return;
    }
    let dead = false;
    const first = !viewer.state?.textureData;
    const swap = () =>
      viewer
        .setPanorama(def.pano, {
          transition: false,
          position: { yaw: faceYawRef.current, pitch: def.initialPitch ?? 0 },
        })
        .then(() => {
          if (dead) return;
          markers.clearMarkers();
          def.links.forEach((l, i) => {
            markers.addMarker({
              id: `${node}-${i}`,
              position: { yaw: l.yaw, pitch: l.pitch },
              html: markerHtml(l),
              size: l.kind === 'move' ? { width: 150, height: 84 } : { width: 240, height: 44 },
              anchor: l.kind === 'move' ? 'center center' : 'center left',
              data: { to: l.to, faceYaw: l.faceYaw ?? 0 },
            });
          });
          setFading(false);
        })
        .catch(() => setFading(false));
    if (first) {
      swap();
    } else {
      setFading(true);
      setTimeout(swap, 280);
    }
    return () => { dead = true; };
  }, [node, ready]);

  const def = NODES[node];

  return (
    <div className="slide-walkthrough" style={{ position: 'absolute', inset: 0 }}>
      <div className="wt-stage">
        <div ref={mountRef} className={def.mode === 'still' ? 'wt-mount hidden' : 'wt-mount'} />
        {def.mode === 'still' && (
          <div className="wt-still">
            <img src={def.still} alt="Artist impression of the completed Phase 2 campus from above" />
            <button className="wt-still-link" onClick={() => goTo(def.links[0].to)}>
              <span>↓</span>
              {def.links[0].label}
            </button>
          </div>
        )}
        <div className={fading ? 'wt-fade on' : 'wt-fade'} />
      </div>

      <div className="wt-overlay">
        <div className="wt-title">{def.title}</div>
        <div className="wt-caption">{def.caption}</div>
      </div>

      <div className="wt-nodes">
        {NODE_ORDER.map((k) => (
          <button
            key={k}
            className={k === node ? 'wt-node active' : 'wt-node'}
            onClick={() => goTo(k)}
          >
            {NODE_CHIP[k]}
          </button>
        ))}
      </div>

      <p className="footnote wt-footnote">
        {def.mode === 'still'
          ? 'Locked establishing view · continue below to enter the walkthrough · artist impression of the completed Phase 2'
          : 'Drag to look around · click the arrows to walk the site · all views are artist impressions of the completed Phase 2'}
      </p>
    </div>
  );
}
