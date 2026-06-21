#!/usr/bin/env python3
"""Extract the largest raster image from selected PDF pages."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


def parse_pages(value: str | None, page_count: int) -> list[int]:
    if not value:
        return list(range(1, page_count + 1))

    pages: set[int] = set()
    for part in value.split(","):
        token = part.strip()
        if not token:
            continue
        if "-" in token:
            start_text, end_text = token.split("-", 1)
            start, end = int(start_text), int(end_text)
            if start > end:
                raise ValueError(f"Invalid page range: {token}")
            pages.update(range(start, end + 1))
        else:
            pages.add(int(token))

    invalid = sorted(page for page in pages if page < 1 or page > page_count)
    if invalid:
        raise ValueError(f"Pages outside 1-{page_count}: {invalid}")
    return sorted(pages)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--pages", help="One-based pages, for example 1,3-5")
    args = parser.parse_args()

    reader = PdfReader(args.pdf)
    selected_pages = parse_pages(args.pages, len(reader.pages))
    args.output_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "sourcePdf": str(args.pdf.resolve()),
        "sourcePdfSha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest().upper(),
        "pageCount": len(reader.pages),
        "pages": [],
    }

    for page_number in selected_pages:
        images = list(reader.pages[page_number - 1].images)
        if not images:
            raise RuntimeError(f"PDF page {page_number} contains no raster images")

        source_image = max(images, key=lambda image: len(image.data))
        with Image.open(io.BytesIO(source_image.data)) as image:
            output_path = args.output_dir / f"page-{page_number:02d}.png"
            image.convert("RGB").save(output_path, format="PNG")
            width, height = image.size

        manifest["pages"].append(
            {
                "pageNumber": page_number,
                "sourceImageName": source_image.name,
                "sourceImageBytes": len(source_image.data),
                "outputPath": str(output_path.resolve()),
                "outputSha256": hashlib.sha256(output_path.read_bytes()).hexdigest().upper(),
                "width": width,
                "height": height,
            }
        )

    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
