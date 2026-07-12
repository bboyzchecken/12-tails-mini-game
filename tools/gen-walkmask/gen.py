#!/usr/bin/env python3
"""
Generate a walkability mask for the 3D map.

Reads the exported map glb, classifies triangles into walkable floor
(upward-facing, near the y=0 walk plane) and blockers (anything crossing the
player's torso band: tent cloth, walls, rocks, trees, the palace...), then
rasterizes both onto a grid. Output:

  client/public/assets/maps3d/walkmask.png   (white = walkable)
  client/public/assets/maps3d/walkmask.json  ({originX, originZ, cell})

The client (World3D) samples this to block movement — no physics engine.
Cells default to 0.25 world units. Water (river) is excluded from the floor
by mesh name, so the bridge is the only way across.

Usage:
  python gen.py [map.glb] [--out DIR]
Defaults: map = client/public/assets/models/map-night.glb, out = client/public/assets/maps3d
"""
import json
import os
import struct
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# --- must stay in sync with client/src/three/World3D.ts -----------------------
MAP_OFFSET_Y = -50.0
CELL = 0.25              # world units per mask cell
WALK_NORMAL_MIN_Y = 0.5  # how steep a surface can be and still be floor
WALK_BAND = (-0.8, 1.6)  # floor must sit near the walk plane (bridge included)
BLOCK_BAND = (0.35, 2.2) # triangles crossing this y-range block the torso
WATER_RE = ('river', 'water')
MARGIN_CELLS = 2

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_MAP = os.path.join(REPO, 'client/public/assets/models/map-night.glb')
DEFAULT_OUT = os.path.join(REPO, 'client/public/assets/maps3d')


def parse_glb(path):
    data = open(path, 'rb').read()
    off = 12
    gltf = None
    binchunk = b''
    while off < len(data):
        clen, ctype = struct.unpack('<I4s', data[off:off + 8])
        if ctype == b'JSON':
            gltf = json.loads(data[off + 8:off + 8 + clen])
        elif ctype == b'BIN\x00':
            binchunk = data[off + 8:off + 8 + clen]
        off += 8 + clen
    return gltf, binchunk


COMP = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_accessor(gltf, binchunk, idx):
    acc = gltf['accessors'][idx]
    bv = gltf['bufferViews'][acc['bufferView']]
    dtype = COMP[acc['componentType']]
    n = NCOMP[acc['type']]
    start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    stride = bv.get('byteStride', 0)
    itemsize = np.dtype(dtype).itemsize * n
    if stride and stride != itemsize:
        raw = np.frombuffer(binchunk, dtype=np.uint8,
                            count=stride * acc['count'], offset=start)
        raw = raw.reshape(acc['count'], stride)[:, :itemsize].tobytes()
        arr = np.frombuffer(raw, dtype=dtype)
    else:
        arr = np.frombuffer(binchunk, dtype=dtype, count=acc['count'] * n, offset=start)
    return arr.reshape(acc['count'], n) if n > 1 else arr


def local_matrix(n):
    if 'matrix' in n:
        return np.array(n['matrix'], dtype=float).reshape(4, 4).T
    t = n.get('translation', [0, 0, 0])
    x, y, z, w = n.get('rotation', [0, 0, 0, 1])
    s = n.get('scale', [1, 1, 1])
    R = np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])
    M = np.eye(4)
    M[:3, :3] = R * np.array(s)
    M[:3, 3] = t
    return M


def world_triangles(gltf, binchunk):
    """Yield (mesh_name, verts[3x3]) for every triangle in world space."""
    nodes = gltf['nodes']
    world = {}

    def walk(idx, parent):
        M = parent @ local_matrix(nodes[idx])
        world[idx] = M
        for c in nodes[idx].get('children', []):
            walk(c, M)

    for root in gltf['scenes'][gltf.get('scene', 0)]['nodes']:
        walk(root, np.eye(4))

    for idx, n in enumerate(nodes):
        if 'mesh' not in n:
            continue
        M = world[idx]
        name = n.get('name', '?')
        for prim in gltf['meshes'][n['mesh']]['primitives']:
            if prim.get('mode', 4) != 4:
                continue
            pos = read_accessor(gltf, binchunk, prim['attributes']['POSITION']).astype(float)
            if 'indices' in prim:
                ind = read_accessor(gltf, binchunk, prim['indices']).astype(np.int64)
            else:
                ind = np.arange(len(pos), dtype=np.int64)
            # world transform (positions only)
            posw = (pos @ M[:3, :3].T) + M[:3, 3]
            posw[:, 1] += MAP_OFFSET_Y
            tris = posw[ind].reshape(-1, 3, 3)
            yield name, tris


def main():
    argv = sys.argv[1:]
    out_dir = DEFAULT_OUT
    if '--out' in argv:
        i = argv.index('--out')
        out_dir = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    map_path = argv[0] if argv else DEFAULT_MAP

    gltf, binchunk = parse_glb(map_path)

    # first pass: bounds over floor-candidate geometry
    all_min = np.array([np.inf, np.inf])
    all_max = np.array([-np.inf, -np.inf])
    batches = []
    for name, tris in world_triangles(gltf, binchunk):
        batches.append((name, tris))
        xz = tris[:, :, [0, 2]].reshape(-1, 2)
        all_min = np.minimum(all_min, xz.min(axis=0))
        all_max = np.maximum(all_max, xz.max(axis=0))

    origin = np.floor(all_min / CELL) * CELL - MARGIN_CELLS * CELL
    dims = np.ceil((all_max - origin) / CELL).astype(int) + MARGIN_CELLS
    W, H = int(dims[0]), int(dims[1])
    print(f'grid {W}x{H} cells ({CELL} u/cell), origin ({origin[0]:.2f}, {origin[1]:.2f})')

    walk_img = Image.new('L', (W, H), 0)
    block_img = Image.new('L', (W, H), 0)
    dwalk = ImageDraw.Draw(walk_img)
    dblock = ImageDraw.Draw(block_img)

    n_walk = n_block = 0
    for name, tris in batches:
        is_water = any(k in name.lower() for k in WATER_RE)
        a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
        normal = np.cross(b - a, c - a)
        norm_len = np.linalg.norm(normal, axis=1)
        ok = norm_len > 1e-9
        ny = np.zeros(len(tris))
        ny[ok] = np.abs(normal[ok, 1]) / norm_len[ok]
        ymin = tris[:, :, 1].min(axis=1)
        ymax = tris[:, :, 1].max(axis=1)

        walk_sel = (ny > WALK_NORMAL_MIN_Y) & \
                   (ymin > WALK_BAND[0]) & (ymax < WALK_BAND[1])
        if is_water:
            walk_sel[:] = False
        block_sel = (ymax > BLOCK_BAND[0]) & (ymin < BLOCK_BAND[1]) & ~walk_sel

        for sel, drw, counter in ((walk_sel, dwalk, 'w'), (block_sel, dblock, 'b')):
            for tri in tris[sel]:
                pts = [((x - origin[0]) / CELL, (z - origin[1]) / CELL) for x, _y, z in tri]
                drw.polygon(pts, fill=255)
            if counter == 'w':
                n_walk += int(walk_sel.sum())
            else:
                n_block += int(block_sel.sum())

    print(f'triangles: walkable={n_walk}, blocking={n_block}')

    walk = np.array(walk_img, dtype=np.uint8)
    block = np.array(block_img, dtype=np.uint8)
    mask = np.where((walk > 0) & (block == 0), 255, 0).astype(np.uint8)

    # erode by 1 cell for player radius
    final = Image.fromarray(mask, 'L').filter(ImageFilter.MinFilter(3))

    os.makedirs(out_dir, exist_ok=True)
    final.save(os.path.join(out_dir, 'walkmask.png'))
    meta = {'originX': float(origin[0]), 'originZ': float(origin[1]),
            'cell': CELL, 'width': W, 'height': H}
    with open(os.path.join(out_dir, 'walkmask.json'), 'w') as f:
        json.dump(meta, f)
    walkable_pct = (np.array(final) > 127).mean() * 100
    print(f'saved -> {out_dir}/walkmask.png|.json  ({walkable_pct:.1f}% walkable)')


if __name__ == '__main__':
    main()
