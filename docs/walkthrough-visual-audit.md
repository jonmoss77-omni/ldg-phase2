# LDG Phase 2 Walkthrough Visual Audit

Date: July 10, 2026

## Decision

The walkthrough viewer and hotspot-navigation pattern are reusable. The current panorama set is not a production-accurate visual foundation.

All ten walkthrough panoramas are classified as **Replace before external release**. They can remain temporarily as functional placeholders while the accurate visual set is built.

## Audit basis

The walkthrough was inspected in the hosted buyer experience and compared with:

- `2026.05.04 Site Plan.pdf` and `New_Site_Plan.jpg`
- The current files in `Assets/Phase 2 Renderings/`
- Signature, Deluxe, Premier, and Standard unit renderings and plans
- The Unit 37 reference-image series

Important version check: the detailed site plan is dated May 4, 2026, while several rendering filenames are dated January 8, 2026. The architect should confirm that the rendering package still reflects the May site plan before it becomes the visual authority.

## Scene classifications

| Scene | Status | Material accuracy issues |
|---|---|---|
| Aerial | Replace | The generated campus has additional parallel building rows, invented internal roads, and massing that does not follow the 75-unit linear plan. The surrounding skyline and water context are not traceable to the supplied site data. |
| Arrival | Replace | The clubhouse facade borrows the current design language, but its footprint, approach road, adjacent buildings, gate positions, and campus scale are generated rather than plan-based. |
| Gate | Replace | The generated vaulted canopy, gate geometry, columns, and interior arrival sequence do not match `LDG_Facilities-1.jpg` and `LDG_Facilities-2.jpg`. |
| Drive South | Replace | Repeated garage-condo modules are not mapped to the actual unit ranges. Door, window, pedestrian-door, and wood-cladding patterns are duplicated inconsistently. The view cannot be tied reliably to the plan. |
| Drive Mid-campus | Replace | The scene invents an open central intersection and branded amenity buildings. The May plan places The Gallery and parking in this portion of the site. |
| Drive North | Replace | The landscaped roundabout and terminal condition are invented and conflict with the north-end geometry shown on the site plan. |
| Signature interior | Replace | The room reads substantially wider than 28 feet and appears to contain mirrored mezzanine and fit-out zones. It does not preserve the single 28 x 60 bay shown in the reference. |
| Deluxe interior | Replace | The room reads substantially wider than 28 feet and duplicates fit-out zones. It does not preserve the single 28 x 50 bay, one mezzanine, and reference vehicle arrangement. |
| Premier interior | Replace | The 20-foot width is not credible in the generated view. The mezzanine, lift arrangement, door position, and back-of-unit layout do not follow the supplied cutaway. |
| Standard interior | Replace | The fitted mezzanine and room depth are not traceable to an approved 28 x 30 baseline. The current view also risks presenting optional improvements as standard. |

## Cross-scene issues

- The exterior route is visually continuous but not spatially continuous with the actual site plan.
- Several interior files are wide single-room compositions rather than true 360-degree environments. Their left and right boundaries do not describe the same physical surface, so the wrap cannot be made geometrically seamless through retouching alone.
- Unit interiors need separate, exact base geometry for each footprint. Styling one generated room into four variants is not sufficient.
- The current images sometimes depict fitted mezzanines, kitchens, lifts, and furnishings without a clear distinction between base delivery and optional owner improvements.
- Four-kilopixel panorama loads are functional, but rapid node selections can be ignored while a previous texture is loading. This should be addressed after the accurate scene set and route are locked.

## What is safe to retain

- Photo Sphere Viewer integration
- Hotspot and directional-marker components
- Panorama swapping and crossfade behavior
- Keyboard, mouse, touch, and node-chip navigation
- The general concept of arrival, gate, drive, and unit-interior nodes

The exact node count, camera positions, links, labels, and panorama files remain provisional.

## Recommended production method

1. Obtain the architect's current 3D site and building model in Revit, SketchUp, Rhino, IFC, FBX, OBJ, or GLB format.
2. Confirm that the model matches the May 4, 2026 site plan and the approved facade package.
3. Place every walkthrough camera on the real plan and assign the visible unit ranges and amenities to each node.
4. Render geometry-accurate, neutral-daylight equirectangular panoramas from that model.
5. Use AI only for controlled material, landscape, vehicle, and editorial-quality enhancement. Do not use it to invent the base architecture or site geometry.
6. Approve each panorama against a checklist covering camera position, building geometry, unit type, door placement, optional improvements, seam continuity, and route links before it enters the app.

If the architect's model is unavailable, the fallback is to rebuild a simplified but dimensionally accurate model from the current CAD plan, elevations, sections, and unit drawings. That is more work than prompt-based regeneration, but it is the minimum reliable route to an investor-facing walkthrough.

## Immediate hold

Do not invest further in walkthrough styling, transition effects, additional nodes, or mobile-specific polish until the geometry source and rendering version are confirmed.
