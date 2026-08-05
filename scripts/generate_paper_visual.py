#!/usr/bin/env python3
"""
generate_paper_visual.py

Draws the cosmic node-graph banner used on the research page, in the same
style as recrec.png and plot-twist.png. Pure Pillow/numpy, no API calls.

Each paper gets a motif that reflects its idea rather than generic art.

Usage:
    python scripts/generate_paper_visual.py --id atlas
    python scripts/generate_paper_visual.py --id genesis
    python scripts/generate_paper_visual.py --all

Note on framing: .paper-image-strip is 120px tall and renders the image at
220px with object-position center 30%, so only roughly y 150-500 of the
1024px canvas is ever visible. Keep the motif in that band.
"""

import argparse
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REPO_ROOT = Path(__file__).parent.parent
OUT_DIR = REPO_ROOT / "assets" / "research" / "images"

W, H = 1792, 1024
SS = 2                      # supersample factor for smooth strokes
FOCUS_Y = 0.34              # motif centre, inside the visible band

# Site palette
NEBULA = (167, 139, 250)
PULSAR = (45, 212, 191)
QUASAR = (251, 191, 36)
AURORA = (244, 114, 182)
AZURE = (122, 162, 247)
VOID = (4, 4, 12)


def _canvas():
    return Image.new("RGB", (W * SS, H * SS), VOID)


def background(img, tint, cx=0.5, cy=FOCUS_Y, strength=1.0):
    """Elliptical glow behind the motif, like the existing banners."""
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx - cx * w) / (w * 0.55)
    dy = (yy - cy * h) / (h * 0.42)
    d = np.sqrt(dx * dx + dy * dy)
    falloff = np.clip(1.0 - d, 0.0, 1.0) ** 2.2 * strength

    base = np.asarray(img).astype(np.float32)
    for i in range(3):
        base[:, :, i] += falloff * tint[i] * 0.42
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


def starfield(draw, rng, n=900):
    tints = [(255, 255, 255)] * 8 + [NEBULA, PULSAR, QUASAR, AURORA, AZURE]
    for _ in range(n):
        x = rng.uniform(0, W * SS)
        y = rng.uniform(0, H * SS)
        # thin the stars out where the motif lives so it stays readable
        if abs(y / (H * SS) - FOCUS_Y) < 0.16 and rng.random() < 0.55:
            continue
        r = rng.choice([1, 1, 1, 1.5, 2, 2.5, 3]) * SS * 0.6
        a = rng.uniform(0.25, 1.0)
        c = rng.choice(tints)
        col = tuple(int(v * a) for v in c)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=col)


def cross(draw, x, y, size, col):
    s = size * SS
    draw.line([x - s, y, x + s, y], fill=col, width=max(1, int(SS * 0.8)))
    draw.line([x, y - s, x, y + s], fill=col, width=max(1, int(SS * 0.8)))


def node(draw, x, y, r, col, ring=False):
    r = r * SS
    draw.ellipse([x - r, y - r, x + r, y + r], fill=col)
    if ring:
        draw.ellipse([x - r * 2.1, y - r * 2.1, x + r * 2.1, y + r * 2.1],
                     outline=col, width=max(1, int(SS)))


def edge(draw, p, q, col, width=1.4):
    draw.line([p[0], p[1], q[0], q[1]], fill=col, width=max(1, int(width * SS)))


def arrow(draw, p, q, col, width=1.4, head=9, gap=7):
    """Directed edge with a filled head, stopping short of the target node."""
    ang = math.atan2(q[1] - p[1], q[0] - p[0])
    back = gap * SS
    qx, qy = q[0] - math.cos(ang) * back, q[1] - math.sin(ang) * back
    draw.line([p[0], p[1], qx, qy], fill=col, width=max(1, int(width * SS)))
    h = head * SS
    draw.polygon([
        (qx, qy),
        (qx - math.cos(ang - 0.42) * h, qy - math.sin(ang - 0.42) * h),
        (qx - math.cos(ang + 0.42) * h, qy - math.sin(ang + 0.42) * h),
    ], fill=col)


def dim(col, f):
    return tuple(int(c * f) for c in col)


def cluster(draw, cx, cy, col, rng, n=14, spread=95, faint=False):
    """A constellation blob: a few hub nodes with satellites."""
    pts = []
    for _ in range(n):
        a = rng.uniform(0, math.tau)
        rad = rng.uniform(0.15, 1.0) ** 0.7 * spread * SS
        pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad * 0.8))
    ec = dim(col, 0.30 if faint else 0.55)
    for i, p in enumerate(pts):
        nearest = sorted(pts, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)[1:3]
        for q in nearest:
            edge(draw, p, q, ec, 1.0)
    for i, p in enumerate(pts):
        r = rng.choice([2.2, 3.0, 4.2, 5.5]) if not faint else rng.choice([1.8, 2.4])
        node(draw, p[0], p[1], r, col if not faint else dim(col, 0.55))
    return pts


# ────────────────────────────────────────────────────────────
# ATLAS: five source domains -> shared quantized space -> unseen domains
# ────────────────────────────────────────────────────────────
def draw_atlas(img, glow, rng):
    d = ImageDraw.Draw(img)
    g = ImageDraw.Draw(glow)

    cy = H * SS * FOCUS_Y
    hub = (W * SS * 0.5, cy)

    src_cols = [PULSAR, NEBULA, QUASAR, AURORA, AZURE]
    src_pts = []
    for i, col in enumerate(src_cols):
        t = i / (len(src_cols) - 1)
        cx = W * SS * (0.07 + 0.13 * t)
        yy = cy + (t - 0.5) * H * SS * 0.46
        pts = cluster(d, cx, yy, col, rng, n=13, spread=74)
        src_pts.append((pts, col))

    # convergence into the shared latent space
    for pts, col in src_pts:
        anchor = max(pts, key=lambda p: p[0])
        edge(d, anchor, hub, dim(col, 0.42), 1.2)
        g.line([anchor[0], anchor[1], hub[0], hub[1]], fill=dim(col, 0.5),
               width=int(2.2 * SS))

    # residual vector-quantization codebook: a discrete lattice ring
    for ring_i, rr in enumerate([46, 74, 104]):
        count = 14 + ring_i * 7
        for k in range(count):
            a = math.tau * k / count + ring_i * 0.22
            x = hub[0] + math.cos(a) * rr * SS * 1.9
            y = hub[1] + math.sin(a) * rr * SS * 1.0
            s = SS * (2.4 - ring_i * 0.5)
            c = dim(PULSAR, 0.85 - ring_i * 0.18)
            d.rectangle([x - s, y - s, x + s, y + s], fill=c)
            g.rectangle([x - s, y - s, x + s, y + s], fill=c)

    node(d, hub[0], hub[1], 7, (255, 255, 255))
    g.ellipse([hub[0] - 26 * SS, hub[1] - 26 * SS, hub[0] + 26 * SS, hub[1] + 26 * SS],
              fill=dim(PULSAR, 0.85))

    # unseen domains on the right, dimmer, lit only by transferred structure
    for i in range(5):
        t = i / 4
        cx = W * SS * (0.72 + 0.16 * rng.random())
        yy = cy + (t - 0.5) * H * SS * 0.52
        col = src_cols[(i + 2) % len(src_cols)]
        pts = cluster(d, cx, yy, col, rng, n=9, spread=58, faint=True)
        anchor = min(pts, key=lambda p: p[0])
        edge(d, hub, anchor, dim(col, 0.24), 1.0)

    for _ in range(26):
        cross(d, rng.uniform(0, W * SS), rng.uniform(0, H * SS),
              rng.uniform(3, 6), (150, 150, 170))


# ────────────────────────────────────────────────────────────
# GENESIS: causal DAG built from traceable chain / fork / collider motifs
# ────────────────────────────────────────────────────────────
def draw_genesis(img, glow, rng):
    d = ImageDraw.Draw(img)
    g = ImageDraw.Draw(glow)
    cy = H * SS * FOCUS_Y

    # background DAG, dim
    bg_nodes = []
    for _ in range(26):
        x = rng.uniform(W * SS * 0.06, W * SS * 0.94)
        y = cy + rng.uniform(-1, 1) * H * SS * 0.24
        bg_nodes.append((x, y))
    for p in bg_nodes:
        for q in sorted(bg_nodes, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)[1:3]:
            if q[0] > p[0]:
                arrow(d, p, q, dim(NEBULA, 0.22), 1.0, head=7)
    for p in bg_nodes:
        node(d, p[0], p[1], 2.6, dim(NEBULA, 0.5))

    # Three highlighted triads. Each gets a distinct silhouette so the
    # structures stay readable: a straight line, a fan out, a fan in.
    S = 112 * SS
    specs = [
        (0.19, "chain",    PULSAR),
        (0.50, "fork",     NEBULA),
        (0.81, "collider", AURORA),
    ]
    for fx, kind, col in specs:
        cx = W * SS * fx

        if kind == "chain":
            a = (cx - S, cy)
            b = (cx, cy)
            c = (cx + S, cy)
            pairs = [(a, b), (b, c)]
        elif kind == "fork":
            b = (cx, cy - S * 0.52)                 # parent on top
            a = (cx - S * 0.86, cy + S * 0.46)
            c = (cx + S * 0.86, cy + S * 0.46)
            pairs = [(b, a), (b, c)]
        else:                                       # collider
            a = (cx - S * 0.86, cy - S * 0.52)
            c = (cx + S * 0.86, cy - S * 0.52)
            b = (cx, cy + S * 0.46)                 # child at the bottom
            pairs = [(a, b), (c, b)]

        # glow under the strokes only, so heads stay crisp on top
        for p, q in pairs:
            g.line([p[0], p[1], q[0], q[1]], fill=dim(col, 0.55), width=int(3 * SS))

        for p in (a, b, c):
            g.ellipse([p[0] - 11 * SS, p[1] - 11 * SS, p[0] + 11 * SS, p[1] + 11 * SS],
                      fill=dim(col, 0.42))
            node(d, p[0], p[1], 6.0, col, ring=True)

        for p, q in pairs:
            arrow(d, p, q, col, 2.2, head=15, gap=15)

        # auditable-evidence ticks under each triad
        ty = cy + S * 0.95
        for k in range(5):
            x = cx - S * 0.5 + k * (S * 0.25)
            d.line([x, ty, x, ty + 10 * SS], fill=dim(col, 0.55), width=max(1, int(SS)))

    for _ in range(24):
        cross(d, rng.uniform(0, W * SS), rng.uniform(0, H * SS),
              rng.uniform(3, 6), (150, 150, 170))


BUILDERS = {
    "atlas": (draw_atlas, PULSAR, 7),
    "genesis": (draw_genesis, NEBULA, 11),
}


def build(pid):
    fn, tint, seed = BUILDERS[pid]
    rng = random.Random(seed)

    img = _canvas()
    glow = Image.new("RGB", img.size, (0, 0, 0))
    d = ImageDraw.Draw(img)
    starfield(d, rng)
    fn(img, glow, rng)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=15 * SS))
    a = np.asarray(img).astype(np.float32)
    b = np.asarray(glow).astype(np.float32)
    out = Image.fromarray(np.clip(a + b * 0.85, 0, 255).astype(np.uint8))

    out = background(out, tint)
    out = out.resize((W, H), Image.LANCZOS)

    # Settle the bottom into darkness, matching the strip's fade mask.
    # Ramp starts at 1.0 exactly where it begins so there is no hard seam.
    arr = np.asarray(out).astype(np.float32)
    ramp = np.ones(H, dtype=np.float32)
    start = int(H * 0.58)
    ramp[start:] = np.linspace(1.0, 0.30, H - start, dtype=np.float32) ** 1.4
    arr *= ramp[:, None, None]
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{pid}.png"
    out.save(path, "PNG", optimize=True)
    kb = path.stat().st_size / 1024
    print(f"  wrote {path.relative_to(REPO_ROOT)}  {out.size[0]}x{out.size[1]}  {kb:.0f} KB")
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", choices=sorted(BUILDERS))
    ap.add_argument("--all", action="store_true")
    args = ap.parse_args()

    ids = sorted(BUILDERS) if args.all else ([args.id] if args.id else [])
    if not ids:
        ap.error("pass --id <name> or --all")
    for pid in ids:
        build(pid)


if __name__ == "__main__":
    main()
