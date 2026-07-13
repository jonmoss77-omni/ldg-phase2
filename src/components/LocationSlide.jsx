import { useEffect, useRef, useState } from 'react';
import { GMAPS_KEY as KEY } from '../config';
import { visionAsset } from '../data/visionPoses';

// Phase 2 campus center, locked by the approved site-plan alignment rather
// than the postal-address geocode (which lands on the neighboring building).
const SITE = { lat: 27.378, lng: -82.4269 };
const ADDRESS = '7100 Professional Parkway East, Sarasota, FL 34240';
// Keep the parcel as the fixed target when the establishing view is rotated.
// The previous pass changed only the heading, which turned the camera away
// from the site. This pose derives the camera position from the target,
// heading, height and pitch, so future orientation changes cannot lose it.
const HOME = { height: 400, heading: 271, pitch: -38 };
const HOME_STILL = '/assets/aerial-home.jpg';
const MAP_EMBED = `https://maps.google.com/maps?q=${SITE.lat},${SITE.lng}&t=k&z=17&output=embed`;
const STREET_EMBED = 'https://maps.google.com/maps?q=&layer=c&cbll=27.37873902637183,-82.42408625227013&cbp=11,257,0,0,0&output=svembed';

function homeCameraPosition() {
  const heading = (HOME.heading * Math.PI) / 180;
  const pitch = (Math.abs(HOME.pitch) * Math.PI) / 180;
  const range = HOME.height / Math.tan(pitch);
  const backBearing = heading + Math.PI;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((SITE.lat * Math.PI) / 180);
  return {
    lat: SITE.lat + (Math.cos(backBearing) * range) / metersPerDegreeLat,
    lng: SITE.lng + (Math.sin(backBearing) * range) / metersPerDegreeLng,
  };
}

// Cesium is a heavy dependency (multi-MB). Load it only when the Location
// slide is actually opened so it never weighs down the initial deck.
let cesiumPromise = null;
function loadCesium() {
  if (cesiumPromise) return cesiumPromise;
  cesiumPromise = import('cesium');
  return cesiumPromise;
}

export default function LocationSlide({ mounted, near }) {
  const cesiumRef = useRef(null);
  const cesiumViewer = useRef(null);
  const cesiumInit = useRef(false);
  const aliveRef = useRef(true);
  const revealTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);
  const [view, setView] = useState('aerial3d'); // aerial3d | vision | map | street
  // If the live 3D tiles cannot load (offline, quota, billing), retain the
  // captured Google 3D plate behind an explicit service message.
  const [aerialFallback, setAerialFallback] = useState(false);
  // True once the tileset has streamed its first full view; until then the
  // HOME_STILL photo covers the canvas so arrival is instant.
  const [liveReady, setLiveReady] = useState(false);

  // Real Google Photorealistic 3D Tiles aerial — the primary view. Starts
  // warming as soon as the slide is ADJACENT (near), not on first visit, so
  // tiles are typically already streamed when the visitor lands here.
  useEffect(() => {
    if ((!mounted && !near) || cesiumInit.current) return;
    cesiumInit.current = true;
    const params = new URLSearchParams(window.location.search);
    const captureMode = params.has('capture');
    // Quality ladder override for tuning: ?sse=8|4|2. Production default 4.
    const sse = Number(params.get('sse')) || 4;
    loadCesium()
      .then((Cesium) => {
        if (!aliveRef.current || !cesiumRef.current) return;
        Cesium.GoogleMaps.defaultApiKey = KEY;
        // Google serves hundreds of small tile files per view; the default
        // 6-per-host throttle starves refinement.
        Cesium.RequestScheduler.requestsByServer['tile.googleapis.com:443'] = 18;
        const viewer = new Cesium.Viewer(cesiumRef.current, {
          globe: false,
          baseLayer: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity,
          contextOptions: captureMode ? { webgl: { preserveDrawingBuffer: true } } : undefined,
        });
        cesiumViewer.current = viewer;
        window.__ldgAerial = viewer;
        viewer.scene.skyAtmosphere.show = true;
        // Render at native device resolution (Retina). Small phones with 3x
        // screens keep the browser-recommended scale to protect the GPU.
        viewer.useBrowserRecommendedResolution =
          window.innerWidth < 768 && window.devicePixelRatio > 2;

        // Camera envelope: the tiles are aerial photogrammetry and smear at
        // close range. The floor below is set one notch above where that
        // becomes visible, so no reachable pose shows it.
        const ctl = viewer.scene.screenSpaceCameraController;
        ctl.minimumZoomDistance = 150;
        ctl.maximumZoomDistance = 4000;
        // Enforced per-tick: camera.changed does not fire under this
        // globe-less requestRenderMode setup (verified in-browser), so the
        // clock tick is the reliable hook. Cheap check, corrects only on
        // violation.
        const MIN_HEIGHT = 130; // meters, ellipsoidal; parcel is ~sea level
        const MAX_PITCH = Cesium.Math.toRadians(-12);
        viewer.clock.onTick.addEventListener(() => {
          if (captureMode) return;
          const cam = viewer.camera;
          const carto = cam.positionCartographic;
          const badH = carto.height < MIN_HEIGHT - 0.5;
          const badP = cam.pitch > MAX_PITCH + 0.002;
          if (!badH && !badP) return;
          cam.setView({
            destination: Cesium.Cartesian3.fromRadians(
              carto.longitude,
              carto.latitude,
              Math.max(carto.height, MIN_HEIGHT),
            ),
            orientation: {
              heading: cam.heading,
              pitch: Math.min(cam.pitch, MAX_PITCH),
              roll: 0,
            },
          });
          viewer.scene.requestRender();
        });

        const home = homeCameraPosition();
        viewer.scene.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(home.lng, home.lat, HOME.height),
          orientation: {
            heading: Cesium.Math.toRadians(HOME.heading),
            pitch: Cesium.Math.toRadians(HOME.pitch),
            roll: 0,
          },
        });
        Cesium.createGooglePhotorealistic3DTileset(
          { onlyUsingWithGoogleGeocoder: true },
          {
            maximumScreenSpaceError: sse,
            dynamicScreenSpaceError: false,
            foveatedScreenSpaceError: false,
            cullRequestsWhileMoving: false,
            preloadWhenHidden: true,
            cacheBytes: 1_073_741_824,
            maximumCacheOverflowBytes: 536_870_912,
          },
        )
          .then((tileset) => {
            if (!aliveRef.current) {
              tileset.destroy?.();
              return;
            }

            // Register readiness listeners before adding the primitive. The
            // previous order could miss initialTilesLoaded, leaving the static
            // loading plate permanently above a fully interactive Cesium map.
            let revealQueued = false;
            const revealLiveMap = () => {
              if (!aliveRef.current) return;
              setLiveReady(true);
              viewer.scene.requestRender();
            };
            const revealAfterFirstTile = () => {
              if (revealQueued) return;
              revealQueued = true;
              revealTimerRef.current = window.setTimeout(revealLiveMap, 700);
            };
            tileset.initialTilesLoaded.addEventListener(revealLiveMap);
            tileset.tileLoad.addEventListener(revealAfterFirstTile);
            viewer.scene.primitives.add(tileset);
            viewer.scene.requestRender();
            // Defensive release only after Google has accepted the tileset.
            // It prevents a missed Cesium event from ever turning the live map
            // back into what looks like a fixed photograph.
            safetyTimerRef.current = window.setTimeout(revealLiveMap, 4500);
            if (captureMode) {
              // Dev-only capture harness for the Vision before-plates.
              // Drive from the console/preview_eval; posts PNG + camera JSON
              // to the vite dev middleware at /__capture.
              window.__ldgCapture = async (pose, name) => {
                viewer.resolutionScale = 2;
                viewer.camera.setView({
                  destination: Cesium.Cartesian3.fromDegrees(pose.lng, pose.lat, pose.height),
                  orientation: {
                    heading: Cesium.Math.toRadians(pose.headingDeg),
                    pitch: Cesium.Math.toRadians(pose.pitchDeg),
                    roll: 0,
                  },
                });
                // Drive frames manually: RAF is throttled to zero in hidden
                // tabs, which stalls tile refinement. viewer.render() ticks
                // the whole pipeline deterministically.
                await new Promise((res) => {
                  const tick = () => {
                    viewer.scene.requestRender();
                    viewer.render();
                    if (tileset.tilesLoaded) res();
                    else setTimeout(tick, 250);
                  };
                  setTimeout(tick, 400);
                });
                for (let i = 0; i < 4; i++) {
                  viewer.scene.requestRender();
                  viewer.render();
                  await new Promise((r) => setTimeout(r, 200));
                }
                const cam = viewer.camera;
                const meta = {
                  pose,
                  ecefPosition: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
                  headingRad: cam.heading,
                  pitchRad: cam.pitch,
                  rollRad: cam.roll,
                  fovyRad: cam.frustum.fovy,
                  canvas: { w: viewer.scene.canvas.width, h: viewer.scene.canvas.height },
                  site: SITE,
                };
                const dataUrl = viewer.scene.canvas.toDataURL('image/png');
                await fetch('/__capture', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, dataUrl, meta }),
                });
                return { saved: name, ...meta.canvas };
              };
            }
          })
          .catch(() => {
            if (aliveRef.current) setAerialFallback(true);
          });
      })
      .catch(() => {
        if (aliveRef.current) setAerialFallback(true);
      });
  }, [mounted, near]);

  useEffect(
    () => () => {
      aliveRef.current = false;
      window.clearTimeout(revealTimerRef.current);
      window.clearTimeout(safetyTimerRef.current);
      if (cesiumViewer.current) {
        cesiumViewer.current.destroy();
        cesiumViewer.current = null;
      }
    },
    [],
  );

  const hint =
    view === 'aerial3d'
      ? 'Drag to explore · scroll to zoom · real Google photorealistic 3D imagery of the parcel today'
      : view === 'vision'
        ? 'The completed campus · artist impression rendered onto the real aerial photograph from the same viewpoint'
        : view === 'map'
          ? 'Drag to pan · scroll to zoom · real satellite imagery of the parcel today'
          : 'Drag to look around · imagery from the nearest public road';

  return (
    <div className="slide-location" style={{ position: 'absolute', inset: 0 }}>
      <div className="loc-stage">
        <div
          ref={cesiumRef}
          className="loc-canvas loc-cesium"
          style={{
            display: aerialFallback ? 'none' : 'block',
            visibility: view === 'aerial3d' && !aerialFallback ? 'visible' : 'hidden',
          }}
        />
        {view === 'aerial3d' && (
          <div
            className="loc-canvas loc-still"
            style={{ opacity: aerialFallback || !liveReady ? 1 : 0 }}
          >
            <img
              className="loc-vision-img"
              src={HOME_STILL}
              alt="Aerial photograph of the Phase 2 parcel today"
              draggable="false"
            />
          </div>
        )}
        {view === 'vision' && (
          <div className="loc-canvas">
            <img
              className="loc-vision-img"
              src={visionAsset('pose3', 'after')}
              alt="The completed Phase 2 campus, an artist impression rendered onto the real aerial photograph"
              draggable="false"
            />
          </div>
        )}
        {view === 'map' && (
          <iframe
            className="loc-canvas loc-google-frame"
            src={MAP_EMBED}
            title="Interactive Google satellite map of the Phase 2 parcel"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}
        {view === 'street' && (
          <iframe
            className="loc-canvas loc-google-frame"
            src={STREET_EMBED}
            title="Google Street View from Professional Parkway"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}
        {view === 'aerial3d' && aerialFallback && (
          <div className="loc-service-fallback">
            <strong>Live Google 3D is unavailable on this preview</strong>
            <span>The Google key must authorize this web address before the official tiles can load.</span>
            <a href="https://ldg-phase2.vercel.app/#location" target="_blank" rel="noreferrer">Open the hosted 3D view</a>
          </div>
        )}
        <div className="loc-shade" />
      </div>

      <div className="loc-panel">
        <h2 className="rise">East of Sarasota, right where you&rsquo;d want it.</h2>
        <div className="loc-rule rise d1" />
        <p className="rise d1">
          You are looking at the real Phase 2 parcel in the Waterside corridor,
          rendered in Google&rsquo;s photorealistic 3D. Explore the neighborhood
          as it stands today, then flip to The Vision to see the completed
          campus that will rise on this exact site.
        </p>
        <p className="loc-address rise d2">{ADDRESS}</p>
      </div>

      <div className="loc-controls">
        <div className="pill-group">
          <button className={view === 'aerial3d' ? 'pill active' : 'pill'} onClick={() => setView('aerial3d')}>
            3D Aerial
          </button>
          <button className={view === 'vision' ? 'pill active' : 'pill'} onClick={() => setView('vision')}>
            The Vision
          </button>
          <button className={view === 'map' ? 'pill active' : 'pill'} onClick={() => setView('map')}>
            Map
          </button>
          <button className={view === 'street' ? 'pill active' : 'pill'} onClick={() => setView('street')}>
            Street View
          </button>
        </div>
      </div>

      <p className="loc-hint">{hint}</p>
    </div>
  );
}
