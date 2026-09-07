# Area of a Trapezium — an interactive lesson with Nibi

A 16-stage animated maths lesson for Grade 8, played inside a small Mars
world. Zero dependencies, zero build step.

```
open index.html            # works from the file system
open index.html?skip=1     # skip the opening sequence while iterating
# or, if you prefer a server:
python3 -m http.server 8000
```

## The world

The lesson is a composition, not a page: a full-bleed Mars environment, a
heading set on the sky, and a learning panel placed into the world with
Nibi able to step outside it onto the ground.

```
world (full viewport)          assets/bgm.png, drawn as three clipped bands
└── canvas 1520 x 1010         uniformly scaled + centred
    ├── heading                stage title + subtitle, set on the sky
    ├── #card 1280 x 720       the learning panel — every stage's coordinate space
    │   └── #progress          a 4px hairline along its foot — no numbers, no labels
    └── #nibi-space            the panel's coordinates, without its clipping
```

### The panel is a place

`.stage-floor` puts a work surface across the bottom of the panel at y=640
(y=600 in panel coordinates): a soft band with a hairline along its top edge.
Nibi stands **on** it, the geometry floats **above** it, and the buttons live
on the apron **below** it. Every Nibi stance in the lesson is snapped to that
one ground line, which is what stops the character floating in white space.

### Sound that carries meaning

Pitch is used as a teaching channel, not just as feedback. Both parallel sides
ring the **same note** (`paraTick`) because they are the same kind of thing;
the height rings a different one (`heightTick`). The sliding height probe holds
**one steady pitch** for its whole travel, because the distance it measures
never changes. The shear that proves *base x height* starts and ends on the
**same note**: the area did not change.

There is no HUD. The only persistent control is the sound toggle. Progress is
a hairline at the foot of the panel; the heading carries the mathematics and
nothing else, and a stage may set `title: null` to show no heading at all
(the warm-up opens on shapes alone, with no words above them).

Anything touchable on a diagram wears a soft blue halo — `.edge.tapzone` —
that pulses twice on arrival, brightens on hover, and turns into the diagram's
own colour once chosen (green for a parallel side, violet for the height).
Blue means "you can touch this", on the geometry exactly as in the UI.

Shapes never sit in boxes. `NL.Geo.popIn(node, centre)` scales them up about
their own centre with a little overshoot and a soft landing sound, staggered
when several arrive together. A shape only grows chrome — a soft ring — while
something is happening to it: blue when selected, green when right, amber when
it is worth another look.

`#nibi-space` is the trick that lets Nibi belong to the world: it shares the
panel's origin, so stage code keeps using panel coordinates, but nothing
clips it — `y > 720` puts Nibi on the Mars ground below the panel, `x > 1280`
beside it.

### Layered depth from one plate

`bgm.png` is drawn three times and clipped into bands (sky · distant relief ·
terrain). During the opening each band fades and settles a beat apart, so a
single flat asset reads as a layered environment; once seated the bands are
pixel-identical to the original. Pointer parallax moves them 5 / 11 / 18 px,
and dust motes 26 px, which is enough for depth and little enough to ignore.

### Opening sequence

`NL.Lesson.open()` runs before stage 1: sky → relief → terrain → atmosphere →
Nibi walks in across the ground and looks at you → the panel is placed into
the world → the heading writes itself → the lesson begins. About five seconds.

## Sound

`NL.Sound` is a small synthesised library (no audio files) grouped by meaning,
not by waveform — `playUI`, `playCharacter`, `playShape`, `playSuccess`,
`playError`, `playHint`, `playDiscovery`, `playTransition`, `playComplete`.
Components ask for an event; the manager owns the tone and the mix level, and
one toggle silences everything without changing any behaviour.

---

## The learning flow

| # | Stage | What the learner does |
|---|-------|----------------------|
| 01 | Warm-up | drags shape names onto a rectangle, square and triangle |
| 02 | Meet the trapezium | taps the two sides they think are parallel |
| 03 | Trapezium or not? | decides whether a parallelogram is a trapezium too |
| 04 | Spot them all | multi-selects every trapezium in a grid of six quadrilaterals |
| 05 | The family | taps each of right-angled / isosceles / scalene |
| 06 | What is area? | taps the shape to flood it with unit squares |
| 07 | a, b and h | picks the real height after Nibi's own mistake |
| 08 | Build the formula | flips a copy into a parallelogram, works out its base |
| 09 | The formula | taps each letter to see where it lives on the shape |
| 10 | In your own words | matches `a + b` and `h` to their meanings |
| 11 | One formula, three shapes | predicts whether the formula changes, then watches all three derive |
| 12 | Work one out | chooses the first step, then paces the calculation |
| 13 | Fill the formula | drags 18 cm / 20 cm / 10 cm into the formula's slots |
| 14 | Find the area | chooses 190 cm² from three candidates |
| 15 | Compare | picks the larger of two trapeziums, then sees both worked out |
| 16 | Remember | calm three-point recap |

Two misconceptions are taught explicitly rather than marked wrong:

* **a parallelogram is not a trapezium** — stage 03 traces both pairs of
  parallel sides and counts them out loud;
* **the slanted side is not the height** — in stage 07 *Nibi* grabs the
  slanted side first, catches itself, stands that side upright next to the
  perpendicular and shows it poking out over the top.

## Visual language

One palette, four roles, applied everywhere:

| role | colour | where |
|---|---|---|
| shape body | pale yellow `#faefa6` with a deep-green `#2f5d34` outline | every polygon |
| parallel sides (a, b) | deep green `#2f5d34`, italic labels, mid-edge arrows | edges, labels, `<em>` in a subtitle |
| perpendicular height (h) | violet `#6849c9`, dashed, right-angle marker | never confusable with a parallel side |
| interaction | blue `#4a7ce6` (Nibi's own colour) | CTAs, selection |

Feedback borrows the same green for *correct* and a warm amber for *look
again* — never red. A stage's subtitle uses `<em>` / `<em class="h">` so the
words above the panel are tinted with the exact colour of the thing they name
in the diagram below it.

The panel itself is plain white with a soft warm shadow — no texture, no
gradient — so the geometry is the only thing with colour in the middle of the
screen. All the warmth comes from the Mars world around it.

## Architecture

```
index.html                 world, canvas, panel, script order
styles/tokens.css          one palette + type + motion scale
styles/world.css           the Mars world, the canvas and the panel
styles/lesson.css          every component living inside the panel
src/core/util.js           h() / s() element builders, design-space `at()`
src/core/anim.js           promise tweens, easings, stroke drawing, signals
src/core/audio.js          NL.Sound — the sound manager (synthesised)
src/core/lesson.js         LessonShell: stage registry, transitions, progress
src/components/world.js    NL.World — layered Mars, parallax, dust sweeps
src/components/geometry.js NL.Geo — shapes, dimension lines, markers
src/components/nibi.js     NL.Nibi — the character system
src/components/ui.js       copy, buttons, choices, cards, formulas, drag & drop
src/stages/act1.js         stages 01-05
src/stages/act2.js         stages 06-11
src/stages/act3.js         stages 12-16
assets/nibi/*.png          60 frames cut from the supplied sprite sheet
```

### Stages are async functions

```js
NL.Lesson.register({
  id: 'parts', label: 'a, b and h', keep: ['hero'],
  title: 'Naming the Parts',                       // set on the sky
  sub: 'Two <em>parallel sides</em> and one <em class="h">perpendicular height</em>.',
  act: true,                                       // dust-sweep transition in
  async enter(ctx) {
    const g = ctx.board.g('hero');       // persistent SVG group
    await ctx.draw(edge, 420);           // choreograph
    await done;                          // wait for the learner
    await ctx.ready('Next');             // hand over
  }
});
```

A stage declares its heading (`title` / `sub`, with `<em>` picking up the
diagram's own colours) and may rewrite it mid-stage with `ctx.head(...)` — the
definition in stage 02 and the formula in stage 08 land in the heading at the
moment they are discovered. `act: true` marks a concept boundary, which gets a
dust sweep across the terrain and a breath from the panel.

`ctx.ready()` resolves on click and the shell advances. If the learner
presses **Back** mid-sequence the stage's signal is cancelled and any pending
step simply never resolves, so half-finished choreography can never touch the
next stage.

### One continuous canvas

The SVG board is **not** rebuilt per stage. Groups are addressed by key and a
stage declares which keys it keeps:

```js
keep: ['hero']
```

That is why the trapezium in stages 06→10 never moves, never re-fades and
keeps the tint it gained when the learner first filled it — labels,
copies and dimensions arrive around a shape that stays put.

### Nibi

`src/components/nibi.js` maps semantic states onto sprite frames
(`idle` and `walk` are frame loops, everything else is a single frame) and
exposes:

```js
nibi.set('point-right');            // sprite state, optional flip
nibi.to(x, y, {then: 'listening'}); // walk/arc to a spot, feet-anchored
nibi.say('That’s the height!');     // auto-sided bubble, kept inside the stage
nibi.react('ok' | 'wrong', line);   // reaction + sound + squash/shake
nibi.squash(); nibi.hop();
```

Nibi is positioned by its feet, lives on its own layer between the diagram
and the text, and is placed per stage so it never covers a formula, an
answer or a measurement.

### Sprite extraction

The supplied sheets (`assets/nibi.png`, `assets/nibi2.png`) are labelled
contact sheets on tinted panels, so the frames were cut once, background
removed and written to `assets/nibi/` as transparent PNGs at 2×. Frame names
map 1:1 to the sheet's own labels (`pointLeft`, `morphSplit`, `realization`…).

## Reuse for another lesson

`NL.Geo`, `NL.UI`, `NL.Nibi`, `NL.Anim` and the lesson shell carry no
trapezium-specific logic. A new lesson is a new file of
`NL.Lesson.register({...})` calls plus its own shape maths.
