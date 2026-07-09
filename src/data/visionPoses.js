// Fixed camera poses for the Vision before/after system (HANDOFF-PLAN.md
// Fix 2). Each pose is captured once as a "before" plate from the tuned
// Cesium aerial (?capture=1 harness) and re-used verbatim when rendering the
// massing model / future architect model, so before and after stay
// pixel-registered.
//
// Campus placement calibration (locked against Jon's Photoshop overlay of the
// site plan, 2026-07-07): sheet anchor 27.378134, -82.425065; sheet-north
// azimuth 257 deg; scale 0.23446 m/px; ground -17.5 m ellipsoidal. Entry and
// Luxe Club front Professional Parkway; rows run back WSW into the parcel.
// Full camera JSON per pose lives in app/captures/pose*-before.json.

export const VISION_POSES = {
  pose2: {
    key: 'pose2',
    label: 'The Setting',
    // Jon's vantage: south of the site looking NNE across the whole parcel.
    lat: 27.372924,
    lng: -82.427807,
    height: 400,
    headingDeg: 25,
    pitchDeg: -32,
  },
  pose3: {
    key: 'pose3',
    label: 'The Arrival',
    // Over Professional Parkway looking WSW down the campus axis; entry and
    // Luxe Club front-center, rows receding.
    lat: 27.378844,
    lng: -82.421615,
    height: 200,
    headingDeg: 257,
    // -26 is canonical: Jon's authoritative after-image (Edits - Round 3/
    // pose3-after_new.png, adopted 2026-07-08) is built on the -26 plate.
    // Any future reframe means recapturing the before plate AND Jon
    // re-placing the campus, or both frames fall out of registration.
    pitchDeg: -26,
  },
};

export const POSE_ORDER = ['pose2', 'pose3'];

// Assets, produced by the Fix 2 pipeline:
//   public/assets/vision/{key}-before.jpg  (Cesium capture)
//   public/assets/vision/{key}-after.jpg   (massing-locked composite)
export const visionAsset = (key, state) => `/assets/vision/${key}-${state}.jpg`;
