#!/usr/bin/env python3
"""Composite step for the Vision before/after pipeline (HANDOFF-PLAN.md Fix 2).

Takes the gpt_image_2 textured render for a pose, aligns it to the plate size,
and merges it onto the pristine before-plate THROUGH the parcel mask, so every
pixel outside the massing/pad region is byte-identical to the before image
(the registration gate is enforced by construction).

Usage: python3 tools/composite.py <pose> <textured.png>
Writes: captures/<pose>-after.jpg (2560x1440, q90)
        public/assets/vision/<pose>-{before,after}.jpg (deploy assets)
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CAP = ROOT / "captures"
OUT = ROOT / "public" / "assets" / "vision"

W, H = 2560, 1440


def main():
    pose, textured_path = sys.argv[1], Path(sys.argv[2])
    before = Image.open(CAP / f"{pose}-before.png").convert("RGB").resize((W, H), Image.LANCZOS)
    textured = Image.open(textured_path).convert("RGB")
    if textured.size != (W, H):
        textured = textured.resize((W, H), Image.LANCZOS)
    mask = Image.open(CAP / f"{pose}-mask.png").convert("L")
    if mask.size != (W, H):
        mask = mask.resize((W, H), Image.LANCZOS)
    # feather the mask edge so the blend has no hard seam
    mask = mask.filter(ImageFilter.GaussianBlur(6))
    after = Image.composite(textured, before, mask)

    OUT.mkdir(parents=True, exist_ok=True)
    after.save(CAP / f"{pose}-after.jpg", quality=90)
    before.save(OUT / f"{pose}-before.jpg", quality=85)
    after.save(OUT / f"{pose}-after.jpg", quality=85)
    kb = lambda p: round(p.stat().st_size / 1024)
    print(f"{pose}: after composite written; deploy assets "
          f"{kb(OUT / f'{pose}-before.jpg')}KB / {kb(OUT / f'{pose}-after.jpg')}KB")


if __name__ == "__main__":
    main()
