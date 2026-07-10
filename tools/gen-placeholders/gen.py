#!/usr/bin/env python3
"""Generate PLACEHOLDER assets for 12Tails Chat (Phases 1-2).

Outputs:
  client/public/assets/maps/tileset.png            8-tile tileset (32px)
  client/public/assets/maps/novice-camp.json       Tiled orthogonal map + collision
  client/public/assets/characters/<id>/sheet.png   5x4 char sheet (64px)
  client/public/assets/characters/<id>/faces.png   8x1 emote faces (96px)
  client/public/assets/characters/<id>/thumb.png   portrait (128px)

Characters: dog + sheep (see 12tails-add-characters-dog-sheep.md).
These are throwaway art so coding isn't blocked. Swap in real assets later,
keeping the same layout. Re-run:  python3 tools/gen-placeholders/gen.py
"""
import os, json, random, shutil
from PIL import Image, ImageDraw

random.seed(12)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MAPS = os.path.join(ROOT, "client", "public", "assets", "maps")
CHARS_DIR = os.path.join(ROOT, "client", "public", "assets", "characters")
os.makedirs(MAPS, exist_ok=True)
os.makedirs(CHARS_DIR, exist_ok=True)

T = 32  # tile size


# --------------------------------------------------------------------------
# tileset.png  (8 tiles in a row).  gid = index + 1
#   0 grass  1 dirt  2 water*  3 fence*  4 tree*  5 tent*  6 flower  7 sand
#   * = collides
# --------------------------------------------------------------------------
def speck(d, x0, base, n=20):
    for _ in range(n):
        d.point((random.randint(x0, x0 + T - 1), random.randint(0, T - 1)), fill=base)


tiles = Image.new("RGBA", (T * 8, T), (0, 0, 0, 0))
d = ImageDraw.Draw(tiles)

x = 0 * T  # grass
d.rectangle([x, 0, x + T - 1, T - 1], fill=(74, 124, 58, 255))
speck(d, x, (64, 110, 50, 255), 24)
x = 1 * T  # dirt path
d.rectangle([x, 0, x + T - 1, T - 1], fill=(150, 116, 70, 255))
speck(d, x, (128, 96, 56, 255), 24)
x = 2 * T  # water (collides)
d.rectangle([x, 0, x + T - 1, T - 1], fill=(58, 110, 165, 255))
d.line([x + 4, 9, x + 27, 9], fill=(120, 175, 220, 255))
d.line([x + 3, 20, x + 24, 20], fill=(120, 175, 220, 255))
x = 3 * T  # fence (collides)
wood, wood_d = (128, 88, 48, 255), (94, 62, 34, 255)
d.rectangle([x + 5, 3, x + 11, 30], fill=wood)
d.rectangle([x + 21, 3, x + 27, 30], fill=wood)
d.rectangle([x + 2, 9, x + 30, 13], fill=wood_d)
d.rectangle([x + 2, 21, x + 30, 25], fill=wood_d)
x = 4 * T  # tree (collides)
d.rectangle([x + 14, 20, x + 18, 31], fill=(102, 68, 40, 255))
d.ellipse([x + 3, 1, x + 29, 25], fill=(47, 107, 43, 255))
d.ellipse([x + 8, 4, x + 22, 17], fill=(63, 133, 57, 255))
x = 5 * T  # tent (collides)
d.polygon([(x + 16, 3), (x + 3, 30), (x + 29, 30)], fill=(181, 72, 47, 255))
d.polygon([(x + 16, 3), (x + 16, 30), (x + 29, 30)], fill=(150, 55, 35, 255))
d.polygon([(x + 16, 13), (x + 12, 30), (x + 20, 30)], fill=(58, 34, 24, 255))
x = 6 * T  # flower
for fx, fy, c in [(9, 11, (235, 214, 84)), (21, 19, (222, 92, 122)), (14, 24, (198, 120, 222))]:
    d.ellipse([x + fx - 3, fy - 3, x + fx + 3, fy + 3], fill=c + (255,))
    d.point((x + fx, fy), fill=(60, 50, 20, 255))
x = 7 * T  # sand
d.rectangle([x, 0, x + T - 1, T - 1], fill=(214, 196, 138, 255))
speck(d, x, (196, 176, 120, 255), 18)

tiles.save(os.path.join(MAPS, "tileset.png"))

# --------------------------------------------------------------------------
# novice-camp.json  (25 x 19 orthogonal Tiled map)
# --------------------------------------------------------------------------
W, H = 25, 19
GRASS, DIRT, WATER, FENCE, TREE, TENT, FLOWER, SAND = 1, 2, 3, 4, 5, 6, 7, 8
ground = [[GRASS] * W for _ in range(H)]
objects = [[0] * W for _ in range(H)]

for xx in range(W):
    ground[9][xx] = DIRT
for yy in range(H):
    ground[yy][12] = DIRT
for yy in range(2, 7):
    for xx in range(17, 23):
        ground[yy][xx] = SAND
for yy in range(3, 6):
    for xx in range(18, 22):
        ground[yy][xx] = WATER
for xx in range(W):
    if xx != 12:
        objects[0][xx] = FENCE
        objects[H - 1][xx] = FENCE
for yy in range(H):
    if yy != 9:
        objects[yy][0] = FENCE
        objects[yy][W - 1] = FENCE
for tx, ty in [(3, 3), (6, 3), (16, 3), (4, 6), (8, 15), (20, 15), (22, 13), (19, 16), (3, 12), (22, 7)]:
    objects[ty][tx] = TREE
for tx, ty in [(3, 7), (5, 7), (4, 11)]:
    objects[ty][tx] = TENT
for tx, ty in [(7, 11), (9, 7), (15, 12), (17, 7), (10, 14), (14, 4)]:
    objects[ty][tx] = FLOWER


def layer(name, idx, grid):
    return {
        "type": "tilelayer", "id": idx, "name": name,
        "width": W, "height": H, "x": 0, "y": 0,
        "opacity": 1, "visible": True,
        "data": [g for row in grid for g in row],
    }


tmap = {
    "type": "map", "version": "1.10", "tiledversion": "1.10.2",
    "orientation": "orthogonal", "renderorder": "right-down",
    "width": W, "height": H, "tilewidth": T, "tileheight": T,
    "infinite": False, "nextlayerid": 3, "nextobjectid": 1,
    "tilesets": [{
        "firstgid": 1, "name": "novice-camp", "image": "tileset.png",
        "imagewidth": T * 8, "imageheight": T,
        "tilewidth": T, "tileheight": T,
        "tilecount": 8, "columns": 8, "margin": 0, "spacing": 0,
        "tiles": [
            {"id": i, "properties": [{"name": "collides", "type": "bool", "value": True}]}
            for i in (2, 3, 4, 5)
        ],
    }],
    "layers": [layer("ground", 1, ground), layer("objects", 2, objects)],
}
with open(os.path.join(MAPS, "novice-camp.json"), "w") as f:
    json.dump(tmap, f, indent=1)


# --------------------------------------------------------------------------
# Character sheets / faces / thumbs
# --------------------------------------------------------------------------
DARK = (40, 30, 25, 255)
WHITE = (245, 245, 245, 255)

CHAR_CFG = {
    "dog": {
        "style": "dog",
        "body": (200, 161, 101, 255),   # #C8A165
        "ear": (150, 110, 66, 255),
        "skin": (232, 205, 168, 255),
        "eye": DARK,
        "snout": (70, 50, 40, 255),
    },
    "sheep": {
        "style": "sheep",
        "body": (232, 228, 218, 255),   # #E8E4DA
        "wool": (247, 245, 240, 255),
        "ear": (185, 176, 166, 255),
        "skin": (72, 68, 74, 255),      # dark sheep face
        "eye": WHITE,
        "snout": (120, 115, 122, 255),
    },
}


def head_base(d, hx, hy, r, cfg):
    """Draw ears/wool + head circle; returns nothing."""
    if cfg["style"] == "dog":
        d.ellipse([hx - 18, hy - 6, hx - 8, hy + 12], fill=cfg["ear"])   # floppy ears
        d.ellipse([hx + 8, hy - 6, hx + 18, hy + 12], fill=cfg["ear"])
        d.ellipse([hx - r, hy - r, hx + r, hy + r], fill=cfg["skin"])
    else:  # sheep
        for bx, by in [(-12, -6), (-8, -14), (0, -16), (8, -14), (12, -6), (-13, 5), (13, 5)]:
            d.ellipse([hx + bx - 7, hy + by - 7, hx + bx + 7, hy + by + 7], fill=cfg["wool"])
        d.ellipse([hx - 16, hy - 2, hx - 9, hy + 4], fill=cfg["ear"])
        d.ellipse([hx + 9, hy - 2, hx + 16, hy + 4], fill=cfg["ear"])
        d.ellipse([hx - r, hy - r, hx + r, hy + r], fill=cfg["skin"])


def draw_char(d, ox, oy, direction, phase, cfg):
    hx, hy, r = ox + 32, oy + 22, 13
    eye, snout = cfg["eye"], cfg["snout"]

    d.ellipse([ox + 18, oy + 50, ox + 46, oy + 60], fill=(0, 0, 0, 60))  # shadow
    fs = 0 if phase is None else [4, 0, -4, 0][phase]
    d.rectangle([ox + 23, oy + 50 - fs, ox + 29, oy + 58 - fs], fill=DARK)  # feet
    d.rectangle([ox + 35, oy + 50 + fs, ox + 41, oy + 58 + fs], fill=DARK)
    d.ellipse([ox + 18, oy + 28, ox + 46, oy + 54], fill=cfg["body"])       # torso

    head_base(d, hx, hy, r, cfg)

    if direction == "down":
        d.ellipse([hx - 7, hy - 3, hx - 3, hy + 1], fill=eye)
        d.ellipse([hx + 3, hy - 3, hx + 7, hy + 1], fill=eye)
        d.ellipse([hx - 3, hy + 3, hx + 3, hy + 8], fill=snout)
    elif direction == "up":
        d.chord([hx - r, hy - r, hx + r, hy + r], 200, 340, fill=cfg["ear"])
    elif direction == "left":
        d.ellipse([hx - 8, hy - 2, hx - 4, hy + 2], fill=eye)
        d.ellipse([hx - 2, hy - 2, hx + 2, hy + 2], fill=eye)
        d.ellipse([hx - 11, hy + 2, hx - 5, hy + 7], fill=snout)
    elif direction == "right":
        d.ellipse([hx + 4, hy - 2, hx + 8, hy + 2], fill=eye)
        d.ellipse([hx - 2, hy - 2, hx + 2, hy + 2], fill=eye)
        d.ellipse([hx + 5, hy + 2, hx + 11, hy + 7], fill=snout)


def draw_face(d, ox, oy, emote, cfg):
    """96x96 emote portrait — rough placeholder expressions."""
    cx, cy, r = ox + 48, oy + 50, 34
    eye = cfg["eye"]
    # ears/wool scaled up a touch
    if cfg["style"] == "dog":
        d.ellipse([cx - 44, cy - 16, cx - 20, cy + 26], fill=cfg["ear"])
        d.ellipse([cx + 20, cy - 16, cx + 44, cy + 26], fill=cfg["ear"])
    else:
        for bx, by in [(-30, -14), (-18, -32), (0, -38), (18, -32), (30, -14), (-32, 10), (32, 10)]:
            d.ellipse([cx + bx - 16, cy + by - 16, cx + bx + 16, cy + by + 16], fill=cfg["wool"])
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=cfg["skin"])

    lx, rx, ey = cx - 12, cx + 12, cy - 6

    def dot(x, y, rr=4):
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=eye)

    def mouth_smile(up=True):
        if up:
            d.arc([cx - 12, cy + 2, cx + 12, cy + 20], 20, 160, fill=eye, width=3)
        else:
            d.arc([cx - 12, cy + 12, cx + 12, cy + 30], 200, 340, fill=eye, width=3)

    if emote == "neutral":
        dot(lx, ey); dot(rx, ey)
        d.line([cx - 8, cy + 12, cx + 8, cy + 12], fill=eye, width=3)
    elif emote == "happy":
        dot(lx, ey); dot(rx, ey); mouth_smile(True)
    elif emote == "angry":
        dot(lx, ey); dot(rx, ey)
        d.line([lx - 6, ey - 8, lx + 6, ey - 3], fill=eye, width=3)
        d.line([rx + 6, ey - 8, rx - 6, ey - 3], fill=eye, width=3)
        mouth_smile(False)
        d.ellipse([cx + 20, cy - 30, cx + 30, cy - 20], fill=(220, 70, 60, 255))
    elif emote == "sad":
        dot(lx, ey); dot(rx, ey); mouth_smile(False)
        d.ellipse([lx - 3, ey + 8, lx + 3, ey + 18], fill=(90, 160, 230, 255))
    elif emote == "surprised":
        d.ellipse([lx - 6, ey - 6, lx + 6, ey + 6], outline=eye, width=3)
        d.ellipse([rx - 6, ey - 6, rx + 6, ey + 6], outline=eye, width=3)
        d.ellipse([cx - 6, cy + 8, cx + 6, cy + 22], fill=eye)
    elif emote == "laugh":
        d.arc([lx - 7, ey - 2, lx + 7, ey + 10], 200, 340, fill=eye, width=3)
        d.arc([rx - 7, ey - 2, rx + 7, ey + 10], 200, 340, fill=eye, width=3)
        d.chord([cx - 13, cy + 2, cx + 13, cy + 24], 0, 180, fill=(180, 70, 70, 255))
    elif emote == "cry":
        d.arc([lx - 7, ey - 2, lx + 7, ey + 10], 20, 160, fill=eye, width=3)
        d.arc([rx - 7, ey - 2, rx + 7, ey + 10], 20, 160, fill=eye, width=3)
        d.ellipse([lx - 3, ey + 8, lx + 3, ey + 20], fill=(90, 160, 230, 255))
        d.ellipse([rx - 3, ey + 8, rx + 3, ey + 20], fill=(90, 160, 230, 255))
        mouth_smile(False)
    elif emote == "love":
        for hx0 in (lx, rx):
            d.ellipse([hx0 - 6, ey - 4, hx0 - 1, ey + 1], fill=(230, 80, 120, 255))
            d.ellipse([hx0 + 1, ey - 4, hx0 + 6, ey + 1], fill=(230, 80, 120, 255))
            d.polygon([(hx0 - 6, ey - 1), (hx0 + 6, ey - 1), (hx0, ey + 8)], fill=(230, 80, 120, 255))
        mouth_smile(True)


EMOTES = ["neutral", "happy", "angry", "sad", "surprised", "laugh", "cry", "love"]

# clear any stale character folders (e.g. the old "novice")
for old in os.listdir(CHARS_DIR):
    p = os.path.join(CHARS_DIR, old)
    if os.path.isdir(p) and old not in CHAR_CFG:
        shutil.rmtree(p)

for cid, cfg in CHAR_CFG.items():
    outdir = os.path.join(CHARS_DIR, cid)
    os.makedirs(outdir, exist_ok=True)

    sheet = Image.new("RGBA", (320, 256), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheet)
    for row, direction in enumerate(["down", "up", "left", "right"]):
        for col in range(5):
            draw_char(sd, col * 64, row * 64, direction, None if col == 0 else col - 1, cfg)
    sheet.save(os.path.join(outdir, "sheet.png"))

    faces = Image.new("RGBA", (768, 96), (0, 0, 0, 0))
    fd = ImageDraw.Draw(faces)
    for i, emote in enumerate(EMOTES):
        draw_face(fd, i * 96, 0, emote, cfg)
    faces.save(os.path.join(outdir, "faces.png"))

    sheet.crop((0, 0, 64, 64)).resize((128, 128), Image.NEAREST).save(os.path.join(outdir, "thumb.png"))

print("wrote maps + characters:", ", ".join(CHAR_CFG))
