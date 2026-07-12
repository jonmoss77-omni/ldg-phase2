#!/usr/bin/env python3
"""Convert six Three.js cubemap screenshots into a 2:1 panorama."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image


FACE_NAMES = ("px", "nx", "py", "ny", "pz", "nz")


def face_uv(x: float, y: float, z: float) -> tuple[str, float, float]:
    ax, ay, az = abs(x), abs(y), abs(z)
    if ax >= ay and ax >= az:
        face = "px" if x > 0 else "nx"
        sx = z / x
        sy = y / ax
    elif az >= ax and az >= ay:
        face = "pz" if z > 0 else "nz"
        sx = -x / z
        sy = y / az
    elif y > 0:
        face = "py"
        sx = -x / y
        sy = -z / y
    else:
        face = "ny"
        sx = x / y
        sy = -z / y
    return face, (sx + 1.0) * 0.5, (1.0 - sy) * 0.5


def convert(source: Path, output: Path, width: int):
    faces = {name: Image.open(source / f"{name}.png").convert("RGB") for name in FACE_NAMES}
    sizes = {image.size for image in faces.values()}
    if len(sizes) != 1:
        raise RuntimeError(f"cubemap face sizes differ: {sizes}")
    face_size = next(iter(sizes))[0]
    if next(iter(sizes))[1] != face_size:
        raise RuntimeError("cubemap faces must be square")
    pixels = {name: image.load() for name, image in faces.items()}

    height = width // 2
    result = Image.new("RGB", (width, height))
    out = result.load()
    for py in range(height):
        latitude = math.pi * (0.5 - (py + 0.5) / height)
        cos_lat = math.cos(latitude)
        y = math.sin(latitude)
        for px in range(width):
            longitude = 2.0 * math.pi * ((px + 0.5) / width - 0.5)
            x = math.sin(longitude) * cos_lat
            z = -math.cos(longitude) * cos_lat
            face, u, v = face_uv(x, y, z)
            ix = min(face_size - 1, max(0, int(u * face_size)))
            iy = min(face_size - 1, max(0, int(v * face_size)))
            out[px, py] = pixels[face][ix, iy]

    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, quality=93, subsampling=0, optimize=True)
    print(f"wrote {output} at {width} x {height}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int, default=4096)
    args = parser.parse_args()
    convert(args.source, args.output, args.width)


if __name__ == "__main__":
    main()
