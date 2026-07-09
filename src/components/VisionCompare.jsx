import { useEffect, useRef, useState } from 'react';
import { VISION_POSES, visionAsset } from '../data/visionPoses';

// Fixed-viewpoint before/after comparison for the Vision view (replaces the
// free-look 360). Drag the divider to sweep between the parcel today and the
// completed campus; both frames are pixel-registered captures of the same
// camera pose. Poses with baked assets only.
export const LIVE_POSES = ['pose2', 'pose3'];

export default function VisionCompare({ pose }) {
  const wrapRef = useRef(null);
  const [split, setSplit] = useState(0.5);
  const dragging = useRef(false);

  // Preload both frames of every live pose once
  useEffect(() => {
    LIVE_POSES.forEach((k) => {
      ['before', 'after'].forEach((s) => {
        const img = new Image();
        img.src = visionAsset(k, s);
      });
    });
  }, []);

  useEffect(() => setSplit(0.5), [pose]);

  const setFromEvent = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    setSplit(Math.min(0.98, Math.max(0.02, x / rect.width)));
  };
  const onDown = (e) => {
    dragging.current = true;
    setFromEvent(e);
  };
  const onMove = (e) => {
    if (dragging.current) setFromEvent(e);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const def = VISION_POSES[pose];
  const pct = split * 100;

  return (
    <div
      ref={wrapRef}
      className="vc-wrap"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={onUp}
    >
      <img className="vc-img" src={visionAsset(pose, 'after')} alt={`${def.label} - the completed campus`} draggable="false" />
      <img
        className="vc-img vc-before"
        src={visionAsset(pose, 'before')}
        alt={`${def.label} - the parcel today`}
        draggable="false"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      />
      <div className="vc-divider" style={{ left: `${pct}%` }}>
        <div className="vc-handle">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6l-5 6 5 6M16 6l5 6-5 6" />
          </svg>
        </div>
      </div>
      <span className="vc-tag vc-tag-left" style={{ opacity: pct > 14 ? 1 : 0 }}>Today</span>
      <span className="vc-tag vc-tag-right" style={{ opacity: pct < 86 ? 1 : 0 }}>The Vision</span>
    </div>
  );
}
