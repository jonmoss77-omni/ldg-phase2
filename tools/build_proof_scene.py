#!/usr/bin/env python3
"""Build the EMPAD-led Deluxe garage-condo proof scene.

Confirmed dimensions drive the shell and interior planning. The garage-door
width is confirmed; pedestrian-door size and facade opening positions remain
proportional studies named as provisional geometry in the manifest.
"""

from __future__ import annotations

import json
from pathlib import Path

from build_blockout import ObjWriter


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "model" / "proof-scene"
OBJ = OUT / "ldg-deluxe-proof-scene.obj"
MTL = OUT / "ldg-deluxe-proof-scene.mtl"

WIDTH = 28.0
DEPTH = 50.0
HEIGHT = 22.0
GARAGE_DOOR_HEIGHT = 14.0
MEZZANINE_HEIGHT = 12.0
MEZZANINE_CLEARANCE = 10.5
MEZZANINE_DEPTH = 16.0
STAIR_WIDTH = 4.0 + 8.0 / 12.0

GARAGE_OPENING_WIDTH = 12.0
PEDESTRIAN_DOOR_WIDTH_PROVISIONAL = 3.5


MATERIALS = {
    "asphalt": (0.12, 0.115, 0.105),
    "concrete": (0.43, 0.42, 0.39),
    "shell_white": (0.82, 0.81, 0.77),
    "interior_white": (0.72, 0.71, 0.68),
    "charcoal": (0.105, 0.10, 0.095),
    "wood": (0.43, 0.20, 0.075),
    "metal": (0.22, 0.23, 0.23),
    "glass": (0.15, 0.25, 0.29),
    "mezzanine": (0.31, 0.30, 0.28),
    "foliage": (0.16, 0.30, 0.12),
    "flower": (0.58, 0.08, 0.28),
    "copper": (0.72, 0.43, 0.20),
}


def write_mtl():
    lines = []
    for name, rgb in MATERIALS.items():
        lines.extend([
            f"newmtl {name}",
            f"Kd {rgb[0]:.4f} {rgb[1]:.4f} {rgb[2]:.4f}",
            "Ka 0.035 0.035 0.035",
            "Ks 0.08 0.08 0.08",
            "Ns 32",
        ])
        if name == "glass":
            lines.extend(["d 0.58", "illum 4"])
        lines.append("")
    MTL.write_text("\n".join(lines))


def box(writer, name, bounds, material):
    writer.add_box(name, bounds, material)


def add_door_grid(writer, prefix, x0, x1, y, z0=0.3, z1=14.0):
    box(writer, f"{prefix}_garage_door", (x0, y - 0.18, z0, x1, y, z1), "charcoal")
    for index, z in enumerate([2.2, 4.2, 6.2, 8.2, 10.2, 12.2]):
        box(writer, f"{prefix}_garage_door_rail_h_{index}", (x0, y - 0.24, z, x1, y - 0.14, z + 0.08), "metal")
    for index, x in enumerate([x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3]):
        box(writer, f"{prefix}_garage_door_rail_v_{index}", (x, y - 0.24, z0, x + 0.08, y - 0.14, z1), "metal")


def add_facade(writer, x0, prefix, proof=False):
    x1 = x0 + WIDTH
    opening_x0 = x0 + 0.8
    opening_x1 = opening_x0 + GARAGE_OPENING_WIDTH
    wood_x0 = x0 + 19.4

    box(writer, f"{prefix}_parapet", (x0, -0.45, 20.6, x1, 0.25, HEIGHT), "shell_white")
    box(writer, f"{prefix}_left_frame", (x0, -0.5, 0, opening_x0, 0.35, HEIGHT), "shell_white")
    box(writer, f"{prefix}_opening_header", (opening_x0, -0.4, GARAGE_DOOR_HEIGHT, opening_x1, 0.3, 15.0), "shell_white")
    box(writer, f"{prefix}_wood_bay", (wood_x0, -0.52, 0, x1, 0.28, 20.6), "wood")
    box(writer, f"{prefix}_opening_divider", (opening_x1, -0.5, 0, wood_x0, 0.35, HEIGHT), "shell_white")

    add_door_grid(writer, prefix, opening_x0, opening_x1, -0.52)

    # Horizontal EMPAD-style louver field above the 14 ft door line.
    for index in range(13):
        z = 15.15 + index * 0.4
        box(writer, f"{prefix}_upper_louver_{index:02d}", (opening_x0, -0.68, z, opening_x1, -0.52, z + 0.11), "charcoal")

    ped_x0 = x0 + 21.5
    ped_x1 = ped_x0 + PEDESTRIAN_DOOR_WIDTH_PROVISIONAL
    box(writer, f"{prefix}_pedestrian_door", (ped_x0, -0.64, 0.2, ped_x1, -0.48, 8.2), "charcoal")
    box(writer, f"{prefix}_pedestrian_canopy", (wood_x0 - 0.4, -2.2, 8.45, x1 + 0.15, 0.0, 8.85), "metal")
    box(writer, f"{prefix}_upper_window", (ped_x0, -0.67, 15.5, ped_x1 + 0.4, -0.49, 19.3), "glass")

    # A restrained vertical landscape marker echoes the conceptual renderings.
    box(writer, f"{prefix}_planter", (x0 + 18.6, -1.35, 0, x0 + 20.0, -0.25, 0.8), "concrete")
    box(writer, f"{prefix}_landscape_marker", (x0 + 19.05, -0.72, 0.8, x0 + 19.55, -0.50, 13.8), "foliage")

    if proof:
        # Small copper marker identifies the selected proof unit without sales copy.
        box(writer, f"{prefix}_selection_marker", (x0 + 26.5, -0.72, 9.6, x0 + 26.75, -0.55, 13.0), "copper")


def add_shell(writer, x0, prefix, proof=False):
    x1 = x0 + WIDTH
    wall = 0.5
    box(writer, f"{prefix}_floor", (x0, 0, 0, x1, DEPTH, 0.25), "concrete")
    box(writer, f"{prefix}_left_wall", (x0, 0, 0, x0 + wall, DEPTH, HEIGHT), "interior_white")
    box(writer, f"{prefix}_right_wall", (x1 - wall, 0, 0, x1, DEPTH, HEIGHT), "interior_white")
    box(writer, f"{prefix}_rear_wall", (x0, DEPTH - wall, 0, x1, DEPTH, HEIGHT), "interior_white")
    box(writer, f"{prefix}_roof", (x0, 0, HEIGHT - 0.35, x1, DEPTH, HEIGHT), "metal")
    add_facade(writer, x0, prefix, proof=proof)


def add_proof_interior(writer, x0=0.0):
    prefix = "proof_unit"
    x1 = x0 + WIDTH
    mezz_y0 = DEPTH - MEZZANINE_DEPTH

    box(writer, f"{prefix}_mezzanine_structure", (x0 + 0.5, mezz_y0, MEZZANINE_CLEARANCE, x1 - 0.5, DEPTH - 0.5, MEZZANINE_HEIGHT), "mezzanine")
    box(writer, f"{prefix}_mezzanine_floor", (x0 + 0.5, mezz_y0, MEZZANINE_HEIGHT, x1 - 0.5, DEPTH - 0.5, MEZZANINE_HEIGHT + 0.25), "mezzanine")
    box(writer, f"{prefix}_mezzanine_front_beam", (x0 + 0.5, mezz_y0 - 0.35, MEZZANINE_CLEARANCE, x1 - 0.5, mezz_y0 + 0.15, MEZZANINE_HEIGHT), "metal")

    # Open guardrail across the mezzanine edge.
    box(writer, f"{prefix}_rail_top", (x0 + 0.6, mezz_y0 - 0.2, 15.2, x1 - 0.6, mezz_y0 + 0.05, 15.45), "metal")
    for index in range(7):
        x = x0 + 0.7 + index * 4.35
        box(writer, f"{prefix}_rail_post_{index}", (x, mezz_y0 - 0.2, 12.5, x + 0.18, mezz_y0 + 0.05, 15.3), "metal")

    # The plan confirms a 4 ft 8 in stair width. Its exact run is proportional
    # to the drawing until a section is supplied.
    stair_x0 = x0 + 0.5
    stair_x1 = stair_x0 + STAIR_WIDTH
    stair_y0 = 13.5
    stair_run = mezz_y0 - stair_y0
    steps = 16
    for index in range(steps):
        y0 = stair_y0 + index * stair_run / steps
        y1 = stair_y0 + (index + 1) * stair_run / steps
        z1 = (index + 1) * MEZZANINE_HEIGHT / steps
        box(writer, f"{prefix}_stair_{index:02d}", (stair_x0, y0, 0, stair_x1, y1, z1), "metal")

    # 10 ft x 9 ft 4 in restroom envelope from the Deluxe plan.
    room_x0 = x0 + 0.5
    room_x1 = room_x0 + 10.0
    room_y1 = DEPTH - 0.5
    room_y0 = room_y1 - (9.0 + 4.0 / 12.0)
    room_h = 9.0
    box(writer, f"{prefix}_restroom_side", (room_x1 - 0.25, room_y0, 0, room_x1, room_y1, room_h), "interior_white")
    box(writer, f"{prefix}_restroom_front_left", (room_x0, room_y0, 0, room_x0 + 2.5, room_y0 + 0.25, room_h), "interior_white")
    box(writer, f"{prefix}_restroom_front_right", (room_x0 + 5.7, room_y0, 0, room_x1, room_y0 + 0.25, room_h), "interior_white")
    box(writer, f"{prefix}_restroom_door", (room_x0 + 2.5, room_y0 - 0.08, 0.15, room_x0 + 5.7, room_y0 + 0.08, 7.8), "charcoal")

    # Exposed roof-truss cues keep the 22 ft volume legible without claiming
    # a final structural system.
    for index, y in enumerate([7.0, 17.0, 27.0, 37.0, 47.0]):
        box(writer, f"{prefix}_roof_beam_{index}", (x0 + 0.5, y, 20.7, x1 - 0.5, y + 0.25, 21.05), "metal")


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    write_mtl()
    writer = ObjWriter(OBJ, MTL.name)
    box(writer, "approach_drive", (-48, -48, -0.3, 76, 12, 0), "asphalt")
    box(writer, "front_apron", (-31, -8, 0, 59, 3.0, 0.18), "concrete")

    add_shell(writer, -28.0, "left_context_unit")
    add_shell(writer, 0.0, "proof_unit", proof=True)
    add_shell(writer, 28.0, "right_context_unit")
    add_proof_interior(writer)
    writer.save()

    manifest = {
        "status": "representative geometry proof, not buyer-facing",
        "selected_type": "Deluxe garage condo",
        "confirmed": {
            "shell_ft": [WIDTH, DEPTH, HEIGHT],
            "garage_door_width_ft": GARAGE_OPENING_WIDTH,
            "garage_door_height_ft": GARAGE_DOOR_HEIGHT,
            "mezzanine_floor_height_ft": MEZZANINE_HEIGHT,
            "mezzanine_clearance_ft": MEZZANINE_CLEARANCE,
            "mezzanine_depth_ft": MEZZANINE_DEPTH,
            "stair_width_ft": STAIR_WIDTH,
            "restroom_envelope_ft": [10.0, 9.0 + 4.0 / 12.0],
            "facade_direction": "EMPAD conceptual package dated 2025-10-29",
        },
        "provisional": {
            "pedestrian_door_width_ft": PEDESTRIAN_DOOR_WIDTH_PROVISIONAL,
            "stair_run": "proportional to floor plan; section not supplied",
            "facade_opening_positions": "proportional to conceptual plan",
            "structure_materials_landscape": "visual study only",
        },
        "sources": [
            "assets/Phase 2 Site Plans/2025.10.29 LUXE Dream Garage - EMPAD Conceptuals_Optimized.pdf",
            "assets/Phase 2 Unit Floor Plans/CONDO GARAGE TYPES 2.pdf, page 1",
        ],
    }
    (OUT / "proof-scene-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"built {OBJ}")


if __name__ == "__main__":
    build()
