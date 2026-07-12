#!/usr/bin/env python3
"""Build the geometry-first LDG Phase 2 validation model.

This script does not generate sales imagery. It creates a dimensionally
traceable site blockout, four garage-condo shells, and validation drawings.
Unknown architectural values stay parameterized and are listed in the output
manifest instead of being silently invented.

Run from the app root:
    python3 tools/build_blockout.py
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "model"
VALIDATION_DIR = ROOT / "docs" / "model-validation"

# The marketing plan was previously calibrated from known 28 ft unit pitches.
# These values are shared with src/data/units.js and SitePlan.jsx.
PX_PER_FT = 1.30
ORIGIN_X_PX = 544.0  # shared wall between the center Signature and Deluxe rows
ORIGIN_Y_PX = 757.0  # south face of the center unit rows

SITE_HEIGHT_FT = 22.0
GARAGE_DOOR_HEIGHT_FT = 14.0
MEZZANINE_FLOOR_FT = 12.0
WALL_THICKNESS_FT = 0.5
FLOOR_THICKNESS_FT = 0.25
MEZZANINE_THICKNESS_FT = 0.5

COLORS = {
    "signature": (208, 150, 89),
    "deluxe": (156, 195, 217),
    "premier": (169, 210, 166),
    "standard": (216, 208, 193),
    "club": (197, 139, 78),
    "gallery": (112, 100, 88),
    "amenity": (137, 121, 105),
    "ground": (42, 39, 36),
}


@dataclass(frozen=True)
class UnitType:
    key: str
    width: float
    depth: float


UNIT_TYPES = {
    "signature": UnitType("signature", 28.0, 60.0),
    "deluxe": UnitType("deluxe", 28.0, 50.0),
    "premier": UnitType("premier", 20.0, 45.0),
    "standard": UnitType("standard", 28.0, 30.0),
}


def type_for_unit(number: int) -> str:
    if 1 <= number <= 13:
        return "signature"
    if 14 <= number <= 25 or 44 <= number <= 58:
        return "deluxe"
    if 26 <= number <= 43:
        return "premier"
    return "standard"


# Calibrated row centers from src/data/units.js. Rectangle sizes are replaced
# by exact feet from UNIT_TYPES; only the centerline and ordering are reused.
COLUMNS = [
    {"from": 58, "to": 44, "x": 314, "w": 66, "y0": 200, "dy": 36.4, "face": "east"},
    {"from": 43, "to": 26, "x": 316, "w": 58, "y0": 750, "dy": 25.3, "face": "east"},
    {"from": 13, "to": 1, "x": 458, "w": 84, "y0": 300, "dy": 36.6, "face": "west", "south_zero": True},
    {"from": 14, "to": 25, "x": 546, "w": 64, "y0": 342, "dy": 36.2, "face": "east", "south_zero": True},
    {"from": 59, "to": 75, "x": 686, "w": 42, "y0": 342, "dy": 36.4, "face": "west"},
]

# Exact row anchors in feet. Center rows share x=0. Drive widths are derived
# from the calibrated plan spacing and remain easy to change in one place.
WEST_ROW_EAST_FACE_FT = (380.0 - ORIGIN_X_PX) / PX_PER_FT
EAST_ROW_WEST_FACE_FT = (686.0 - ORIGIN_X_PX) / PX_PER_FT


def sheet_y_to_ft(y_px: float) -> float:
    return (ORIGIN_Y_PX - y_px) / PX_PER_FT


def sheet_rect_to_ft(x: float, y: float, w: float, h: float) -> tuple[float, float, float, float]:
    x0 = (x - ORIGIN_X_PX) / PX_PER_FT
    x1 = (x + w - ORIGIN_X_PX) / PX_PER_FT
    y1 = sheet_y_to_ft(y)
    y0 = sheet_y_to_ft(y + h)
    return x0, y0, x1, y1


def build_units() -> list[dict]:
    units: list[dict] = []
    for column in COLUMNS:
        start, end = column["from"], column["to"]
        step = 1 if start < end else -1
        numbers = list(range(start, end + step, step))
        first_spec = UNIT_TYPES[type_for_unit(numbers[0])]
        first_center_y = sheet_y_to_ft(column["y0"])
        if column.get("south_zero"):
            first_center_y = (len(numbers) - 0.5) * first_spec.width
        for index, number in enumerate(numbers):
            key = type_for_unit(number)
            spec = UNIT_TYPES[key]
            # Exact unit frontage controls the pitch. The calibrated image
            # center sets the row anchor, but cannot compress a nominal unit.
            center_y = first_center_y - index * spec.width
            y0 = center_y - spec.width / 2
            y1 = center_y + spec.width / 2

            if 26 <= number <= 58:
                x1 = WEST_ROW_EAST_FACE_FT
                x0 = x1 - spec.depth
            elif 1 <= number <= 13:
                x1 = 0.0
                x0 = -spec.depth
            elif 14 <= number <= 25:
                x0 = 0.0
                x1 = spec.depth
            else:
                x0 = EAST_ROW_WEST_FACE_FT
                x1 = x0 + spec.depth

            units.append(
                {
                    "number": number,
                    "type": key,
                    "face": column["face"],
                    "x0": x0,
                    "y0": y0,
                    "x1": x1,
                    "y1": y1,
                    "height": SITE_HEIGHT_FT,
                }
            )
    return sorted(units, key=lambda unit: unit["number"])


def validate_units(units: list[dict]):
    if len(units) != 75 or len({unit["number"] for unit in units}) != 75:
        raise RuntimeError("unit generation did not produce 75 unique garage condos")

    expected_counts = {"signature": 13, "deluxe": 27, "premier": 18, "standard": 17}
    actual_counts = {key: sum(unit["type"] == key for unit in units) for key in UNIT_TYPES}
    if actual_counts != expected_counts:
        raise RuntimeError(f"unit type count mismatch: {actual_counts}")

    for unit in units:
        spec = UNIT_TYPES[unit["type"]]
        depth = unit["x1"] - unit["x0"]
        frontage = unit["y1"] - unit["y0"]
        if not math.isclose(depth, spec.depth, abs_tol=0.001):
            raise RuntimeError(f"unit {unit['number']} depth mismatch")
        if not math.isclose(frontage, spec.width, abs_tol=0.001):
            raise RuntimeError(f"unit {unit['number']} frontage mismatch")

    # Units in each physical row must meet or have a positive separation.
    rows = [range(44, 59), range(26, 44), range(1, 14), range(14, 26), range(59, 76)]
    by_number = {unit["number"]: unit for unit in units}
    for row in rows:
        ordered = sorted((by_number[number] for number in row), key=lambda unit: unit["y0"])
        for left, right in zip(ordered, ordered[1:]):
            if right["y0"] < left["y1"] - 0.001:
                raise RuntimeError(f"units {left['number']} and {right['number']} overlap")


AMENITIES = [
    {"name": "Detail Bay", "rect": (468, 752, 144, 36), "height": SITE_HEIGHT_FT, "kind": "amenity"},
    {"name": "The Gallery", "rect": (452, 800, 168, 292), "height": SITE_HEIGHT_FT, "kind": "gallery"},
    {"name": "Luxe Club", "rect": (452, 1102, 168, 78), "height": 28.0, "kind": "club"},
    {"name": "Valet", "rect": (430, 1190, 190, 42), "height": 14.0, "kind": "amenity"},
    {"name": "Detail", "rect": (306, 1194, 62, 30), "height": SITE_HEIGHT_FT, "kind": "amenity"},
    {"name": "Lounge", "rect": (306, 1232, 50, 58), "height": SITE_HEIGHT_FT, "kind": "amenity"},
]

PAVEMENT_PX = [
    (302, 196), (388, 166), (520, 236), (660, 268), (736, 318), (736, 978),
    (692, 1004), (692, 1240), (722, 1318), (642, 1420), (420, 1434),
    (298, 1408), (260, 1322), (302, 1240),
]


def pavement_ft() -> list[tuple[float, float]]:
    return [((x - ORIGIN_X_PX) / PX_PER_FT, sheet_y_to_ft(y)) for x, y in PAVEMENT_PX]


class ObjWriter:
    def __init__(self, path: Path, mtl_name: str):
        self.path = path
        self.lines = [f"mtllib {mtl_name}"]
        self.vertex_count = 0

    def add_box(self, name: str, bounds: tuple[float, float, float, float, float, float], material: str):
        x0, y0, z0, x1, y1, z1 = bounds
        vertices = [
            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
        ]
        self.lines.extend([f"o {name}", f"usemtl {material}"])
        for x, y, z in vertices:
            self.lines.append(f"v {x:.4f} {y:.4f} {z:.4f}")
        v = self.vertex_count + 1
        faces = [
            (0, 3, 2, 1), (4, 5, 6, 7),
            (0, 1, 5, 4), (1, 2, 6, 5),
            (2, 3, 7, 6), (3, 0, 4, 7),
        ]
        for face in faces:
            self.lines.append("f " + " ".join(str(v + i) for i in face))
        self.vertex_count += len(vertices)

    def add_plane(self, name: str, points: list[tuple[float, float]], z: float, material: str):
        self.lines.extend([f"o {name}", f"usemtl {material}"])
        first = self.vertex_count + 1
        for x, y in points:
            self.lines.append(f"v {x:.4f} {y:.4f} {z:.4f}")
        self.lines.append("f " + " ".join(str(first + i) for i in range(len(points))))
        self.vertex_count += len(points)

    def save(self):
        self.path.write_text("\n".join(self.lines) + "\n")


def write_materials():
    lines = []
    for name, rgb in COLORS.items():
        r, g, b = [value / 255 for value in rgb]
        lines.extend([f"newmtl {name}", f"Kd {r:.4f} {g:.4f} {b:.4f}", "Ka 0.05 0.05 0.05", ""])
    lines.extend([
        "newmtl shell", "Kd 0.86 0.84 0.79", "Ka 0.05 0.05 0.05", "",
        "newmtl optional_mezzanine", "Kd 0.77 0.55 0.31", "d 0.65", "",
        "newmtl optional_extension", "Kd 0.55 0.40 0.28", "d 0.45", "",
    ])
    (MODEL_DIR / "ldg-blockout.mtl").write_text("\n".join(lines))


def write_site_obj(units: list[dict], amenities: list[dict]):
    writer = ObjWriter(MODEL_DIR / "ldg-phase2-site-blockout.obj", "ldg-blockout.mtl")
    writer.add_plane("site_pad", pavement_ft(), 0.0, "ground")
    for unit in units:
        writer.add_box(
            f"unit_{unit['number']:02d}_{unit['type']}",
            (unit["x0"], unit["y0"], 0, unit["x1"], unit["y1"], unit["height"]),
            unit["type"],
        )
    for amenity in amenities:
        x0, y0, x1, y1 = sheet_rect_to_ft(*amenity["rect"])
        writer.add_box(
            amenity["name"].lower().replace(" ", "_"),
            (x0, y0, 0, x1, y1, amenity["height"]),
            amenity["kind"],
        )
    writer.save()


def add_shell(writer: ObjWriter, key: str, origin_x: float, origin_y: float):
    spec = UNIT_TYPES[key]
    w, d, h, t = spec.width, spec.depth, SITE_HEIGHT_FT, WALL_THICKNESS_FT
    prefix = f"{key}_garage_condo"
    # Floor and three exact shell walls. Front stays open because the garage
    # door width is not confirmed. The upper front wall locks the 14 ft height.
    writer.add_box(f"{prefix}_floor", (origin_x, origin_y, 0, origin_x + w, origin_y + d, FLOOR_THICKNESS_FT), "shell")
    writer.add_box(f"{prefix}_left_wall", (origin_x, origin_y, 0, origin_x + t, origin_y + d, h), "shell")
    writer.add_box(f"{prefix}_right_wall", (origin_x + w - t, origin_y, 0, origin_x + w, origin_y + d, h), "shell")
    writer.add_box(f"{prefix}_back_wall", (origin_x, origin_y + d - t, 0, origin_x + w, origin_y + d, h), "shell")
    writer.add_box(
        f"{prefix}_front_above_14ft",
        (origin_x, origin_y, GARAGE_DOOR_HEIGHT_FT, origin_x + w, origin_y + t, h),
        "shell",
    )

    clear_x0, clear_x1 = origin_x, origin_x + w
    # Base 16 ft option. The additional 12 ft group can be enabled to create
    # the 28 ft option. Premier correctly uses its 20 ft shell width.
    writer.add_box(
        f"{prefix}_OPTION_mezzanine_16ft",
        (clear_x0, origin_y + d - 16, MEZZANINE_FLOOR_FT, clear_x1, origin_y + d - t, MEZZANINE_FLOOR_FT + MEZZANINE_THICKNESS_FT),
        "optional_mezzanine",
    )
    if d >= 28:
        writer.add_box(
            f"{prefix}_OPTION_extension_to_28ft",
            (clear_x0, origin_y + d - 28, MEZZANINE_FLOOR_FT, clear_x1, origin_y + d - 16, MEZZANINE_FLOOR_FT + MEZZANINE_THICKNESS_FT),
            "optional_extension",
        )


def write_shells_obj():
    writer = ObjWriter(MODEL_DIR / "ldg-garage-condo-shells.obj", "ldg-blockout.mtl")
    x = 0.0
    for key in ["standard", "premier", "deluxe", "signature"]:
        add_shell(writer, key, x, 0.0)
        x += UNIT_TYPES[key].width + 18.0
    writer.save()


def svg_escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def write_top_plan_svg(units: list[dict], amenities: list[dict]):
    points = pavement_ft()
    min_x = min(x for x, _ in points) - 20
    max_x = max(x for x, _ in points) + 20
    min_y = min(y for _, y in points) - 20
    max_y = max(y for _, y in points) + 20
    scale = 1.55
    margin = 90
    width = (max_x - min_x) * scale + margin * 2
    height = (max_y - min_y) * scale + margin * 2

    def sx(x): return margin + (x - min_x) * scale
    def sy(y): return margin + (max_y - y) * scale

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" viewBox="0 0 {width:.0f} {height:.0f}">',
        '<rect width="100%" height="100%" fill="#131110"/>',
        f'<text x="{margin}" y="42" fill="#c58b4e" font-family="Arial" font-size="22" font-weight="700" letter-spacing="3">LDG PHASE 2 GEOMETRY CHECK</text>',
        f'<text x="{margin}" y="68" fill="#aaa096" font-family="Arial" font-size="13">Plan-calibrated blockout. Dimensions in feet. Not a construction drawing.</text>',
    ]
    pad = " ".join(f"{sx(x):.1f},{sy(y):.1f}" for x, y in points)
    parts.append(f'<polygon points="{pad}" fill="#2a2724" stroke="#5b5249" stroke-width="1.4"/>')

    for unit in units:
        x = sx(unit["x0"])
        y = sy(unit["y1"])
        w = (unit["x1"] - unit["x0"]) * scale
        h = (unit["y1"] - unit["y0"]) * scale
        color = "#%02x%02x%02x" % COLORS[unit["type"]]
        parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="2" fill="{color}" fill-opacity="0.88" stroke="#171411" stroke-width="1"/>')
        parts.append(f'<text x="{x+w/2:.1f}" y="{y+h/2+3.5:.1f}" text-anchor="middle" fill="#171411" font-family="Arial" font-size="8.5" font-weight="700">{unit["number"]}</text>')

    for amenity in amenities:
        x0, y0, x1, y1 = sheet_rect_to_ft(*amenity["rect"])
        x, y = sx(x0), sy(y1)
        w, h = (x1 - x0) * scale, (y1 - y0) * scale
        parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" fill="#3a322c" stroke="#c58b4e" stroke-width="1.2"/>')
        parts.append(f'<text x="{x+w/2:.1f}" y="{y+h/2+4:.1f}" text-anchor="middle" fill="#d5a16a" font-family="Arial" font-size="9" font-weight="700">{svg_escape(amenity["name"].upper())}</text>')

    # 100 ft scale bar and north arrow.
    bx, by = margin, height - 42
    parts.extend([
        f'<line x1="{bx}" y1="{by}" x2="{bx+100*scale}" y2="{by}" stroke="#f4efe7" stroke-width="3"/>',
        f'<line x1="{bx}" y1="{by-6}" x2="{bx}" y2="{by+6}" stroke="#f4efe7" stroke-width="2"/>',
        f'<line x1="{bx+100*scale}" y1="{by-6}" x2="{bx+100*scale}" y2="{by+6}" stroke="#f4efe7" stroke-width="2"/>',
        f'<text x="{bx+50*scale}" y="{by-10}" text-anchor="middle" fill="#f4efe7" font-family="Arial" font-size="11">100 FT</text>',
        f'<text x="{width-margin}" y="{height-54}" text-anchor="middle" fill="#c58b4e" font-family="Arial" font-size="16" font-weight="700">N</text>',
        f'<line x1="{width-margin}" y1="{height-38}" x2="{width-margin}" y2="{height-86}" stroke="#c58b4e" stroke-width="2"/>',
        f'<polygon points="{width-margin},{height-98} {width-margin-7},{height-82} {width-margin+7},{height-82}" fill="#c58b4e"/>',
        '</svg>',
    ])
    (VALIDATION_DIR / "site-plan-validation.svg").write_text("\n".join(parts))


def write_sections_svg():
    canvas_w, canvas_h = 1800, 1160
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{canvas_w}" height="{canvas_h}" viewBox="0 0 {canvas_w} {canvas_h}">',
        '<rect width="100%" height="100%" fill="#131110"/>',
        '<text x="70" y="54" fill="#c58b4e" font-family="Arial" font-size="24" font-weight="700" letter-spacing="3">GARAGE CONDO SHELL VALIDATION</text>',
        '<text x="70" y="82" fill="#aaa096" font-family="Arial" font-size="13">Locked: 22 ft shell, 14 ft door height, 12 ft mezzanine floor. Garage door width remains TBD.</text>',
    ]
    positions = [(70, 130), (930, 130), (70, 650), (930, 650)]
    keys = ["standard", "premier", "deluxe", "signature"]
    diagram_scale = 8.0

    for (ox, oy), key in zip(positions, keys):
        spec = UNIT_TYPES[key]
        box_w, box_h = 780, 430
        parts.append(f'<rect x="{ox}" y="{oy}" width="{box_w}" height="{box_h}" rx="8" fill="#1c1916" stroke="#52483f"/>')
        parts.append(f'<text x="{ox+24}" y="{oy+36}" fill="#f4efe7" font-family="Arial" font-size="19" font-weight="700">{key.title()}  {spec.width:.0f} x {spec.depth:.0f} FT</text>')

        # Longitudinal section.
        sx0, sy0 = ox + 34, oy + 372
        sec_w, sec_h = spec.depth * diagram_scale, SITE_HEIGHT_FT * diagram_scale
        parts.append(f'<rect x="{sx0}" y="{sy0-sec_h}" width="{sec_w}" height="{sec_h}" fill="#f4efe7" fill-opacity="0.06" stroke="#d8d0c1" stroke-width="2"/>')
        door_y = sy0 - GARAGE_DOOR_HEIGHT_FT * diagram_scale
        parts.append(f'<line x1="{sx0}" y1="{door_y}" x2="{sx0+35}" y2="{door_y}" stroke="#c58b4e" stroke-width="3"/>')
        parts.append(f'<text x="{sx0+7}" y="{door_y-9}" fill="#d5a16a" font-family="Arial" font-size="10">14 FT DOOR HEIGHT</text>')

        mezz_y = sy0 - MEZZANINE_FLOOR_FT * diagram_scale
        mezz16_x = sx0 + (spec.depth - 16) * diagram_scale
        parts.append(f'<rect x="{mezz16_x}" y="{mezz_y-3}" width="{16*diagram_scale}" height="6" fill="#c58b4e"/>')
        if spec.depth >= 28:
            ext_x = sx0 + (spec.depth - 28) * diagram_scale
            parts.append(f'<rect x="{ext_x}" y="{mezz_y-3}" width="{12*diagram_scale}" height="6" fill="#806044" stroke="#c58b4e" stroke-dasharray="7 5"/>')
        parts.append(f'<text x="{sx0+sec_w-5}" y="{mezz_y+18}" text-anchor="end" fill="#d5a16a" font-family="Arial" font-size="10">16 FT MEZZ + 12 FT OPTION</text>')

        # Dimension callouts.
        parts.extend([
            f'<line x1="{sx0-16}" y1="{sy0}" x2="{sx0-16}" y2="{sy0-sec_h}" stroke="#9b9288"/>',
            f'<text x="{sx0-23}" y="{sy0-sec_h/2}" transform="rotate(-90 {sx0-23} {sy0-sec_h/2})" text-anchor="middle" fill="#f4efe7" font-family="Arial" font-size="11">22 FT</text>',
            f'<line x1="{sx0}" y1="{sy0+14}" x2="{sx0+sec_w}" y2="{sy0+14}" stroke="#9b9288"/>',
            f'<text x="{sx0+sec_w/2}" y="{sy0+32}" text-anchor="middle" fill="#f4efe7" font-family="Arial" font-size="11">{spec.depth:.0f} FT DEPTH</text>',
            f'<text x="{ox+box_w-28}" y="{oy+78}" text-anchor="end" fill="#aaa096" font-family="Arial" font-size="12">FRONTAGE {spec.width:.0f} FT</text>',
            f'<text x="{ox+box_w-28}" y="{oy+98}" text-anchor="end" fill="#aaa096" font-family="Arial" font-size="12">DOOR WIDTH TBD</text>',
        ])

    parts.append('</svg>')
    (VALIDATION_DIR / "unit-section-validation.svg").write_text("\n".join(parts))


def write_source_overlay(units: list[dict], amenities: list[dict]):
    source = ROOT / "public" / "assets" / "siteplan.jpg"
    image = Image.open(source).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    def px_x(feet: float) -> float:
        return ORIGIN_X_PX + feet * PX_PER_FT

    def px_y(feet: float) -> float:
        return ORIGIN_Y_PX - feet * PX_PER_FT

    for unit in units:
        x0, x1 = px_x(unit["x0"]), px_x(unit["x1"])
        y0, y1 = px_y(unit["y1"]), px_y(unit["y0"])
        color = COLORS[unit["type"]]
        draw.rectangle((x0, y0, x1, y1), fill=color + (58,), outline=color + (240,), width=2)

    for amenity in amenities:
        x, y, w, h = amenity["rect"]
        draw.rectangle((x, y, x + w, y + h), fill=(197, 139, 78, 44), outline=(197, 139, 78, 230), width=2)

    image = Image.alpha_composite(image, overlay)
    image.alpha_composite(Image.new("RGBA", (1000, 76), (17, 15, 14, 235)), (0, 0))
    banner_draw = ImageDraw.Draw(image)
    title_font = ImageFont.load_default(size=22)
    note_font = ImageFont.load_default(size=13)
    banner_draw.text((24, 16), "MODEL FOOTPRINT OVERLAY", fill=(208, 150, 89), font=title_font)
    banner_draw.text((24, 45), "Colored outlines use exact unit dimensions and calibrated row centers.", fill=(242, 237, 229), font=note_font)
    image.convert("RGB").save(VALIDATION_DIR / "site-source-overlay.png", quality=94)


def iso_project(x: float, y: float, z: float) -> tuple[float, float]:
    angle = math.radians(30)
    return ((x - y) * math.cos(angle), (x + y) * math.sin(angle) - z * 1.35)


def shade(color: tuple[int, int, int], factor: float) -> tuple[int, int, int, int]:
    return tuple(max(0, min(255, int(value * factor))) for value in color) + (255,)


def write_isometric(units: list[dict], amenities: list[dict]):
    boxes = []
    for unit in units:
        boxes.append((unit["x0"], unit["y0"], unit["x1"], unit["y1"], unit["height"], COLORS[unit["type"]]))
    for amenity in amenities:
        x0, y0, x1, y1 = sheet_rect_to_ft(*amenity["rect"])
        boxes.append((x0, y0, x1, y1, amenity["height"], COLORS[amenity["kind"]]))

    all_projected = [iso_project(x, y, z) for x0, y0, x1, y1, h, _ in boxes for x, y, z in [(x0,y0,0),(x1,y0,0),(x1,y1,0),(x0,y1,0),(x0,y0,h),(x1,y0,h),(x1,y1,h),(x0,y1,h)]]
    min_px = min(x for x, _ in all_projected)
    max_px = max(x for x, _ in all_projected)
    min_py = min(y for _, y in all_projected)
    max_py = max(y for _, y in all_projected)
    image = Image.new("RGB", (2200, 1500), (19, 17, 16))
    draw = ImageDraw.Draw(image, "RGBA")
    scale = min(1940 / (max_px - min_px), 1220 / (max_py - min_py))
    offset_x = 130 - min_px * scale
    offset_y = 170 - min_py * scale

    def p(x, y, z):
        px, py = iso_project(x, y, z)
        return (offset_x + px * scale, offset_y + py * scale)

    # Ground pad.
    pad = [p(x, y, 0) for x, y in pavement_ft()]
    draw.polygon(pad, fill=(42, 39, 36, 255), outline=(86, 78, 70, 255))

    for x0, y0, x1, y1, h, color in sorted(boxes, key=lambda b: b[0] + b[1], reverse=True):
        top = [p(x0,y0,h), p(x1,y0,h), p(x1,y1,h), p(x0,y1,h)]
        side_a = [p(x0,y0,0), p(x1,y0,0), p(x1,y0,h), p(x0,y0,h)]
        side_b = [p(x1,y0,0), p(x1,y1,0), p(x1,y1,h), p(x1,y0,h)]
        draw.polygon(side_a, fill=shade(color, 0.70), outline=(25,22,20,210))
        draw.polygon(side_b, fill=shade(color, 0.82), outline=(25,22,20,210))
        draw.polygon(top, fill=shade(color, 1.05), outline=(25,22,20,210))

    font = ImageFont.load_default(size=24)
    small = ImageFont.load_default(size=16)
    draw.text((70, 48), "LDG PHASE 2  |  DIMENSIONAL BLOCKOUT", fill=(197,139,78), font=font)
    draw.text((70, 84), "75 garage condos, exact unit footprints, 22 ft shells, provisional amenity masses", fill=(205,197,188), font=small)
    draw.text((70, 1440), "Geometry validation only. Facade details, garage door width, landscape, and amenity interiors remain provisional.", fill=(170,160,150), font=small)
    image.save(VALIDATION_DIR / "site-isometric-validation.png", quality=95)


def write_manifest(units: list[dict]):
    manifest = {
        "status": "geometry validation checkpoint",
        "coordinate_system": "feet; center shared wall x=0; center unit-row south face y=0",
        "unit_count": len(units),
        "locked": {
            "site_plan": "2026.05.04 Site Plan.pdf",
            "unit_numbering": "New_Site_Plan.jpg",
            "unit_dimensions": {key: {"width_ft": spec.width, "depth_ft": spec.depth} for key, spec in UNIT_TYPES.items()},
            "shell_height_ft": SITE_HEIGHT_FT,
            "garage_door_height_ft": GARAGE_DOOR_HEIGHT_FT,
            "mezzanine_floor_height_ft": MEZZANINE_FLOOR_FT,
            "pedestrian_door_location": "consistent; exact modeled opening deferred",
            "facade_direction": "EMPAD conceptual package",
        },
        "parameterized": {
            "garage_door_width_ft": None,
            "mezzanine_depth_options_ft": [16, 28],
            "premier_mezzanine_width": "limited to the 20 ft shell width",
            "amenity_interiors": None,
            "amenity_heights": "provisional massing",
            "site_grading": "level provisional surface",
        },
        "outputs": [
            "model/ldg-phase2-site-blockout.obj",
            "model/ldg-garage-condo-shells.obj",
            "docs/model-validation/site-plan-validation.svg",
            "docs/model-validation/site-source-overlay.png",
            "docs/model-validation/site-isometric-validation.png",
            "docs/model-validation/unit-section-validation.svg",
        ],
    }
    (MODEL_DIR / "blockout-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def main():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    units = build_units()
    validate_units(units)

    write_materials()
    write_site_obj(units, AMENITIES)
    write_shells_obj()
    write_top_plan_svg(units, AMENITIES)
    write_sections_svg()
    write_source_overlay(units, AMENITIES)
    write_isometric(units, AMENITIES)
    write_manifest(units)
    print(f"built {len(units)} units")
    print(f"site bounds x={min(u['x0'] for u in units):.1f}..{max(u['x1'] for u in units):.1f} ft")
    print(f"site bounds y={min(u['y0'] for u in units):.1f}..{max(u['y1'] for u in units):.1f} ft")


if __name__ == "__main__":
    main()
