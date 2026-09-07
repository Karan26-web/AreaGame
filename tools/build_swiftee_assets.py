#!/usr/bin/env python3
"""
Build the game's Swiftee character assets from the Swiftee sprite pack.

The pack ships 82 animations as PNG8 sheets on a uniform 256px (@1x) grid with
the pivot at the exact cell centre, so any frame of any animation drops in at
the same registration.  The lesson only ever shows a handful of expressions, so
this script:

  1. copies just the clips the game asks for, re-encoded as LOSSLESS WebP
     (flat vector art with alpha: ~3x smaller than the shipped PNG8, and far
     smaller than lossy WebP, which wastes bits on the hard edges),
  2. packs one representative still per clip into a single `poster.webp` used
     as the instant, always-resident fallback while a clip streams in,
  3. measures each clip's ink box, so the runtime can scale by the character's
     real height and clear speech bubbles past its real silhouette,
  4. writes `src/components/swiftee.data.js` — the manifest as plain JS, so the
     component needs no fetch and no async boot.

Usage:
    python3 tools/build_swiftee_assets.py --pack /path/to/Swiftiee

`--pack` is the unpacked Swiftee delivery (the folder holding `atlas/`,
`spritesheets/` and `poses/`).  It is not part of this repo; only the generated
output under `assets/swiftee/` is committed.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

# ---------------------------------------------------------------- clip set --
# Every Swiftee clip the lesson can reach.  `loops` are held for as long as a
# state lasts; `intros` are one-shot lead-ins played once before their loop so
# a reaction lands as a beat rather than a jump cut.  Anything the lesson never
# asks for is deliberately absent — it would only be bytes on the wire.
LOOPS = [
    'blinking',     # standing idle, with the blink
    'flapping',     # travel
    'talking',      # explaining
    'waving',       # a wing out to one side: directing attention
    'happy',        # a small yes
    'celebrating',  # a big yes
    'excited',      # delight
    'curious',
    'confused',     # "not quite" — Swiftee has no sad pose, and a lesson wants none
    'surprised',    # the "oh!" beat
    'thinking',
    'focussed',     # concentration, used while measuring
    'proud',
    'confident',    # determination
    'playful',      # the wink / the knowing hint
    'listening',    # the hand-over to the learner
]

INTROS = [
    'wave_start', 'happy_start', 'celebrate_start', 'surprised_start',
    'confused_start', 'talk_start', 'playful_start', 'proud_start',
]

ALL_CLIPS = LOOPS + INTROS


def ink_box(sheet_path, meta):
    """Union of every frame's opaque bounds, as fractions of the cell."""
    img = Image.open(sheet_path).convert('RGBA')
    cell, cols = meta['cell'], meta['cols']
    box = None
    for i in range(meta['frames']):
        c, r = i % cols, i // cols
        b = img.crop((c * cell, r * cell, (c + 1) * cell, (r + 1) * cell)).getbbox()
        if not b:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    return [round(v / cell, 4) for v in box]


def cwebp(src, dst, args):
    subprocess.run(['cwebp', '-quiet'] + args + [src, '-o', dst], check=True)
    return os.path.getsize(dst)


def build_poster(pack, out_dir, cell):
    """One representative still per loop clip, on the same uniform grid.

    The pack's own `poses/png/swiftee_<clip>.png` is the pipeline's chosen
    representative frame and is already cell-aligned, so a poster cell and a
    sheet cell are interchangeable — the poster is just a coarser copy of the
    same registration, which is why it can stand in for a clip mid-load.

    Deliberately half the sheet cell: this is only ever shown for the frame or
    two before a clip decodes, so a full-resolution poster would cost more than
    every clip it covers.
    """
    cell = cell // 2
    names = sorted(LOOPS)
    cols = 4
    rows = (len(names) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
    index = {}
    for i, n in enumerate(names):
        still = Image.open(os.path.join(pack, 'poses', 'png', f'swiftee_{n}.png')).convert('RGBA')
        if still.width != cell:
            still = still.resize((cell, cell), Image.LANCZOS)
        sheet.paste(still, ((i % cols) * cell, (i // cols) * cell))
        index[n] = i
    tmp = os.path.join(tempfile.mkdtemp(), 'poster.png')
    sheet.save(tmp)
    size = cwebp(tmp, os.path.join(out_dir, 'poster.webp'), ['-lossless', '-z', '6', '-alpha_filter', 'best'])
    return {'file': 'poster.webp', 'cell': cell, 'cols': cols, 'rows': rows, 'index': index}, size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pack', required=True, help='unpacked Swiftee delivery')
    ap.add_argument('--scale', default='1x', choices=['1x', '2x'])
    ap.add_argument('--out', default='assets/swiftee')
    ap.add_argument('--data', default='src/components/swiftee.data.js')
    a = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pack = os.path.abspath(a.pack)
    out_dir = os.path.join(root, a.out)

    man = json.load(open(os.path.join(pack, 'atlas', 'swiftee.manifest.json')))
    sheets = man['scales'][a.scale]['sheets']

    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        os.remove(os.path.join(out_dir, f))

    clips, total_png, total_webp = {}, 0, 0
    for name in ALL_CLIPS:
        m = sheets[name]
        if m.get('pages', 1) != 1:
            sys.exit(f'{name} is paged at {a.scale}; the runtime assumes one page')
        src = os.path.join(pack, f'spritesheets/{a.scale}/swiftee_{name}@{a.scale}.png')
        dst = os.path.join(out_dir, f'{name}.webp')
        png = os.path.getsize(src)
        webp = cwebp(src, dst, ['-lossless', '-z', '6', '-alpha_filter', 'best'])
        total_png += png
        total_webp += webp
        clips[name] = {
            'cols': m['cols'], 'rows': m['rows'], 'frames': m['frames'],
            'ink': ink_box(src, m),
        }
        print(f'  {name:18s} {m["frames"]:3d}f  {png/1024:7.1f} KB png -> {webp/1024:6.1f} KB webp')

    poster, poster_bytes = build_poster(pack, out_dir, sheets['blinking']['cell'])
    print(f'  {"poster":18s} {len(LOOPS):3d}p  {"":7s}    -> {poster_bytes/1024:6.1f} KB webp')

    # The standing idle defines the character's scale and its foot line: every
    # clip shares the same registration, so one measurement drives them all.
    stand = clips['blinking']['ink']
    data = {
        'dir': a.out.replace(os.sep, '/') + '/',
        'cell': sheets['blinking']['cell'],
        'fps': man['fps'],
        'foot': stand[3],           # feet, as a fraction down the cell
        'stand': stand[3] - stand[1],  # standing height, as a fraction of the cell
        'clips': clips,
        'poster': poster,
    }
    with open(os.path.join(root, a.data), 'w') as f:
        f.write('/* GENERATED by tools/build_swiftee_assets.py — do not edit by hand. */\n')
        f.write('window.NL.SwifteeData =\n')
        json.dump(data, f, indent=1, sort_keys=True)
        f.write(';\n')

    print(f'\n{len(ALL_CLIPS)} clips + poster: '
          f'{total_png/1024/1024:.2f} MB png -> {(total_webp+poster_bytes)/1024/1024:.2f} MB webp')


if __name__ == '__main__':
    main()
