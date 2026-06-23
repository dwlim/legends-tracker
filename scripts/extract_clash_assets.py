#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import lzma
import struct
import zipfile
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
import texture2ddecoder
import zstandard as zstd
from PIL import Image


RAW_PREFIXES = (
    "assets/sc/",
    "assets/sc3d/",
    "assets/image/",
    "assets/ui/",
    "assets/font/",
)
RAW_EXACT = {"assets/assets.scdb"}

LOGIC_PREFIX = "assets/logic/"
SCTX_ATLAS_PREFIXES = (
    "assets/sc/buildings_",
    "assets/sc/building_bases_",
)

ASTC_BLOCK_SIZES = {
    186: (4, 4),
    187: (5, 4),
    188: (5, 5),
    189: (6, 5),
    190: (6, 6),
    192: (8, 5),
    193: (8, 6),
    194: (8, 8),
    195: (10, 5),
    196: (10, 6),
    197: (10, 8),
    198: (10, 10),
    199: (12, 10),
    200: (12, 12),
    204: (4, 4),
    205: (5, 4),
    206: (5, 5),
    207: (6, 5),
    208: (6, 6),
    210: (8, 5),
    211: (8, 6),
    212: (8, 8),
    213: (10, 5),
    214: (10, 6),
    215: (10, 8),
    216: (10, 10),
    217: (12, 10),
    218: (12, 12),
}


@dataclass
class ExtractedFile:
    source: str
    kind: str
    output: str
    bytes: int


@dataclass
class SpriteBox:
    x: int
    y: int
    width: int
    height: int
    area: int


@dataclass
class AtlasManifest:
    source: str
    image: str
    width: int
    height: int
    sprites: list[SpriteBox]


def decode_supercell_csv(raw: bytes) -> str:
    """
    Decode a Supercell logic CSV payload.

    Some tables are wrapped in a 68-byte signature header, and the compressed
    body uses an LZMA variant that needs four zero bytes inserted after byte 8.
    """

    candidates = []
    for start in (0, 4, 8, 9, 12, 16, 32, 64, 68):
        if start >= len(raw):
            continue
        chunk = raw[start:]
        for insert in (None, 8, 9, 10, 12):
            payload = chunk if insert is None else chunk[:insert] + b"\x00" * 4 + chunk[insert:]
            candidates.append(payload)

    for payload in candidates:
        try:
            decoded = lzma.decompress(payload, format=lzma.FORMAT_AUTO)
        except Exception:
            continue
        try:
            text = decoded.decode("utf-8")
        except UnicodeDecodeError:
            continue
        if text.startswith('"Name"'):
            return text
    raise RuntimeError("Unable to decode Supercell CSV payload")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def hash_string(value: str) -> int:
    result = 2166136261
    for char in value:
        result ^= ord(char)
        result = (result * 16777619) & 0xFFFFFFFF
    return result


def read_u32(data: bytes, offset: int) -> int:
    return struct.unpack_from("<I", data, offset)[0]


def read_u16(data: bytes, offset: int) -> int:
    return struct.unpack_from("<H", data, offset)[0]


def decode_sctx_image(raw: bytes) -> tuple[Image.Image, dict]:
    if len(raw) < 16:
        raise RuntimeError("SCTX file too small")

    texture_chunk_length = read_u32(raw, 0)
    texture_chunk = raw[4 : 4 + texture_chunk_length]
    mipmap_offset = 4 + texture_chunk_length
    mipmap_chunk_length = read_u32(raw, mipmap_offset)
    texture_data_offset = mipmap_offset + 4 + mipmap_chunk_length

    texture_root = read_u32(texture_chunk, 0)
    pixel_type = read_u32(texture_chunk, texture_root + 4)
    width = read_u16(texture_chunk, texture_root + 8)
    height = read_u16(texture_chunk, texture_root + 10)
    flags = read_u32(texture_chunk, texture_root + 12)
    expected_length = read_u32(texture_chunk, texture_root + 16)

    payload = raw[texture_data_offset:]
    if flags & 1:
        payload = zstd.ZstdDecompressor().decompress(payload, max_output_size=expected_length)

    if pixel_type not in ASTC_BLOCK_SIZES:
        raise RuntimeError(f"Unsupported SCTX pixel type: {pixel_type}")

    block_width, block_height = ASTC_BLOCK_SIZES[pixel_type]
    rgba = texture2ddecoder.decode_astc(payload, width, height, block_width, block_height)
    image = Image.frombytes("RGBA", (width, height), rgba)

    return image, {
        "pixel_type": pixel_type,
        "width": width,
        "height": height,
        "flags": flags,
        "expected_length": expected_length,
        "texture_chunk_length": texture_chunk_length,
        "mipmap_chunk_length": mipmap_chunk_length,
        "texture_data_offset": texture_data_offset,
    }


def extract_sprite_boxes(image: Image.Image, min_area: int = 128, min_side: int = 8) -> list[SpriteBox]:
    alpha = np.array(image.getchannel("A"))
    mask = (alpha > 0).astype(np.uint8)
    num_labels, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)

    sprites: list[SpriteBox] = []
    for label in range(1, num_labels):
        x = int(stats[label, cv2.CC_STAT_LEFT])
        y = int(stats[label, cv2.CC_STAT_TOP])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        area = int(stats[label, cv2.CC_STAT_AREA])

        if area < min_area or width < min_side or height < min_side:
            continue

        sprites.append(SpriteBox(x=x, y=y, width=width, height=height, area=area))

    sprites.sort(key=lambda item: (-item.area, item.width * item.height, item.x, item.y))
    return sprites


def extract_sctx_atlases(zf: zipfile.ZipFile, out_dir: Path) -> list[AtlasManifest]:
    atlases: list[AtlasManifest] = []
    atlas_root = out_dir / "decoded" / "atlases"

    for name in zf.namelist():
        if name.endswith(".meta"):
            continue
        if not name.endswith(".sctx"):
            continue
        if not name.startswith(SCTX_ATLAS_PREFIXES):
            continue

        raw = zf.read(name)
        try:
            image, meta = decode_sctx_image(raw)
        except Exception:
            continue

        atlas_rel = Path(name).relative_to("assets")
        atlas_image_path = atlas_root / atlas_rel.with_suffix(".png")
        atlas_image_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(atlas_image_path)

        atlases.append(
            AtlasManifest(
                source=name,
                image=str(atlas_image_path.relative_to(out_dir)).replace("\\", "/"),
                width=meta["width"],
                height=meta["height"],
                sprites=extract_sprite_boxes(image),
            )
        )

    atlases.sort(key=lambda atlas: atlas.source)
    return atlases


def extract_ascii_strings(data: bytes, min_length: int = 4) -> list[str]:
    strings: list[str] = []
    current: list[str] = []

    for byte in data:
        if 32 <= byte <= 126:
            current.append(chr(byte))
            continue

        if len(current) >= min_length:
            strings.append("".join(current))
        current = []

    if len(current) >= min_length:
        strings.append("".join(current))

    return strings


def extract_selected(zf: zipfile.ZipFile, out_dir: Path, decode_logic: bool) -> list[ExtractedFile]:
    extracted: list[ExtractedFile] = []

    for name in zf.namelist():
        if name.endswith("/"):
            continue

        raw = zf.read(name)

        if name.startswith(RAW_PREFIXES) or name in RAW_EXACT:
            output = out_dir / "raw" / name
            write_bytes(output, raw)
            extracted.append(ExtractedFile(source=name, kind="raw", output=str(output), bytes=len(raw)))
            continue

        if decode_logic and name.startswith(LOGIC_PREFIX) and name.endswith(".csv"):
            output = out_dir / "decoded" / name
            try:
                text = decode_supercell_csv(raw)
            except Exception:
                continue
            write_text(output, text)
            extracted.append(
                ExtractedFile(
                    source=name,
                    kind="decoded-csv",
                    output=str(output),
                    bytes=len(text.encode("utf-8")),
                )
            )

    return extracted


def write_derived_names(out_dir: Path) -> None:
    candidate_paths = [
        out_dir / "raw" / "assets/sc/building_bases.sc",
        out_dir / "raw" / "assets/sc/buildings.sc",
        out_dir / "raw" / "assets/assets.scdb",
    ]

    tokens: set[str] = set()
    for path in candidate_paths:
        if not path.exists():
            continue
        for token in extract_ascii_strings(path.read_bytes()):
            if "_base" in token or "_lvl" in token or token.startswith("townhall") or token.startswith("war_"):
                tokens.add(token)

    if tokens:
        write_text(out_dir / "derived" / "asset_name_candidates.json", json.dumps(sorted(tokens), indent=2))


def write_manifest(out_dir: Path, apk: Path, extracted: Iterable[ExtractedFile]) -> None:
    extracted_list = list(extracted)
    summary = {
        "apk": str(apk),
        "file_count": len(extracted_list),
        "by_kind": {},
        "files": [asdict(item) for item in extracted_list],
    }

    for item in extracted_list:
        summary["by_kind"][item.kind] = summary["by_kind"].get(item.kind, 0) + 1

    write_text(out_dir / "manifest.json", json.dumps(summary, indent=2))


def write_sprite_manifest(out_dir: Path, atlases: list[AtlasManifest]) -> None:
    if not atlases:
        return

    sorted_atlases = sorted(atlases, key=lambda atlas: atlas.source)
    payload = {
        "atlases": [
            {
                "source": atlas.source,
                "image": atlas.image,
                "width": atlas.width,
                "height": atlas.height,
                "sprites": [asdict(sprite) for sprite in atlas.sprites],
            }
            for atlas in sorted_atlases
        ],
        "atlas_count": len(sorted_atlases),
        "sprite_count": sum(len(atlas.sprites) for atlas in sorted_atlases),
    }
    write_text(out_dir / "derived" / "building_sprite_manifest.json", json.dumps(payload, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract Clash of Clans assets from an APK")
    parser.add_argument("apk", type=Path, help="Path to the APK")
    parser.add_argument("--out-dir", type=Path, default=Path("extracted_clash_assets"), help="Output directory")
    parser.add_argument(
        "--decode-logic",
        action="store_true",
        help="Decode Supercell logic CSV tables into UTF-8 text alongside the raw files",
    )
    args = parser.parse_args()

    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.apk) as zf:
        extracted = extract_selected(zf, out_dir, args.decode_logic)
        atlases = extract_sctx_atlases(zf, out_dir)

    write_derived_names(out_dir)
    write_manifest(out_dir, args.apk, extracted)
    write_sprite_manifest(out_dir, atlases)
    print(json.dumps({"apk": str(args.apk), "files": len(list(extracted))}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
