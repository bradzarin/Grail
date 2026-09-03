"""Shared helpers for turning real, user- or bulk-supplied card identity into a
CardSpec: a stable id and a deterministic generated-art color pair. Used by
POST /api/cards (app/main.py) and the bulk checklist loader (app/checklist.py)
so both paths produce cards the same way — see CardArt.js for why colors are
generated rather than photographed."""

from __future__ import annotations

import hashlib
import re

PALETTE = [
    ("#6d5bff", "#17c3d6"), ("#CE1141", "#0B0B0B"), ("#004D98", "#A50044"),
    ("#FEBE10", "#1B1B1B"), ("#BA0021", "#003263"), ("#0077C0", "#0B0B0B"),
    ("#1B1B1B", "#FEBE10"), ("#F7B5CD", "#231F20"), ("#e23fa0", "#6d5bff"),
    ("#17c3d6", "#e23fa0"),
]


def slugify(*parts: str) -> str:
    text = "-".join(p for p in parts if p)
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text or "card"


def palette_for(*seed_parts: str) -> tuple[str, str]:
    seed = "|".join(seed_parts)
    idx = int(hashlib.sha1(seed.encode()).hexdigest(), 16) % len(PALETTE)
    return PALETTE[idx]
