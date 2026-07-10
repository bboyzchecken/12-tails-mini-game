#!/usr/bin/env python3
"""Generate PLACEHOLDER assets for 12Tails Chat (Phase 1).

Outputs:
  client/public/assets/maps/tileset.png        8-tile tileset (32px)
  client/public/assets/maps/novice-camp.json   Tiled orthogonal map + collision
  client/public/assets/characters/novice/sheet.png   5x4 char sheet (64px)

These are throwaway art so coding isn't blocked. Swap in real assets later
(keep the same layout: tileset = 32px tiles, sheet = 5 cols x 4 rows @ 64px).
Re-run:  python3 tools/gen-placeholders/gen.py
"""
import os, json, random
from PIL import Image, ImageDraw

random.seed(12)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MAPS = os.path.join(ROOT, "client", "public", "assets", "maps")
CHARS = os.path.join(ROOT, "client", "public", "assets", "characters", "novice")
os.makedirs(MAPS, exist_ok=True)
os.makedirs(CHARS, exist_ok=True)

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

# 0 grass
x = 0 * T
d.rectangle([x, 0, x + T - 1, T - 1], fill=(74, 124, 58, 255))
speck(d, x, (64, 110, 50, 255), 24)
# 1 dirt path
x = 1 * T
d.rectangle([x, 0, x + T - 1, T - 1], fill=(150, 116, 70, 255))
speck(d, x, (128, 96, 56, 255), 24)
# 2 water (collides)
x = 2 * T
d.rectangle([x, 0, x + T - 1, T - 1], fill=(58, 110, 165, 255))
d.line([x + 4, 9, x + 27, 9], fill=(120, 175, 220, 255))
d.line([x + 3, 20, x + 24, 20], fill=(120, 175, 220, 255))
# 3 fence (collides) — transparent bg, wooden fence
x = 3 * T
wood, wood_d = (128, 88, 48, 255), (94, 62, 34, 255)
d.rectangle([x + 5, 3, x + 11, 30], fill=wood)
d.rectangle([x + 21, 3, x + 27, 30], fill=wood)
d.rectangle([x + 2, 9, x + 30, 13], fill=wood_d)
d.rectangle([x + 2, 21, x + 30, 25], fill=wood_d)
# 4 tree (collides) — transparent bg
x = 4 * T
d.rectangle([x + 14, 20, x + 18, 31], fill=(102, 68, 40, 255))
d.ellipse([x + 3, 1, x + 29, 25], fill=(47, 107, 43, 255))
d.ellipse([x + 8, 4, x + 22, 17], fill=(63, 133, 57, 255))
# 5 tent (collides) — transparent bg
x = 5 * T
d.polygon([(x + 16, 3), (x + 3, 30), (x + 29, 30)], fill=(181, 72, 47, 255))
d.polygon([(x + 16, 3), (x + 16, 30), (x + 29, 30)], fill=(150, 55, 35, 255))
d.polygon([(x + 16, 13), (x + 12, 30), (x + 20, 30)], fill=(58, 34, 24, 255))
# 6 flower — transparent bg (sits over grass)
x = 6 * T
for fx, fy, c in [(9, 11, (235, 214, 84)), (21, 19, (222, 92, 122)), (14, 24, (198, 120, 222))]:
    d.ellipse([x + fx - 3, fy - 3, x + fx + 3, fy + 3], fill=c + (255,))
    d.point((x + fx, fy), fill=(60, 50, 20, 255))
# 7 sand
x = 7 * T
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

# dirt roads (cross through the middle)
for xx in range(W):
    ground[9][xx] = DIRT
for yy in range(H):
    ground[yy][12] = DIRT

# pond (sand ring + water) top-right
for yy in range(2, 7):
    for xx in range(17, 23):
        ground[yy][xx] = SAND
for yy in range(3, 6):
    for xx in range(18, 22):
        ground[yy][xx] = WATER

# fence border with gate openings where the roads meet the edge
for xx in range(W):
    if xx != 12:
        objects[0][xx] = FENCE
        objects[H - 1][xx] = FENCE
for yy in range(H):
    if yy != 9:
        objects[yy][0] = FENCE
        objects[yy][W - 1] = FENCE

# trees
for tx, ty in [(3, 3), (6, 3), (16, 3), (4, 6), (8, 15), (20, 15), (22, 13), (19, 16), (3, 12), (22, 7)]:
    objects[ty][tx] = TREE
# tents (the camp)
for tx, ty in [(3, 7), (5, 7), (4, 11)]:
    objects[ty][tx] = TENT
# flowers (decor)
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
        # tile ids are 0-based within the tileset (id = gid - 1)
        "tiles": [
            {"id": i, "properties": [{"name": "collides", "type": "bool", "value": True}]}
            for i in (2, 3, 4, 5)  # water, fence, tree, tent
        ],
    }],
    "layers": [layer("ground", 1, ground), layer("objects", 2, objects)],
}

with open(os.path.join(MAPS, "novice-camp.json"), "w") as f:
    json.dump(tmap, f, indent=1)


# --------------------------------------------------------------------------
# sheet.png  (5 cols x 4 rows @ 64px).  rows: down, up, left, right
#   col 0 = idle, cols 1..4 = walk cycle
# --------------------------------------------------------------------------
def draw_char(d, ox, oy, direction, phase):
    hx, hy = ox + 32, oy + 22
    r = 13
    tunic = (232, 150, 60, 255)
    skin = (240, 205, 160, 255)
    ear = (210, 170, 130, 255)
    dark = (40, 30, 25, 255)
    snout = (60, 45, 40, 255)

    # shadow
    d.ellipse([ox + 18, oy + 50, ox + 46, oy + 60], fill=(0, 0, 0, 60))

    # feet (bob up/down across the walk cycle)
    fs = 0 if phase is None else [4, 0, -4, 0][phase]
    d.rectangle([ox + 23, oy + 50 - fs, ox + 29, oy + 58 - fs], fill=dark)
    d.rectangle([ox + 35, oy + 50 + fs, ox + 41, oy + 58 + fs], fill=dark)

    # torso
    d.ellipse([ox + 18, oy + 28, ox + 46, oy + 54], fill=tunic)

    # ears + head
    d.polygon([(hx - 11, hy - 8), (hx - 4, hy - 18), (hx - 2, hy - 6)], fill=ear)
    d.polygon([(hx + 11, hy - 8), (hx + 4, hy - 18), (hx + 2, hy - 6)], fill=ear)
    d.ellipse([hx - r, hy - r, hx + r, hy + r], fill=skin)

    # face by facing direction
    if direction == "down":
        d.ellipse([hx - 7, hy - 3, hx - 3, hy + 1], fill=dark)
        d.ellipse([hx + 3, hy - 3, hx + 7, hy + 1], fill=dark)
        d.ellipse([hx - 3, hy + 3, hx + 3, hy + 8], fill=snout)
    elif direction == "up":
        d.chord([hx - r, hy - r, hx + r, hy + r], 200, 340, fill=(150, 110, 70, 255))
    elif direction == "left":
        d.ellipse([hx - 8, hy - 2, hx - 4, hy + 2], fill=dark)
        d.ellipse([hx - 2, hy - 2, hx + 2, hy + 2], fill=dark)
        d.ellipse([hx - 11, hy + 2, hx - 5, hy + 7], fill=snout)
    elif direction == "right":
        d.ellipse([hx + 4, hy - 2, hx + 8, hy + 2], fill=dark)
        d.ellipse([hx - 2, hy - 2, hx + 2, hy + 2], fill=dark)
        d.ellipse([hx + 5, hy + 2, hx + 11, hy + 7], fill=snout)


sheet = Image.new("RGBA", (320, 256), (0, 0, 0, 0))
sd = ImageDraw.Draw(sheet)
for row, direction in enumerate(["down", "up", "left", "right"]):
    for col in range(5):
        draw_char(sd, col * 64, row * 64, direction, None if col == 0 else col - 1)
sheet.save(os.path.join(CHARS, "sheet.png"))

# a thumbnail (down-idle, 2x) for the Phase 2 character select
sheet.crop((0, 0, 64, 64)).resize((128, 128), Image.NEAREST).save(os.path.join(CHARS, "thumb.png"))

print("wrote:")
print(" ", os.path.relpath(os.path.join(MAPS, "tileset.png"), ROOT))
print(" ", os.path.relpath(os.path.join(MAPS, "novice-camp.json"), ROOT))
print(" ", os.path.relpath(os.path.join(CHARS, "sheet.png"), ROOT))
print(" ", os.path.relpath(os.path.join(CHARS, "thumb.png"), ROOT))
