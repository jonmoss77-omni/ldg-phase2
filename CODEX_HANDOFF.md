# Luxe Dream Garage Phase 2: Codex Handoff

Last updated: July 13, 2026

## Mission

Continue building the investor and buyer presentation for Luxe Dream Garage Waterside Phase 2 as a production-ready, premium, single-URL experience. The project is a 75-unit luxury deeded garage condo development at 7100 Professional Parkway East, Sarasota, Florida 34240.

This presentation is the remote sales experience. It must explain what the buyer is purchasing, where it sits, what it costs, the investment case, and what ownership will feel like without requiring a phone call or site visit.

## Start here

1. Work from this application folder:

   `/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/app`

2. Read the complete decision log before editing:

   `/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/DECISIONS.md`

3. Open the current production site:

   `https://ldg-phase2.vercel.app`

4. Begin with a hosted visual check of the Location slide. Confirm that:

   - 3D Aerial opens with the actual Phase 2 parcel centered.
   - Professional Parkway has the orientation shown in Jon's annotated screenshots.
   - The live 3D view is draggable and zoomable.
   - Map loads on its first selection.
   - Street View loads on its first selection and faces the vacant frontage.

5. Do not move to another issue until the hosted Location result has been visually confirmed against Jon's screenshots.

## Current Git and deployment state

- Repository: `https://github.com/jonmoss77-omni/ldg-phase2`
- Branch: `main`
- Latest application checkpoint: `72f726d Stabilize Location services and walkthrough visuals`
- `origin/main` and the production bundle both contain application checkpoint `72f726d`.
- This handoff is added in a later documentation-only commit.
- Vercel production currently serves the latest bundle and both new assets:
  - `/assets/pano/signature-v3.jpg`
  - `/assets/walkthrough-aerial-still.jpg`
- Vercel is connected to GitHub. Pushing `main` triggers deployment.

Important recent commits:

- `72f726d` Stabilize Location services and walkthrough visuals
- `0b284a2` Fix Location loading and add Signature interior proof
- `971286d` Restore official Google 3D aerial
- `77933f4` Rebuild aerial experience and preserve local interaction
- `6fc496e` Align Location views and darken financial presentation
- `0b1ba20` Add dimensionally grounded Deluxe interior proof

## Deployment and verification commands

Install and run locally:

```bash
cd "/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/app"
npm install
npm run dev -- --port 4175
```

Quality checks:

```bash
npm run build
npm run lint
git diff --check
```

Deploy through the connected GitHub workflow:

```bash
git push origin main
```

The only current lint warning is the pre-existing Fast Refresh warning in `src/components/VisionCompare.jsx`.

## Non-negotiable content rules

- Never call the units "storage." Always use "garage condo."
- Phase 2 is not built and is not under construction. It is presale-contingent.
- Images must represent what will exist, not imply that it exists today.
- Generated imagery must match the architect references closely.
- Use bright, even, natural daylight and premium editorial realism.
- Avoid theatrical lighting and stylized AI-art treatment.
- The collector is the hero. LDG is the guide.
- Lead with lifestyle and identity, not an HOA-freedom argument or feature list.
- Every price, return, unit count, appreciation assumption, and financial figure must trace to Jon's source documents.
- Do not invent or creatively round figures.
- Use US English.
- Do not use em dashes in on-page copy.

## Required working method

- Work through feedback one item at a time.
- Treat Jon's screenshots as the visual ground truth.
- Check the actual browser render after every meaningful change.
- Do not claim completion because code compiled.
- If a visual or architectural result falls short, say so explicitly.
- Prefer a reliable, screenshot-matched solution over a more elaborate but unstable implementation.
- Keep changes local to the requested issue.
- Do not regenerate or replace a working panorama casually.
- Preserve authoritative geometry before applying any photoreal finishing pass.
- Record material decisions and rejected approaches in `DECISIONS.md`.

## Application architecture

- Vite 8 and React 19 static SPA
- Locked, responsive slide deck with animated horizontal navigation
- Six slides: Welcome, Location, Site Plan, Walk Through, The Numbers, Reserve
- Vercel hosting
- Google Photorealistic 3D Tiles through Cesium for Location 3D Aerial
- Google iframe embeds for Map and Street View
- Photo Sphere Viewer for 360 walkthrough nodes
- SVG native technical site plan with unit interaction
- All investment figures are held in local source data, with no backend

Important source files:

- `src/App.jsx`: slide deck and navigation
- `src/components/LocationSlide.jsx`: Cesium 3D, Google Map, Street View, Vision view
- `src/components/WalkthroughSlide.jsx`: 360 viewer and locked aerial handling
- `src/components/SitePlan.jsx`: native SVG technical plan
- `src/components/NumbersSlide.jsx`: financial presentation and calculator
- `src/data/units.js`: unit types and calibrated unit geometry
- `src/data/walkthrough.js`: walkthrough nodes and asset routing
- `src/data/investment.js`: sourced underwriting data
- `src/index.css`: complete design system
- `src/config.js`: client-side Google key configuration

## Location slide: current implementation

The Location slide now has four modes:

1. `3D Aerial`: live Google Photorealistic 3D Tiles through Cesium
2. `The Vision`: static future-state artist impression
3. `Map`: interactive Google satellite embed
4. `Street View`: interactive Google Street View embed

The Map and Street View controls no longer use the Maps JavaScript API. The JavaScript implementation repeatedly failed or timed out on the deployed site. They now use Google's interactive embed surfaces, which passed first-load browser QA locally.

Validation evidence:

- `docs/model-validation/location-map-embed-local.png`
- `docs/model-validation/location-street-view-embed-local.png`

### 3D camera logic

The parcel target is:

- Latitude: `27.378`
- Longitude: `-82.4269`

The opening camera is defined by:

- Height: `400 m`
- Heading: `91 degrees`
- Pitch: `-38 degrees`

The camera position is calculated backward from the parcel target. It is not an independently guessed coordinate. Current calculated position:

- Latitude: `27.3780803`
- Longitude: `-82.4320785`

Projecting the camera centerline forward resolves to the parcel coordinates with a calculated error of `0.0 m`.

This calculation fixes the prior mistake where the heading was rotated 90 degrees but the camera remained in its old position and therefore turned away from the site.

### Remaining Location requirement

The camera calculation has passed code and geometric verification, but the visual framing must still be confirmed on the hosted Google tiles. The Google tiles key rejects localhost, so this cannot be signed off from local preview alone.

Reference images:

- `/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/Edits - Round 4/Aerial_View-2.png`
- `/Users/jonathanmoss/Desktop/Screenshot 2026-07-13 at 11.48.38 AM.png`
- `/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/assets/LDG-Phase2-Google-3D-Aerial-Calibrated-5K.jpg`

If the hosted view is still visually wrong, preserve the target-centered architecture. Adjust heading, pitch, height, or orbital distance around the fixed target. Do not return to unrelated hand-entered camera latitude and longitude values.

## Walkthrough: current status

The walkthrough route is:

`Aerial -> Arrival -> Gate -> Drive South -> Drive Mid -> Drive North`

Interior nodes branch from the drive:

- Signature from Drive South
- Deluxe from Drive South
- Premier from Drive Mid
- Standard from Drive North

### Walkthrough Aerial

The previously interactive Aerial panorama had weak, jagged foliage and horizon distortion. Jon's marked screenshot showed the Aerial node, although his note called it Arrival.

Current decision:

- Aerial is an intentionally locked 3840 x 2160 perspective view.
- Asset: `public/assets/walkthrough-aerial-still.jpg`
- It retains the campus overview without inviting the user to rotate into poor 360 imagery.
- A `Descend to arrival` control continues into the interactive walkthrough.
- This is an interim presentation solution until credible drone photography or a final architect-quality aerial is available.

Validation:

- `docs/model-validation/walkthrough-aerial-locked.png`

The separate ground-level Arrival panorama remains interactive and was visually audited as stronger than the rejected Aerial panorama.

### Signature interior

The Signature garage condo is the improved second interior proof and the current template direction.

- Asset: `public/assets/pano/signature-v3.jpg`
- Exact panorama size: 4096 x 2048
- Two cars are side by side and centered in the rear third.
- Cars sit partly beneath the mezzanine and away from the camera.
- A pedestrian door is explicit.
- The staircase uses an open-riser cantilever language rather than a solid block.
- A deterministic local sharpening pass improves the nearest staircase and artwork.

A GPT Image 2 sharpening edit was rejected because it changed the room geometry and composition. Do not use that rejected version. `signature-v3.jpg` is the accepted buyer asset.

Validation:

- `docs/model-validation/signature-interior-buyer-context.png`
- `docs/model-validation/signature-interior-sharpened.png`

Honest limit: the accepted 4096 x 2048 panorama was upscaled from a lower-resolution GPT Image 2 source. Local sharpening improves edges but cannot create true native architectural detail. Regenerate from the final architect model at native delivery resolution when available.

### Deluxe interior

The Deluxe shell is dimensionally strong, but cars close to the 360 camera still create visible warping. Jon asked not to edit it further during the Signature proof pass.

- Current asset: `public/assets/pano/deluxe.jpg`
- Keep it available as a demo node.
- Use Signature as the stronger interior template.
- Do not overwrite Deluxe without a new explicit request.

### Other walkthrough visuals

- Drive South, Drive Mid, and Drive North are geometry-led photoreal proofs and are the strongest exterior route nodes.
- Arrival and Gate still rely on generated visual material and need a dedicated architectural pass later.
- Premier and Standard interiors remain less authoritative than Signature and Deluxe.
- Amenity architecture is provisional until approved architect material is supplied.
- Full visual audit: `docs/walkthrough-visual-audit.md`

## Dimensionally grounded model

Model outputs live under `model/`. Repeatable generators live under `tools/`.

Confirmed dimensions:

- All unit shell heights: `22 ft`
- Garage door width: `12 ft`
- Garage door height: `14 ft`
- Mezzanine floor: `12 ft above slab`
- Clear height beneath mezzanine: `10 ft 6 in`
- Mezzanine width: nominally `28 ft`, constrained to the actual shell width for Premier
- Mezzanine depth: `16 ft` or `28 ft`, depending on unit configuration
- Pedestrian door: consistent, exact measured schedule not yet supplied

Unit types and current sourced prices:

- Signature, units 1 to 13: 28 x 60 ft, 1,680 SF, $730,800
- Deluxe, units 14 to 25 and 44 to 58: 28 x 50 ft, 1,400 SF, $598,500
- Premier, units 26 to 43: 20 x 45 ft, 900 SF, $391,500
- Standard, units 59 to 75: 28 x 30 ft, 840 SF, $365,400

Do not edit these figures without source documentation.

## Site plan

The visible site plan is a native dark technical SVG, not the original JPEG. It uses the existing near-black, copper, warm-white, and type-color design tokens.

- All 75 unit hotspots remain interactive.
- Unit geometry comes from the calibrated rectangles in `src/data/units.js`.
- The original plan remains available only as the downloadable reference.
- Do not replace the native SVG with the JPEG in the visible experience.

Authoritative site plan:

`/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/assets/Phase 2 Site Plans/2026.05.04 Site Plan.pdf`

## Numbers slide

- Complete dark-mode presentation is implemented.
- Scenario controls, cash-flow view, underwriting assumptions, downloads, and appreciation calculator work.
- Financial figures trace to the Investment Docs supplied by Jon.
- Do not alter calculations or assumptions without checking source documents.

Source folder:

`/Users/jonathanmoss/Desktop/Luxe Dream Garage/Documents/Investment Docs`

## Authoritative asset locations

Assets root:

`/Users/jonathanmoss/Desktop/Luxe Dream Garage/Interactive Presentation/assets`

Key folders and files:

- Phase 2 renderings: `assets/Phase 2 Renderings/`
- Current preferred facade direction: EMPAD conceptual package
- Site plans: `assets/Phase 2 Site Plans/`
- Unit plans: `assets/Phase 2 Unit Floor Plans/`
- Unit images and references: `assets/Unit Images & Renderings/`
- Official logo: `assets/Luxe Dream Garage Logo_Web.png`
- Google aerial captures: `assets/LDG-Phase2-Aerial-Home-5K.jpg` and `assets/LDG-Phase2-Google-3D-Aerial-Calibrated-5K.jpg`
- Investment documents: `/Users/jonathanmoss/Desktop/Luxe Dream Garage/Documents/Investment Docs`
- Listing video source: `LDG_2_Listing.mp4`
- Hosted YouTube video: `https://youtu.be/GO1zqS1fyas`

Treat AI-generated imagery as provisional unless the decision log explicitly records it as an accepted proof.

## Google services

- The Google API key is already configured in `src/config.js` for client-side use.
- Cesium uses it for Google Photorealistic 3D Tiles.
- The Vercel domain is authorized.
- Localhost is not authorized for live Google 3D tiles.
- Map and Street View now use public Google embeds and do work locally.
- Do not move Map and Street View back to Maps JavaScript API unless there is a verified reason.

## Immediate next sequence

1. Inspect the live Location slide at `https://ldg-phase2.vercel.app/#location`.
2. Capture the opening 3D Aerial before dragging it.
3. Compare it directly with Jon's annotated reference.
4. Confirm the parcel is centered and the road orientation is correct.
5. Test drag and zoom.
6. Select Map from a fresh page load and confirm it appears immediately.
7. Select Street View from a fresh page load and confirm it appears immediately.
8. If the 3D pose is wrong, adjust the orbit around `SITE`. Keep `SITE` fixed.
9. Run build and lint.
10. Update `DECISIONS.md`, commit, push, and recheck production.

After Location is signed off, the next highest-value visual work is a dedicated Arrival and Gate pass using approved facility architecture. Do not spend time polishing Premier or Standard interiors before the exterior entry sequence and facility references are locked.

## Definition of done for each revision

A revision is complete only when:

- The requested behavior is visible in the browser.
- Desktop and phone layouts remain usable when the change affects responsive UI.
- Navigation still works.
- Relevant imagery has been inspected at the actual buyer-view scale.
- `npm run build` passes.
- `npm run lint` has no new errors.
- `git diff --check` passes.
- The result is recorded in `DECISIONS.md`.
- Production-only behavior has been checked on the production URL after deployment.
