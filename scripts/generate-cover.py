#!/usr/bin/env python3
"""Generate the repository key art (concept, not an in-engine capture)."""
from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og-cover.png"
S = 2
W, H = 1600 * S, 900 * S
GROUND = 786

CYAN = (82, 246, 255)
CYAN_SOFT = (176, 255, 255)
MAGENTA = (255, 43, 214)
AMBER = (255, 179, 112)
ICE = (220, 255, 255)
DARK = (3, 8, 15)
MUTED = (112, 154, 169)

DISPLAY_PATH = r"C:\Windows\Fonts\bahnschrift.ttf"
MONO_PATH = r"C:\Windows\Fonts\consola.ttf"
MONO_BOLD_PATH = r"C:\Windows\Fonts\consolab.ttf"
CJK_PATH = r"C:\Windows\Fonts\msyh.ttc"


def sc(value: float) -> int:
    return int(round(value * S))


def font(path: str, size: float, weight: str | None = None) -> ImageFont.FreeTypeFont:
    loaded = ImageFont.truetype(path, sc(size))
    if weight:
        try:
            loaded.set_variation_by_name(weight)
        except Exception:
            pass
    return loaded


def track_text(draw: ImageDraw.ImageDraw, xy, text, face, fill, tracking=0, anchor=None):
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=face, fill=fill)
        x += draw.textlength(char, font=face) + tracking * S


def tracked_length(draw: ImageDraw.ImageDraw, text: str, face, tracking: float) -> float:
    return sum(draw.textlength(char, font=face) for char in text) + tracking * S * max(0, len(text) - 1)


def main() -> None:
    rng = random.Random(0x51A7C0DE)
    np_rng = np.random.default_rng(517)

    # Sky: vertical gradient + aurora radiance.
    stops = [
        (0.0, (1, 2, 7)),
        (0.34, (2, 7, 15)),
        (0.56, (4, 13, 22)),
        (0.72, (8, 20, 31)),
        (0.81, (9, 19, 26)),
        (1.0, (1, 3, 7)),
    ]
    yline = np.linspace(0.0, 1.0, H)
    sky = np.zeros((H, W, 3), dtype=np.uint8)
    for i in range(len(stops) - 1):
        y0, c0 = stops[i]
        y1, c1 = stops[i + 1]
        mask = (yline >= y0) & (yline <= y1)
        t = ((yline[mask] - y0) / max(1e-6, y1 - y0))[:, None]
        c0 = np.array(c0, dtype=np.float32)
        c1 = np.array(c1, dtype=np.float32)
        sky[mask] = (c0[None, :] * (1 - t) + c1[None, :] * t)[:, None, :].astype(np.uint8)
    img = Image.fromarray(sky, "RGB").convert("RGBA")

    # Soft atmosphere / horizon lighting.
    halo = Image.new("RGB", (W, H), 0)
    hd = ImageDraw.Draw(halo)
    hd.ellipse((sc(580), sc(320), sc(1430), sc(930)), fill=(3, 48, 64))
    hd.ellipse((sc(690), sc(510), sc(1330), sc(820)), fill=(5, 72, 92))
    hd.ellipse((sc(1320), sc(430), sc(1660), sc(900)), fill=(62, 7, 51))
    hd.ellipse((sc(780), sc(700), sc(1470), sc(870)), fill=(4, 40, 50))
    halo = halo.filter(ImageFilter.GaussianBlur(sc(130)))
    img = ImageChops.screen(img.convert("RGB"), halo).convert("RGBA")

    # Faint stars.
    star_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(star_layer)
    for _ in range(230):
        x = rng.randint(sc(30), sc(1560))
        y = rng.randint(sc(25), sc(690))
        radius = rng.choice([sc(0.5), sc(0.5), sc(0.7), sc(1.0)])
        alpha = rng.randint(24, 110)
        sd.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(180, 240, 255, alpha))
    img = Image.alpha_composite(img, star_layer)

    # Distant skyline silhouettes.
    def city_layer(base_y: int, count: int, color, alpha: int, min_h: int, max_h: int, seed: int):
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        local_rng = random.Random(seed)
        for _ in range(count):
            bw = local_rng.randint(sc(18), sc(62))
            bh = local_rng.randint(sc(min_h), sc(max_h))
            x = local_rng.randint(sc(-40), sc(1600))
            y0 = sc(base_y) - bh
            d.rectangle((x, y0, x + bw, sc(base_y)), fill=(*color, alpha))
            if local_rng.random() < 0.6:
                edge = local_rng.choice([(CYAN[0], CYAN[1], CYAN[2], alpha), (MAGENTA[0], MAGENTA[1], MAGENTA[2], int(alpha * 0.7))])
                d.rectangle((x + sc(2), y0 + sc(1), x + bw - sc(2), y0 + sc(2)), fill=edge)
            for _ in range(local_rng.randint(2, 15)):
                wx = x + local_rng.randint(sc(3), max(sc(3), bw - sc(5)))
                wy = y0 + local_rng.randint(sc(5), max(sc(6), bh - sc(6)))
                d.rectangle((wx, wy, wx + sc(1.5), wy + sc(2.5)), fill=(local_rng.choice([CYAN, AMBER, ICE, MAGENTA]) + (local_rng.randint(22, 80),)))
        return layer

    img = Image.alpha_composite(img, city_layer(792, 42, (7, 19, 29), 238, 36, 178, 17))
    img = Image.alpha_composite(img, city_layer(798, 31, (4, 13, 21), 255, 18, 96, 31))

    # Atmospheric fog band behind the tower.
    fog = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fog)
    fd.rectangle((0, sc(694), W, sc(798)), fill=(15, 57, 69, 34))
    fog = fog.filter(ImageFilter.GaussianBlur(sc(25)))
    img = Image.alpha_composite(img, fog)

    # Glow canvases.
    glow_wide = Image.new("RGB", (W, H), 0)
    glow_tight = Image.new("RGB", (W, H), 0)
    gw = ImageDraw.Draw(glow_wide)
    gt = ImageDraw.Draw(glow_tight)
    reflection = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(reflection)
    sharp = ImageDraw.Draw(img)

    def neon_line(points, color, width=1.5, glow_width=8):
        sharp.line(points, fill=color, width=sc(width))
        gw.line(points, fill=color, width=sc(glow_width))
        gt.line(points, fill=color, width=sc(max(2, glow_width * 0.35)))

    def neon_rect(box, color, width=1.5, glow_width=8):
        x0, y0, x1, y1 = box
        pts = [(sc(x0), sc(y0)), (sc(x1), sc(y0)), (sc(x1), sc(y1)), (sc(x0), sc(y1)), (sc(x0), sc(y0))]
        neon_line(pts, color, width, glow_width)

    def window_pane(x, y, w, h, color, alpha=255, reflect=True):
        sharp.rectangle((sc(x), sc(y), sc(x + w), sc(y + h)), fill=(*color, alpha))
        gt.rectangle((sc(x - 2), sc(y - 2), sc(x + w + 2), sc(y + h + 2)), fill=color)
        if reflect:
            ry = GROUND + (GROUND - (y + h)) * 0.28 + 10
            rd.rectangle(
                (sc(x + 1), sc(ry), sc(x + w + 2), sc(ry + h * 0.9)),
                fill=(*color, 26),
            )

    def panel(x0, y0, x1, y1, top, bottom, side=False):
        steps = max(2, int(y1 - y0))
        for i in range(steps):
            t = i / max(1, steps - 1)
            color = tuple(int(top[j] * (1 - t) + bottom[j] * t) for j in range(3))
            yy0 = sc(y0 + i)
            yy1 = sc(y0 + i + 1) + 1
            sharp.rectangle((sc(x0), yy0, sc(x1), yy1), fill=(*color, 255))

    # Perspective wet-ground grid.
    ground = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(ground)
    vp_x, vp_y = sc(1160), sc(GROUND)
    for x in range(-900, 2600, 105):
        gd.line([(sc(x), H), (vp_x, vp_y + sc(1))], fill=(44, 150, 160, 22), width=sc(1))
    for i, offset in enumerate([3, 8, 17, 30, 49, 76, 112, 158]):
        yy = vp_y + sc(offset)
        gd.line([(0, yy), (W, yy)], fill=(51, 156, 165, max(8, 28 - i * 2)), width=sc(1))
    ground = ground.filter(ImageFilter.GaussianBlur(sc(0.7)))
    img = Image.alpha_composite(img, ground)
    sharp = ImageDraw.Draw(img)

    # Distant cyan horizon line.
    neon_line([(sc(0), sc(780)), (sc(1600), sc(780))], (25, 96, 109), 0.8, 9)

    # Tower dimensions.
    cx = 1160
    tiers = [
        {"y0": 705, "y1": 786, "hw": 168, "glass": ((8, 23, 32), (2, 7, 12))},
        {"y0": 433, "y1": 709, "hw": 104, "glass": ((9, 33, 47), (3, 7, 14))},
        {"y0": 292, "y1": 437, "hw": 78, "glass": ((9, 35, 51), (2, 7, 13))},
        {"y0": 186, "y1": 296, "hw": 56, "glass": ((11, 41, 58), (3, 8, 15))},
    ]

    # Podium shadow.
    pod_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(pod_shadow).ellipse((sc(890), sc(744), sc(1430), sc(835)), fill=(0, 0, 0, 175))
    img = Image.alpha_composite(img, pod_shadow)

    # Tier bodies, with a small side face for dimension.
    for tier in tiers:
        x0, x1 = cx - tier["hw"], cx + tier["hw"]
        panel(x0, tier["y0"], x1, tier["y1"], tier["glass"][0], tier["glass"][1])
        side_x = x1 + 26
        sharp.polygon(
            [
                (sc(x1), sc(tier["y0"])),
                (sc(side_x), sc(tier["y0"] - 13)),
                (sc(side_x), sc(tier["y1"] - 13)),
                (sc(x1), sc(tier["y1"])),
            ],
            fill=(3, 10, 16, 235),
        )
        neon_line([(sc(x0), sc(tier["y0"])), (sc(x0), sc(tier["y1"]))], (60, 146, 158), 0.7, 5)
        neon_line([(sc(x1), sc(tier["y0"])), (sc(x1), sc(tier["y1"]))], (63, 167, 176), 0.6, 5)
        sharp.line([(sc(side_x), sc(tier["y0"] - 13)), (sc(side_x), sc(tier["y1"] - 13))], fill=(18, 52, 60, 200), width=sc(1))

        # Fine glass mullions.
        for yy in range(int(tier["y0"]) + 11, int(tier["y1"]) - 5, 15):
            sharp.line([(sc(x0 + 4), sc(yy)), (sc(x1 - 4), sc(yy))], fill=(37, 101, 111, 50), width=sc(0.5))
        for xx in range(int(x0) + 12, int(x1) - 8, 15):
            sharp.line([(sc(xx), sc(tier["y0"] + 5)), (sc(xx), sc(tier["y1"] - 4))], fill=(31, 85, 97, 38), width=sc(0.5))

        # Window grid, denser at the lower tier.
        step_x = 9 if tier["hw"] > 90 else 8
        step_y = 13 if tier["hw"] > 90 else 12
        for xx in range(int(x0) + 9, int(x1) - 7, step_x):
            for yy in range(int(tier["y0"]) + 10, int(tier["y1"]) - 7, step_y):
                lit = rng.random()
                if lit < 0.39:
                    color = rng.choices(
                        [CYAN, ICE, AMBER, MAGENTA],
                        weights=[42, 24, 22, 12],
                    )[0]
                    if color == ICE:
                        color = (152, 228, 245)
                    alpha = rng.randint(150, 255)
                    window_pane(xx, yy, 4.3, 5.1, color, alpha)
                else:
                    sharp.rectangle((sc(xx), sc(yy), sc(xx + 4.3), sc(yy + 5.1)), fill=(1, 7, 11, rng.randint(80, 150)))

        # Occasional glowing service vents.
        for _ in range(4):
            yy = rng.randint(int(tier["y0"]) + 22, int(tier["y1"]) - 18)
            width = rng.randint(18, 38)
            sharp.rectangle((sc(x0 + 7), sc(yy), sc(x0 + 7 + width), sc(yy + 2)), fill=(*MAGENTA, 150))
            gt.rectangle((sc(x0 + 6), sc(yy - 1), sc(x0 + 8 + width), sc(yy + 3)), fill=MAGENTA)

        # Tier neon belt.
        belt = MAGENTA if tier["hw"] < 90 else CYAN
        neon_line([(sc(x0 - 1), sc(tier["y1"] - 3)), (sc(x1 + 1), sc(tier["y1"] - 3))], belt, 1.1, 8)
        neon_line([(sc(x0 + 5), sc(tier["y0"] + 2)), (sc(x1 - 5), sc(tier["y0"] + 2))], (26, 90, 101), 0.6, 4)

    # Exposed diagonal braces.
    for tier in tiers[1:3]:
        x0, x1 = cx - tier["hw"], cx + tier["hw"]
        y0, y1 = tier["y0"] + 12, tier["y1"] - 10
        neon_line([(sc(x0 + 8), sc(y0)), (sc(x1 - 8), sc(y1))], (49, 132, 143), 0.9, 4)
        neon_line([(sc(x1 - 8), sc(y0)), (sc(x0 + 8), sc(y1))], (47, 113, 127), 0.7, 3)

    # Cantilever observation deck.
    sharp.rectangle((sc(1228), sc(301), sc(1310), sc(322)), fill=(5, 16, 24, 245))
    sharp.rectangle((sc(1232), sc(305), sc(1305), sc(316)), fill=(16, 65, 81, 210))
    for xx in range(1238, 1300, 11):
        window_pane(xx, 307, 6, 4.5, rng.choice([CYAN, CYAN, ICE, MAGENTA]), 185)
    neon_line([(sc(1228), sc(324)), (sc(1310), sc(324))], MAGENTA, 1.3, 11)
    neon_line([(sc(1230), sc(301)), (sc(1249), sc(330))], (31, 97, 109), 0.8, 4)
    sharp.polygon([(sc(1232), sc(322)), (sc(1215), sc(349)), (sc(1225), sc(322))], fill=(4, 12, 19, 255))

    # Crown / equipment / fins.
    shadow_boxes = [
        (1080, 190, 1244, 202),
        (1088, 176, 1236, 194),
        (1094, 168, 1228, 188),
        (1105, 158, 1218, 177),
    ]
    for i, box in enumerate(shadow_boxes):
        sharp.rectangle(tuple(sc(v) for v in box), fill=(3 + i, 10 + i, 15 + i, 255))
    # Angled crown fins.
    sharp.polygon([(sc(1228), sc(174)), (sc(1272), sc(138)), (sc(1250), sc(208))], fill=(4, 13, 19, 255))
    sharp.polygon([(sc(1090), sc(178)), (sc(1053), sc(140)), (sc(1070), sc(209))], fill=(3, 10, 15, 255))
    neon_line([(sc(1228), sc(174)), (sc(1272), sc(138))], CYAN, 1.0, 7)
    neon_line([(sc(1090), sc(178)), (sc(1053), sc(140))], MAGENTA, 1.0, 7)

    # Small STARK sign on the tower.
    sign_face = font(DISPLAY_PATH, 29, "SemiBold")
    sign_x = cx - 41
    sharp.text((sc(sign_x), sc(342)), "STARK", font=sign_face, fill=(236, 255, 255))
    gt.text((sc(sign_x), sc(342)), "STARK", font=sign_face, fill=CYAN)
    neon_line([(sc(sign_x), sc(378)), (sc(sign_x + 92), sc(378))], MAGENTA, 0.8, 5)

    # Arc reactor.
    reactor_y = 157
    sharp.ellipse((sc(cx - 18), sc(reactor_y - 18), sc(cx + 18), sc(reactor_y + 18)), fill=(4, 15, 22, 255))
    sharp.ellipse((sc(cx - 15), sc(reactor_y - 15), sc(cx + 15), sc(reactor_y + 15)), outline=(*CYAN, 235), width=sc(1.8))
    sharp.ellipse((sc(cx - 7), sc(reactor_y - 7), sc(cx + 7), sc(reactor_y + 7)), fill=(*CYAN, 230))
    gw.ellipse((sc(cx - 30), sc(reactor_y - 30), sc(cx + 30), sc(reactor_y + 30)), fill=CYAN)
    gt.ellipse((sc(cx - 18), sc(reactor_y - 18), sc(cx + 18), sc(reactor_y + 18)), fill=CYAN)

    # Antenna mast.
    mast_top = 48
    neon_line([(sc(cx), sc(mast_top)), (sc(cx), sc(157))], (82, 156, 166), 1.2, 5)
    sharp.ellipse((sc(cx - 3), sc(mast_top - 3), sc(cx + 3), sc(mast_top + 3)), fill=(*CYAN, 255))
    gw.ellipse((sc(cx - 18), sc(mast_top - 18), sc(cx + 18), sc(mast_top + 18)), fill=CYAN)
    for yy in (86, 111, 137):
        neon_line([(sc(cx - 17), sc(yy)), (sc(cx + 17), sc(yy))], (33, 117, 133), 0.8, 3)

    # Orbital halos.
    bbox1 = (sc(cx - 256), sc(172), sc(cx + 256), sc(232))
    bbox2 = (sc(cx - 312), sc(180), sc(cx + 312), sc(249))
    gw.arc(bbox1, 182, 358, fill=CYAN, width=sc(3))
    gt.arc(bbox1, 182, 358, fill=CYAN, width=sc(1.3))
    sharp.arc(bbox1, 182, 358, fill=(*CYAN, 210), width=sc(1.1))
    gw.arc(bbox2, 108, 246, fill=MAGENTA, width=sc(2))
    gt.arc(bbox2, 108, 246, fill=MAGENTA, width=sc(0.8))
    sharp.arc(bbox2, 108, 246, fill=(*MAGENTA, 175), width=sc(0.7))

    # Entry portal.
    portal = [(sc(cx - 55), sc(786)), (sc(cx - 55), sc(735)), (sc(cx - 36), sc(714)), (sc(cx + 36), sc(714)), (sc(cx + 55), sc(735)), (sc(cx + 55), sc(786))]
    gw.line(portal, fill=CYAN, width=sc(7))
    gt.line(portal, fill=CYAN, width=sc(2))
    sharp.line(portal, fill=(*CYAN, 215), width=sc(1.2))
    sharp.rectangle((sc(cx - 54), sc(744), sc(cx + 54), sc(786)), fill=(7, 28, 38, 160))

    # Ground neon arc.
    gw.arc((sc(920), sc(760), sc(1395), sc(820)), 5, 175, fill=CYAN, width=sc(4))
    gt.arc((sc(920), sc(760), sc(1395), sc(820)), 5, 175, fill=CYAN, width=sc(1.2))
    sharp.arc((sc(920), sc(760), sc(1395), sc(820)), 5, 175, fill=(*CYAN, 205), width=sc(0.9))
    gw.arc((sc(880), sc(780), sc(1450), sc(846)), 195, 345, fill=MAGENTA, width=sc(2.5))
    gt.arc((sc(880), sc(780), sc(1450), sc(846)), 195, 345, fill=MAGENTA, width=sc(0.7))
    sharp.arc((sc(880), sc(780), sc(1450), sc(846)), 195, 345, fill=(*MAGENTA, 160), width=sc(0.6))

    # Rain streaks.
    for _ in range(420):
        x = rng.randint(sc(0), sc(1600))
        y = rng.randint(sc(80), sc(760))
        length = rng.randint(sc(4), sc(17))
        sharp.line([(sc(x / S), sc(y / S)), (sc(x / S + 2.2), sc(y / S + length / S))], fill=(128, 223, 235, rng.randint(12, 50)), width=sc(0.45))

    # Merge bloom passes.
    glow_wide = glow_wide.filter(ImageFilter.GaussianBlur(sc(18)))
    glow_tight = glow_tight.filter(ImageFilter.GaussianBlur(sc(3.2)))
    merged = ImageChops.screen(img.convert("RGB"), glow_wide)
    merged = ImageChops.screen(merged, glow_tight)
    img = merged.convert("RGBA")
    sharp = ImageDraw.Draw(img)

    # Ground reflection.
    reflection = reflection.filter(ImageFilter.GaussianBlur(sc(2.2)))
    img = Image.alpha_composite(img, reflection)
    sharp = ImageDraw.Draw(img)

    # Fog sweeping over the base.
    fog2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f2 = ImageDraw.Draw(fog2)
    f2.rectangle((0, sc(760), W, sc(825)), fill=(31, 104, 118, 34))
    fog2 = fog2.filter(ImageFilter.GaussianBlur(sc(18)))
    img = Image.alpha_composite(img, fog2)
    sharp = ImageDraw.Draw(img)

    # HUD frame.
    frame_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame_layer)
    fd.rectangle((sc(36), sc(34), sc(1564), sc(866)), outline=(82, 246, 255, 30), width=sc(0.7))
    for x, y, sx, sy in [
        (36, 34, 1, 1),
        (1564, 34, -1, 1),
        (36, 866, 1, -1),
        (1564, 866, -1, -1),
    ]:
        fd.line([(sc(x), sc(y)), (sc(x + 46 * sx), sc(y))], fill=(82, 246, 255, 160), width=sc(1))
        fd.line([(sc(x), sc(y)), (sc(x), sc(y + 46 * sy))], fill=(82, 246, 255, 160), width=sc(1))
    img = Image.alpha_composite(img, frame_layer)
    sharp = ImageDraw.Draw(img)

    # Typography.
    display = font(DISPLAY_PATH, 162, "SemiBold")
    display_small = font(DISPLAY_PATH, 110, "SemiBold")
    display_tiny = font(DISPLAY_PATH, 28, "SemiBold")
    mono = font(MONO_PATH, 11)
    mono_small = font(MONO_PATH, 9)
    mono_bold = font(MONO_BOLD_PATH, 10)
    cjk = font(CJK_PATH, 19)

    # Logo mark.
    mark_cx, mark_cy = 95, 92
    mark_r = 23
    mark_pts = []
    for i in range(6):
        angle = -math.pi / 2 + i * math.pi / 3
        mark_pts.append((sc(mark_cx + math.cos(angle) * mark_r), sc(mark_cy + math.sin(angle) * mark_r)))
    sharp.line(mark_pts + [mark_pts[0]], fill=(*CYAN, 225), width=sc(1.2))
    sharp.line(
        [(sc(mark_cx - 8), sc(mark_cy - 10)), (sc(mark_cx + 8), sc(mark_cy - 10)), (sc(mark_cx + 8), sc(mark_cy)), (sc(mark_cx - 8), sc(mark_cy)), (sc(mark_cx - 8), sc(mark_cy + 11)), (sc(mark_cx + 9), sc(mark_cy + 11))],
        fill=(*CYAN, 230), width=sc(1.6),
    )
    gw.ellipse((sc(mark_cx - 32), sc(mark_cy - 32), sc(mark_cx + 32), sc(mark_cy + 32)), outline=CYAN, width=sc(3))

    track_text(sharp, (sc(136), sc(63)), "STARK INDUSTRIES", mono_bold, (197, 243, 248, 225), tracking=1.7)
    track_text(sharp, (sc(136), sc(83)), "STRUCTURAL DIVISION // ARC OS 9.4", mono_small, (96, 132, 145, 235), tracking=1.0)
    track_text(sharp, (sc(136), sc(99)), "NIGHT CITY // SECTOR 07", mono_small, (214, 58, 155, 220), tracking=1.0)

    # Upper-right telemetry.
    track_text(sharp, (sc(1262), sc(60)), "LIVE SIMULATION", mono_bold, (166, 255, 239, 210), tracking=1.3)
    sharp.ellipse((sc(1249), sc(63), sc(1255), sc(69)), fill=(126, 255, 209, 230))
    track_text(sharp, (sc(1262), sc(80)), "40.7484 N / 73.9857 W", mono_small, (91, 134, 146, 230), tracking=0.8)
    track_text(sharp, (sc(1262), sc(96)), "WEBGL 2 / ARC CORE ONLINE", mono_small, (91, 134, 146, 230), tracking=0.8)

    # Main title.
    title_y = 233
    # Glow behind title.
    gw.text((sc(81), sc(title_y)), "STARK", font=display, fill=(23, 118, 130))
    sharp.text((sc(82), sc(title_y)), "STARK", font=display, fill=(240, 255, 255, 255))

    # Outline TOWER.
    outline_face = font(DISPLAY_PATH, 110, "SemiBold")
    sharp.text((sc(86), sc(365)), "TOWER", font=outline_face, fill=(2, 7, 12, 255), stroke_width=sc(1.2), stroke_fill=(*CYAN, 210))
    gw.text((sc(86), sc(365)), "TOWER", font=outline_face, fill=(9, 86, 97), stroke_width=sc(2), stroke_fill=(18, 106, 116))
    gt.text((sc(86), sc(365)), "TOWER", font=outline_face, fill=(7, 47, 55), stroke_width=sc(1.2), stroke_fill=CYAN)

    neon_line([(sc(86), sc(503)), (sc(455), sc(503))], CYAN, 0.8, 5)
    sharp.rectangle((sc(86), sc(520), sc(116), sc(522)), fill=(*MAGENTA, 180))

    sharp.text((sc(86), sc(550)), "赛博朋克 · 程序化斯塔克大厦", font=cjk, fill=(202, 242, 247, 220))
    track_text(sharp, (sc(86), sc(586)), "PROCEDURAL SKYSCRAPER // GLASS / NEON / RAIN", mono, (106, 151, 163, 235), tracking=1.2)
    track_text(sharp, (sc(86), sc(605)), "REACT 19 + R3F + DREI + THREE.JS", mono_small, (103, 137, 150, 235), tracking=0.8)

    # Small control hint chips.
    chips = [
        ("1,752", "INSTANCED WINDOWS"),
        ("24H", "LIGHT CYCLE"),
        ("GPU", "RAIN SHADER"),
    ]
    chip_x = 86
    for i, (value, label) in enumerate(chips):
        sharp.text((sc(chip_x), sc(670)), value, font=font(DISPLAY_PATH, 20, "SemiBold"), fill=(223, 255, 255, 235))
        track_text(sharp, (sc(chip_x), sc(699)), label, mono_small, (91, 133, 145, 230), tracking=0.8)
        neon_line([(sc(chip_x), sc(729)), (sc(chip_x + 60), sc(729))], (32, 101, 113), 0.6, 3)
        chip_x += 171

    # Lower HUD strip.
    track_text(sharp, (sc(86), sc(804)), "LOCAL TIME 21:36", mono_small, (147, 210, 218, 230), tracking=0.8)
    track_text(sharp, (sc(248), sc(804)), "FOG 4.2", mono_small, (147, 210, 218, 230), tracking=0.8)
    track_text(sharp, (sc(342), sc(804)), "BLOOM 1.35 / 0.55", mono_small, (147, 210, 218, 230), tracking=0.8)
    track_text(sharp, (sc(530), sc(804)), "AUTO ORBIT .55X", mono_small, (147, 210, 218, 230), tracking=0.8)
    track_text(sharp, (sc(1260), sc(804)), "CONCEPT KEY ART // PROCEDURAL STUDY", mono_small, (72, 102, 115, 230), tracking=0.8)

    # Fine scanline pattern + grain.
    scan = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd2 = ImageDraw.Draw(scan)
    for y in range(0, H, sc(4)):
        sd2.line([(0, y), (W, y)], fill=(141, 255, 255, 8))
    img = Image.alpha_composite(img, scan)

    grain = np_rng.normal(0, 5.2, (H, W, 1)).repeat(3, axis=2)
    grain = np.clip(grain + 128, 0, 255).astype(np.uint8)
    grain_img = Image.fromarray(grain, "RGB").convert("RGBA")
    grain_img.putalpha(11)
    img = Image.alpha_composite(img, grain_img)

    # Downsample and save.
    img = img.convert("RGB").resize((1600, 900), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
