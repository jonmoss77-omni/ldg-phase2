#!/usr/bin/env python3
"""Build a separate Signature garage-condo interior proof.

This does not modify the accepted Deluxe proof. It applies the next-pass
interior direction to the deeper 28 x 60 ft Signature shell: a 28 ft rear
mezzanine, an explicit pedestrian door, and an open-riser cantilever stair.
"""

from __future__ import annotations

import json
from pathlib import Path

import build_proof_scene as base
from build_blockout import ObjWriter


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "model" / "signature-proof"
OBJ = OUT / "ldg-signature-proof-scene.obj"
MTL = OUT / "ldg-signature-proof-scene.mtl"

WIDTH = 28.0
DEPTH = 60.0
HEIGHT = 22.0
MEZZANINE_DEPTH = 28.0
MEZZANINE_HEIGHT = 12.0
MEZZANINE_CLEARANCE = 10.5
STAIR_WIDTH = 4.0 + 8.0 / 12.0


def configure_base():
    base.OUT = OUT
    base.OBJ = OBJ
    base.MTL = MTL
    base.WIDTH = WIDTH
    base.DEPTH = DEPTH
    base.HEIGHT = HEIGHT
    base.MEZZANINE_DEPTH = MEZZANINE_DEPTH
    base.MEZZANINE_HEIGHT = MEZZANINE_HEIGHT
    base.MEZZANINE_CLEARANCE = MEZZANINE_CLEARANCE
    base.STAIR_WIDTH = STAIR_WIDTH


def add_signature_interior(writer: ObjWriter):
    x0 = 0.0
    x1 = WIDTH
    mezz_y0 = DEPTH - MEZZANINE_DEPTH

    base.box(
        writer,
        "signature_mezzanine_structure",
        (x0 + 0.5, mezz_y0, MEZZANINE_CLEARANCE, x1 - 0.5, DEPTH - 0.5, MEZZANINE_HEIGHT),
        "mezzanine",
    )
    base.box(
        writer,
        "signature_mezzanine_floor",
        (x0 + 0.5, mezz_y0, MEZZANINE_HEIGHT, x1 - 0.5, DEPTH - 0.5, MEZZANINE_HEIGHT + 0.25),
        "mezzanine",
    )
    base.box(
        writer,
        "signature_mezzanine_front_beam",
        (x0 + 0.5, mezz_y0 - 0.25, MEZZANINE_CLEARANCE, x1 - 0.5, mezz_y0 + 0.12, MEZZANINE_HEIGHT),
        "metal",
    )

    # Slim open guardrail across the mezzanine edge.
    base.box(writer, "signature_rail_top", (0.7, mezz_y0 - 0.16, 15.2, 27.3, mezz_y0 + 0.04, 15.4), "metal")
    for index in range(7):
        x = 0.8 + index * 4.35
        base.box(writer, f"signature_rail_post_{index}", (x, mezz_y0 - 0.16, 12.4, x + 0.14, mezz_y0 + 0.04, 15.3), "metal")

    # Cantilevered open-riser stair: individual thin treads project from the
    # left wall with air between them. No solid stair mass or closed risers.
    stair_x0 = x0 + 0.5
    stair_x1 = stair_x0 + STAIR_WIDTH
    stair_y0 = 17.5
    stair_run = mezz_y0 - stair_y0
    steps = 16
    for index in range(steps):
        tread_y0 = stair_y0 + index * stair_run / steps
        tread_y1 = tread_y0 + min(0.72, stair_run / steps * 0.78)
        tread_z = (index + 1) * MEZZANINE_HEIGHT / steps
        base.box(
            writer,
            f"signature_floating_tread_{index:02d}",
            (stair_x0, tread_y0, tread_z - 0.16, stair_x1, tread_y1, tread_z),
            "metal",
        )
    # Restrained wall stringer and slim handrail keep the stair plausible while
    # preserving the floating visual language.
    base.box(writer, "signature_stair_wall_stringer", (0.48, stair_y0, 0.2, 0.66, mezz_y0, 11.8), "metal")
    base.box(writer, "signature_stair_handrail", (stair_x1 - 0.12, stair_y0, 3.1, stair_x1 + 0.06, mezz_y0, 15.0), "metal")

    # Rear hospitality wall remains beneath the mezzanine, leaving both cars
    # centered in front of it and clear of the pedestrian-door circulation.
    base.box(writer, "signature_hospitality_back", (8.2, DEPTH - 1.0, 0.2, 25.8, DEPTH - 0.55, 8.8), "charcoal")

    for index, y in enumerate([7.0, 17.0, 27.0, 37.0, 47.0, 57.0]):
        base.box(writer, f"signature_roof_beam_{index}", (0.5, y, 20.7, 27.5, y + 0.22, 21.0), "metal")


def build():
    configure_base()
    OUT.mkdir(parents=True, exist_ok=True)
    base.write_mtl()
    writer = ObjWriter(OBJ, MTL.name)
    base.box(writer, "approach_drive", (-48, -48, -0.3, 76, 12, 0), "asphalt")
    base.box(writer, "front_apron", (-31, -8, 0, 59, 3.0, 0.18), "concrete")
    base.add_shell(writer, -28.0, "left_context_unit")
    base.add_shell(writer, 0.0, "signature_proof_unit", proof=True)
    base.add_shell(writer, 28.0, "right_context_unit")
    add_signature_interior(writer)
    writer.save()

    manifest = {
        "status": "Signature interior geometry proof, not final architecture",
        "selected_type": "Signature garage condo",
        "confirmed": {
            "shell_ft": [WIDTH, DEPTH, HEIGHT],
            "garage_door_width_ft": 12.0,
            "garage_door_height_ft": 14.0,
            "mezzanine_floor_height_ft": MEZZANINE_HEIGHT,
            "mezzanine_clearance_ft": MEZZANINE_CLEARANCE,
            "mezzanine_depth_ft": MEZZANINE_DEPTH,
        },
        "next_pass_direction": {
            "vehicles": "two cars centered side by side toward the rear, partly beneath the mezzanine",
            "pedestrian_door": "explicit door within the timber facade bay",
            "stair": "open-riser cantilevered floating stair study",
        },
        "provisional": {
            "pedestrian_door_width_ft": base.PEDESTRIAN_DOOR_WIDTH_PROVISIONAL,
            "stair_run_and_structure": "visual study pending architect section",
            "hospitality_fit_out_and_finishes": "artist impression only",
        },
        "sources": [
            "assets/Phase 2 Unit Floor Plans/Signature Unit Side view.jpg",
            "assets/Unit Images & Renderings/Signature_Unit.jpg",
            "Jon Moss dimensions confirmed July 2026",
        ],
    }
    (OUT / "signature-proof-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"built {OBJ}")


if __name__ == "__main__":
    build()
