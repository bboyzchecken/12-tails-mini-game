#!/usr/bin/env python3
"""
Import directly-usable 2D assets from the ripped Unity project into the web app,
for ALL 12 heroes:

  - assets/characters/<id>/thumb.png : portrait (gamegui/icons/playeravatar/avatar_<Hero>.png)
  - assets/models/<id>-face.png      : default face overlay (armors/overlay/<Hero>0.png),
                                       composited onto the body texture by the 3D client
  - assets/ui/emote-faces.png        : shared 8-emote chat strip (emotion bubble PNGs)

The 3D body models (assets/models/<id>.glb) come from Unity via the
BatchCharacterExporter menu; this tool does not touch them.

Usage:
  python build.py [RIPPER_ASSETS_DIR]
Default RIPPER_ASSETS_DIR = D:/12tails/12tail_ripper/mainData/Assets
"""
import os
import sys
from PIL import Image

RIPPER = sys.argv[1] if len(sys.argv) > 1 else "D:/12tails/12tail_ripper/mainData/Assets"
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CLIENT_ASSETS = os.path.join(REPO, "client", "public", "assets")

EMO_DIR = os.path.join(RIPPER, "Resources/gameassets/effects/emotion/assets/materials")
EMO_ICON_DIR = os.path.join(RIPPER, "Resources/gamegui/icons/skills/emotion")
AVATAR_DIR = os.path.join(RIPPER, "Resources/gamegui/icons/playeravatar")
HEROES_DIR = os.path.join(RIPPER, "Resources/gameassets/characters/heroes")

FACE_SIZE = 96  # must match characters.json face.w / face.h

# The 12 heroes: web character id == rip folder name; prefab/avatar names capitalized.
HEROES = ["wolf", "sheep", "bat", "bison", "cat", "chameleon",
          "mole", "monkey", "panda", "penguin", "rabbit", "whale"]

# web emote slot -> game emote-bubble filename (order matters, matches face.emotes)
EMOTE_MAP = [
    ("neutral", "smile.png"),
    ("happy", "happy.png"),
    ("angry", "angry.png"),
    ("sad", "sad.png"),
    ("surprised", "exclaim.png"),
    ("laugh", "haha.png"),
    ("cry", "tear.png"),
    ("love", "heart.png"),
]


def build_emote_strip():
    sheet = Image.new("RGBA", (FACE_SIZE * len(EMOTE_MAP), FACE_SIZE), (0, 0, 0, 0))
    for i, (_slot, fname) in enumerate(EMOTE_MAP):
        emo = Image.open(os.path.join(EMO_DIR, fname)).convert("RGBA")
        if emo.size != (FACE_SIZE, FACE_SIZE):
            emo = emo.resize((FACE_SIZE, FACE_SIZE), Image.LANCZOS)
        sheet.paste(emo, (i * FACE_SIZE, 0), emo)
    out = os.path.join(CLIENT_ASSETS, "ui")
    os.makedirs(out, exist_ok=True)
    sheet.save(os.path.join(out, "emote-faces.png"))
    print(f"  ui/emote-faces.png ({sheet.width}x{sheet.height})")


def build_hero(hero: str):
    cap = hero.capitalize()

    thumb_dir = os.path.join(CLIENT_ASSETS, "characters", hero)
    os.makedirs(thumb_dir, exist_ok=True)
    avatar = Image.open(os.path.join(AVATAR_DIR, f"avatar_{cap}.png")).convert("RGBA")
    avatar.save(os.path.join(thumb_dir, "thumb.png"))

    models_dir = os.path.join(CLIENT_ASSETS, "models")
    os.makedirs(models_dir, exist_ok=True)
    overlay_src = os.path.join(HEROES_DIR, hero, "armors", "overlay", f"{cap}0.png")
    ok = os.path.exists(overlay_src)
    if ok:
        Image.open(overlay_src).convert("RGBA").save(
            os.path.join(models_dir, f"{hero}-face.png"))
    print(f"  {hero}: thumb OK  overlay {'OK' if ok else 'MISSING'}")


def build_emote_system():
    """Full emote set: framed picker icons (gamegui) + overhead bubbles (effects)."""
    import shutil

    icons_out = os.path.join(CLIENT_ASSETS, "ui", "emote-icons")
    os.makedirs(icons_out, exist_ok=True)
    n_icons = 0
    for f in sorted(os.listdir(EMO_ICON_DIR)):
        if f.endswith(".png"):
            shutil.copyfile(os.path.join(EMO_ICON_DIR, f), os.path.join(icons_out, f))
            n_icons += 1

    bubbles_out = os.path.join(CLIENT_ASSETS, "ui", "bubbles")
    os.makedirs(bubbles_out, exist_ok=True)
    n_bub = 0
    for f in sorted(os.listdir(EMO_DIR)):
        if f.endswith(".png") and f != "disarm.png":  # disarm is a 32px system icon
            shutil.copyfile(os.path.join(EMO_DIR, f), os.path.join(bubbles_out, f))
            n_bub += 1
    print(f"  ui/emote-icons ({n_icons} framed) + ui/bubbles ({n_bub} bubbles)")


def main():
    build_emote_strip()
    build_emote_system()
    for hero in HEROES:
        build_hero(hero)
    print("Done. glb bodies come from Unity's [12Tails > Export All Heroes To GLB].")


if __name__ == "__main__":
    main()
