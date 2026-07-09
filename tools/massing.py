#!/usr/bin/env python3
"""Massing renderer for the Vision before/after pipeline (HANDOFF-PLAN.md Fix 2).

Projects the Phase 2 building slabs (traced from the architect site plan,
sheet space 1000x1600) onto the captured Cesium before-plates using the
exported camera JSON. Geometry truth comes from this projection; the AI pass
only textures it.

Outputs per pose (into captures/):
  poseN-wire.jpg    wireframe over the plate  -> alignment gate
  poseN-massing.jpg solid massing over the plate -> gpt_image_2 seed
  poseN-mask.png    white = parcel/massing region -> composite mask

Run: python3 tools/massing.py [--anchor-lat X --anchor-lng Y --rot D --scale S]
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CAP = ROOT / "captures"

# ---------------- geometry (sheet space, viewBox 1000x1600) ----------------
# Building slabs from src/data/units.js COLUMNS envelopes + SitePlan.jsx.
# (x0, y0, x1, y1, height_m, label)
BUILDINGS = [
    (314, 184, 380, 1191, 8.0, "west"),      # Deluxe + Premier row
    (458, 284, 610, 756, 8.0, "center"),      # Signature + Deluxe back-to-back
    (686, 326, 728, 940, 8.0, "east"),        # Standard row
    (452, 1102, 620, 1232, 11.0, "club"),     # Luxe Club / showroom / valet
]
# Pavement pad polygon (SitePlan.jsx PAVEMENT), ground level.
PAD = [
    (302, 196), (388, 166), (520, 236), (660, 268), (736, 318), (736, 978),
    (692, 1004), (692, 1240), (722, 1318), (642, 1420), (420, 1434),
    (298, 1408), (260, 1322), (302, 1240),
]

# ---------------- sheet -> geo calibration (tunable) ----------------
# Round-1 overlay calibration: center (27.378, -82.4269), rot -12 deg.
# Scale from known 28 ft unit pitch: 8.5344 m / 36.4 px.
DEFAULTS = {
    "anchor_lat": 27.378,
    "anchor_lng": -82.4269,
    "rot_deg": -12.0,
    "scale": 8.5344 / 36.4,   # m per sheet px
    "ground": -17.5,           # ellipsoidal height of the pad (sampled in-scene)
}
SHEET_CX, SHEET_CY = 500.0, 800.0

A = 6378137.0
F = 1 / 298.257223563
E2 = F * (2 - F)


def geodetic_to_ecef(lat, lng, h):
    la, lo = math.radians(lat), math.radians(lng)
    n = A / math.sqrt(1 - E2 * math.sin(la) ** 2)
    return (
        (n + h) * math.cos(la) * math.cos(lo),
        (n + h) * math.cos(la) * math.sin(lo),
        (n * (1 - E2) + h) * math.sin(la),
    )


def enu_basis(lat, lng):
    la, lo = math.radians(lat), math.radians(lng)
    east = (-math.sin(lo), math.cos(lo), 0.0)
    north = (-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la))
    up = (math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))
    return east, north, up


def v_dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def v_sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def v_cross(a, b):
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def v_norm(a):
    m = math.sqrt(v_dot(a, a))
    return (a[0] / m, a[1] / m, a[2] / m)


class Camera:
    def __init__(self, meta, out_w):
        pose = meta["pose"]
        self.pos = (
            meta["ecefPosition"]["x"],
            meta["ecefPosition"]["y"],
            meta["ecefPosition"]["z"],
        )
        e, n, u = enu_basis(pose["lat"], pose["lng"])
        h = meta["headingRad"] % (2 * math.pi)
        p = meta["pitchRad"]
        # direction in ENU, then to ECEF
        d_enu = (math.sin(h) * math.cos(p), math.cos(h) * math.cos(p), math.sin(p))
        self.dir = v_norm(tuple(
            d_enu[0] * e[i] + d_enu[1] * n[i] + d_enu[2] * u[i] for i in range(3)
        ))
        self.right = v_norm(v_cross(self.dir, u))
        self.up = v_cross(self.right, self.dir)
        cw, ch = meta["canvas"]["w"], meta["canvas"]["h"]
        self.w = out_w
        self.h = round(out_w * ch / cw)
        self.f = (self.h / 2) / math.tan(meta["fovyRad"] / 2)
        self.cx, self.cy = self.w / 2, self.h / 2

    def project(self, p_ecef):
        v = v_sub(p_ecef, self.pos)
        z = v_dot(v, self.dir)
        if z < 1.0:
            return None
        x = v_dot(v, self.right)
        y = v_dot(v, self.up)
        return (self.cx + self.f * x / z, self.cy - self.f * y / z, z)


def sheet_to_ecef(px, py, h_above, cal):
    """Sheet px -> ECEF. Sheet +x = 'sheet east', -y = 'sheet north'."""
    sx = (px - SHEET_CX) * cal["scale"]
    sy = (SHEET_CY - py) * cal["scale"]  # sheet north, meters
    th = math.radians(cal["rot_deg"])
    east = sx * math.cos(th) + sy * math.sin(th)
    north = -sx * math.sin(th) + sy * math.cos(th)
    lat = cal["anchor_lat"] + north / 111320.0
    lng = cal["anchor_lng"] + east / (111320.0 * math.cos(math.radians(cal["anchor_lat"])))
    return geodetic_to_ecef(lat, lng, cal["ground"] + h_above)


def box_faces(x0, y0, x1, y1, hm, cal):
    """Faces of an extruded sheet-space rect, as lists of ECEF corners."""
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    lo = [sheet_to_ecef(px, py, 0, cal) for px, py in corners]
    hi = [sheet_to_ecef(px, py, hm, cal) for px, py in corners]
    faces = [hi]  # roof
    for i in range(4):
        j = (i + 1) % 4
        faces.append([lo[i], lo[j], hi[j], hi[i]])
    return faces


def draw_scene(plate, cam, cal, mode):
    img = plate.copy()
    drw = ImageDraw.Draw(img, "RGBA")

    def poly2d(ecef_pts):
        pts = [cam.project(p) for p in ecef_pts]
        if any(p is None for p in pts):
            return None, 0
        depth = sum(p[2] for p in pts) / len(pts)
        return [(p[0], p[1]) for p in pts], depth

    # pad first (ground)
    pad_pts, _ = poly2d([sheet_to_ecef(px, py, 0.15, cal) for px, py in PAD])
    if pad_pts:
        if mode == "wire":
            drw.polygon(pad_pts, outline=(255, 60, 60, 255))
        else:
            drw.polygon(pad_pts, fill=(178, 172, 162, 235), outline=(150, 144, 136, 255))

    faces = []
    for x0, y0, x1, y1, hm, _label in BUILDINGS:
        for k, f in enumerate(box_faces(x0, y0, x1, y1, hm, cal)):
            pts, depth = poly2d(f)
            if pts:
                faces.append((depth, k == 0, pts))
    faces.sort(key=lambda t: -t[0])  # far to near
    for _depth, is_roof, pts in faces:
        if mode == "wire":
            drw.polygon(pts, outline=(255, 60, 60, 255))
        else:
            col = (238, 236, 230, 255) if is_roof else (196, 190, 180, 255)
            drw.polygon(pts, fill=col, outline=(120, 116, 110, 255))
    return img


def draw_mask(plate_size, cam, cal, pad_px=30):
    mask = Image.new("L", plate_size, 0)
    drw = ImageDraw.Draw(mask)
    pts = [cam.project(sheet_to_ecef(px, py, 0, cal)) for px, py in PAD]
    if any(p is None for p in pts):
        return mask
    drw.polygon([(p[0], p[1]) for p in pts], fill=255)
    for x0, y0, x1, y1, hm, _l in BUILDINGS:
        for f in box_faces(x0, y0, x1, y1, hm, cal):
            fp = [cam.project(p) for p in f]
            if all(p is not None for p in fp):
                drw.polygon([(p[0], p[1]) for p in fp], fill=255)
    return mask.filter(ImageFilter.MaxFilter(2 * (pad_px // 2) + 1))


def main():
    cal = dict(DEFAULTS)
    args = sys.argv[1:]
    for i in range(0, len(args) - 1, 2):
        key = args[i].lstrip("-").replace("-", "_")
        mapping = {"anchor_lat": "anchor_lat", "anchor_lng": "anchor_lng",
                   "rot": "rot_deg", "rot_deg": "rot_deg", "scale": "scale",
                   "ground": "ground"}
        if key in mapping:
            cal[mapping[key]] = float(args[i + 1])
    poses = sorted(CAP.glob("pose*-before.json"))
    if not poses:
        sys.exit("no captures found")
    print("calibration:", cal)
    for meta_path in poses:
        name = meta_path.stem.replace("-before", "")
        meta = json.loads(meta_path.read_text())
        plate = Image.open(meta_path.with_suffix(".png")).convert("RGB")
        plate = plate.resize((2560, round(2560 * plate.height / plate.width)), Image.LANCZOS)
        cam = Camera(meta, plate.width)
        wire = draw_scene(plate, cam, cal, "wire")
        wire.save(CAP / f"{name}-wire.jpg", quality=88)
        solid = draw_scene(plate, cam, cal, "solid")
        solid.save(CAP / f"{name}-massing.jpg", quality=92)
        mask = draw_mask(plate.size, cam, cal)
        mask.save(CAP / f"{name}-mask.png")
        print(f"{name}: wrote wire/massing/mask at {plate.size}")


if __name__ == "__main__":
    main()
