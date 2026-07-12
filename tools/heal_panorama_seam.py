#!/usr/bin/env python3
"""Make panorama edge pixels converge without changing the scene interior."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def heal(source: Path, output: Path, band: int):
    image = Image.open(source).convert("RGB")
    width, height = image.size
    if band < 2 or band * 2 >= width:
        raise ValueError("band must be at least 2 and narrower than half the image")

    pixels = image.load()
    for y in range(height):
        for offset in range(band):
            left_x = offset
            right_x = width - 1 - offset
            left = pixels[left_x, y]
            right = pixels[right_x, y]
            target = tuple(round((left[channel] + right[channel]) / 2) for channel in range(3))
            weight = 1.0 - offset / (band - 1)
            pixels[left_x, y] = tuple(round(left[channel] * (1 - weight) + target[channel] * weight) for channel in range(3))
            pixels[right_x, y] = tuple(round(right[channel] * (1 - weight) + target[channel] * weight) for channel in range(3))

    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, quality=94, subsampling=0, optimize=True)
    print(f"wrote {output} with {band}px wrap blend")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--band", type=int, default=128)
    args = parser.parse_args()
    heal(args.source, args.output, args.band)


if __name__ == "__main__":
    main()
