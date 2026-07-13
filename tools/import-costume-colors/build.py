"""
Import per-costume COLOR atlases so the body-color swatch tints outfits too.

For every hero/costume in costume-index.json, copy the 5 color-variant body
atlases  <Cap>_<costume>1..5.png  ->  costumes/<hero>/<costume>/<0..4>.png
(raw copies, same as tools/import-2d-assets does for the nude colours).

A costume with no atlas of its own (wolf's bespoke 'novice') falls back to the
nude atlas; a costume with fewer than 5 variants pads the rest from variant 1.

Needs only Python (shutil) — the atlases are already PNGs in the rip, so this
does NOT need Unity. Run after the Unity costume export (which writes the glbs
+ costume-index.json + the flat color-1 <costume>.png).
"""
import json, os, shutil, re

RIP = "D:/12tails/12tail_export_2021/Assets/Resources/gameassets/characters/heroes"
OUT = "D:/12tails/12-tails-mini-game/client/public/assets/costumes"
INDEX = os.path.join(OUT, "costume-index.json")


def cap(hero: str) -> str:
    return hero[0].upper() + hero[1:]


def find_atlas(hero: str, costume: str, n: int):
    """Return the source atlas path for color variant n (1..5), or None."""
    mats = os.path.join(RIP, hero, "armors", "materials")
    for name in (f"{cap(hero)}_{costume}{n}.png", f"{cap(hero)}_nude{n}.png"):
        p = os.path.join(mats, name)
        if os.path.exists(p):
            return p
    return None


def main():
    with open(INDEX, encoding="utf-8") as f:
        index = json.load(f)

    total = 0
    for hero, costumes in index.items():
        for costume in costumes:
            dst_dir = os.path.join(OUT, hero, costume)
            os.makedirs(dst_dir, exist_ok=True)
            # resolve variant 1 first so we can pad missing ones with it
            first = find_atlas(hero, costume, 1)
            if first is None:
                print(f"  ! {hero}/{costume}: no atlas at all — skipped")
                continue
            for i in range(5):
                src = find_atlas(hero, costume, i + 1) or first
                shutil.copyfile(src, os.path.join(dst_dir, f"{i}.png"))
                total += 1
        print(f"  {hero}: {len(costumes)} costumes x5 colors")
    print(f"Done. {total} atlas files -> {OUT}")


if __name__ == "__main__":
    main()
