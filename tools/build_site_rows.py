#!/usr/bin/env python3
"""Build the complete LDG Phase 2 garage-condo row validation model."""

from __future__ import annotations

import json
from pathlib import Path

from build_blockout import (
    AMENITIES,
    ObjWriter,
    build_units,
    pavement_ft,
    sheet_rect_to_ft,
    validate_units,
)


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "model" / "site-rows"
OBJ = OUT / "ldg-phase2-detailed-rows.obj"
MTL = OUT / "ldg-phase2-detailed-rows.mtl"

HEIGHT = 22.0
GARAGE_DOOR_HEIGHT = 14.0
FACADE_DEPTH = 0.42
WALL = 0.5

MATERIALS = {
    "asphalt": (0.17, 0.16, 0.145),
    "concrete": (0.44, 0.43, 0.40),
    "shell_white": (0.82, 0.81, 0.77),
    "charcoal": (0.105, 0.10, 0.095),
    "wood": (0.43, 0.20, 0.075),
    "metal": (0.22, 0.23, 0.23),
    "glass": (0.15, 0.25, 0.29),
    "foliage": (0.16, 0.30, 0.12),
    "amenity": (0.34, 0.31, 0.28),
    "club": (0.54, 0.33, 0.16),
    "gallery": (0.26, 0.24, 0.22),
    "copper": (0.72, 0.43, 0.20),
}


def write_mtl():
    lines = []
    for name, rgb in MATERIALS.items():
        lines.extend([
            f"newmtl {name}",
            f"Kd {rgb[0]:.4f} {rgb[1]:.4f} {rgb[2]:.4f}",
            "Ka 0.035 0.035 0.035",
            "Ks 0.075 0.075 0.075",
            "Ns 28",
        ])
        if name == "glass":
            lines.extend(["d 0.62", "illum 4"])
        lines.append("")
    MTL.write_text("\n".join(lines))


def box(writer, name, bounds, material):
    writer.add_box(name, bounds, material)


def front_box(writer, name, front_x, normal, y0, y1, z0, z1, depth, material):
    xa = front_x + normal * 0.04
    xb = front_x + normal * (0.04 + depth)
    box(writer, name, (min(xa, xb), y0, z0, max(xa, xb), y1, z1), material)


def add_shell(writer, unit):
    number = unit["number"]
    prefix = f"unit_{number:02d}"
    x0, x1 = unit["x0"], unit["x1"]
    y0, y1 = unit["y0"], unit["y1"]
    face = unit["face"]
    front_x = x1 if face == "east" else x0
    rear_x = x0 if face == "east" else x1

    box(writer, f"{prefix}_floor", (x0, y0, 0, x1, y1, 0.22), "concrete")
    if face == "east":
        box(writer, f"{prefix}_rear_wall", (rear_x, y0, 0, rear_x + WALL, y1, HEIGHT), "shell_white")
    else:
        box(writer, f"{prefix}_rear_wall", (rear_x - WALL, y0, 0, rear_x, y1, HEIGHT), "shell_white")
    box(writer, f"{prefix}_side_low", (x0, y0, 0, x1, y0 + WALL, HEIGHT), "shell_white")
    box(writer, f"{prefix}_side_high", (x0, y1 - WALL, 0, x1, y1, HEIGHT), "shell_white")
    box(writer, f"{prefix}_roof", (x0, y0, HEIGHT - 0.35, x1, y1, HEIGHT), "metal")
    add_facade(writer, unit, front_x, 1 if face == "east" else -1)


def add_facade(writer, unit, front_x, normal):
    number = unit["number"]
    prefix = f"unit_{number:02d}"
    y0, y1 = unit["y0"], unit["y1"]
    frontage = y1 - y0

    # The EMPAD rhythm is scaled consistently for the 28 ft and 20 ft fronts.
    # Exact opening widths remain provisional pending measured elevations.
    margin = 0.8 if frontage >= 28 else 0.65
    opening_width = frontage * (18.0 / 28.0)
    opening_y0 = y0 + margin
    opening_y1 = opening_y0 + opening_width
    wood_y0 = opening_y1 + (0.6 if frontage >= 28 else 0.4)
    wood_y1 = y1

    front_box(writer, f"{prefix}_parapet", front_x, normal, y0, y1, 20.6, HEIGHT, FACADE_DEPTH, "shell_white")
    front_box(writer, f"{prefix}_lower_frame", front_x, normal, y0, opening_y0, 0, HEIGHT, FACADE_DEPTH, "shell_white")
    front_box(writer, f"{prefix}_opening_header", front_x, normal, opening_y0, opening_y1, GARAGE_DOOR_HEIGHT, 15.0, FACADE_DEPTH, "shell_white")
    front_box(writer, f"{prefix}_divider", front_x, normal, opening_y1, wood_y0, 0, HEIGHT, FACADE_DEPTH, "shell_white")
    front_box(writer, f"{prefix}_wood_bay", front_x, normal, wood_y0, wood_y1, 0, 20.6, FACADE_DEPTH + 0.08, "wood")

    front_box(writer, f"{prefix}_garage_door", front_x, normal, opening_y0, opening_y1, 0.3, GARAGE_DOOR_HEIGHT, FACADE_DEPTH + 0.13, "charcoal")
    for index, z in enumerate([2.2, 4.2, 6.2, 8.2, 10.2, 12.2]):
        front_box(writer, f"{prefix}_door_rail_h_{index}", front_x, normal, opening_y0, opening_y1, z, z + 0.08, FACADE_DEPTH + 0.20, "metal")
    for index, y in enumerate([opening_y0 + opening_width / 3, opening_y0 + 2 * opening_width / 3]):
        front_box(writer, f"{prefix}_door_rail_v_{index}", front_x, normal, y, y + 0.08, 0.3, GARAGE_DOOR_HEIGHT, FACADE_DEPTH + 0.20, "metal")

    for index in range(13):
        z = 15.15 + index * 0.4
        front_box(writer, f"{prefix}_upper_louver_{index:02d}", front_x, normal, opening_y0, opening_y1, z, z + 0.11, FACADE_DEPTH + 0.27, "charcoal")

    wood_width = wood_y1 - wood_y0
    ped_width = min(3.5, wood_width - 1.2)
    ped_y0 = wood_y0 + max(0.55, (wood_width - ped_width) * 0.35)
    ped_y1 = ped_y0 + ped_width
    front_box(writer, f"{prefix}_pedestrian_door", front_x, normal, ped_y0, ped_y1, 0.2, 8.2, FACADE_DEPTH + 0.20, "charcoal")
    front_box(writer, f"{prefix}_upper_window", front_x, normal, ped_y0, min(wood_y1 - 0.4, ped_y1 + 0.4), 15.5, 19.3, FACADE_DEPTH + 0.21, "glass")

    canopy_x0 = min(front_x + normal * 0.05, front_x + normal * 2.2)
    canopy_x1 = max(front_x + normal * 0.05, front_x + normal * 2.2)
    box(writer, f"{prefix}_pedestrian_canopy", (canopy_x0, wood_y0 - 0.25, 8.45, canopy_x1, wood_y1, 8.85), "metal")

    planter_x0 = min(front_x + normal * 0.08, front_x + normal * 1.2)
    planter_x1 = max(front_x + normal * 0.08, front_x + normal * 1.2)
    plant_y0 = max(y0 + 0.25, wood_y0 - 0.7)
    plant_y1 = min(y1 - 0.25, plant_y0 + 1.2)
    box(writer, f"{prefix}_planter", (planter_x0, plant_y0, 0, planter_x1, plant_y1, 0.75), "concrete")
    foliage_x0 = min(front_x + normal * 0.28, front_x + normal * 0.53)
    foliage_x1 = max(front_x + normal * 0.28, front_x + normal * 0.53)
    box(writer, f"{prefix}_landscape_marker", (foliage_x0, plant_y0 + 0.3, 0.75, foliage_x1, plant_y1 - 0.3, 13.5), "foliage")


def add_amenities(writer):
    for amenity in AMENITIES:
        x0, y0, x1, y1 = sheet_rect_to_ft(*amenity["rect"])
        material = amenity["kind"] if amenity["kind"] in {"club", "gallery"} else "amenity"
        box(writer, f"amenity_{amenity['name'].lower().replace(' ', '_')}", (x0, y0, 0, x1, y1, amenity["height"]), material)


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    units = build_units()
    validate_units(units)
    write_mtl()

    writer = ObjWriter(OBJ, MTL.name)
    writer.add_plane("site_pavement", pavement_ft(), -0.25, "asphalt")
    for unit in units:
        add_shell(writer, unit)
    add_amenities(writer)
    writer.save()

    counts = {key: sum(unit["type"] == key for unit in units) for key in ["signature", "deluxe", "premier", "standard"]}
    manifest = {
        "status": "complete garage-condo row geometry checkpoint, not buyer-facing",
        "unit_count": len(units),
        "type_counts": counts,
        "confirmed": {
            "footprints_and_numbering": True,
            "shell_height_ft": HEIGHT,
            "garage_door_height_ft": GARAGE_DOOR_HEIGHT,
            "site_row_geometry": "calibrated to authoritative site plan",
            "facade_direction": "EMPAD conceptual package dated 2025-10-29",
        },
        "provisional": {
            "garage_opening_widths": "18/28 frontage ratio",
            "pedestrian_door_widths_and_positions": "scaled facade study",
            "facade_subdivisions_materials_structure_landscape": "conceptual",
            "amenity_masses": True,
            "site_grading": "level",
        },
    }
    (OUT / "site-rows-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"built {len(units)} detailed garage-condo facades")


if __name__ == "__main__":
    build()
