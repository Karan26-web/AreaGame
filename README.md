# Area of a Trapezium — an interactive lesson with Swiftee

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
Swiftee able to step outside it onto the ground.

```
world (full viewport)          assets/mars-plate.webp, drawn as three clipped bands
└── canvas 1408 x 952          uniformly scaled + centred
    ├── heading                stage title + subtitle, set on the sky
    ├── #card 1280 x 720       the learning panel — every stage's coordinate space
    │   ├── #caption           what Swiftee says, on the apron — never over the board
    │   └── #progress          a 4px hairline along its foot — no numbers, no labels
    └── #swiftee-space         the panel's coordinates, without its clipping
```

The panel cannot be resized to make it bigger: its 1280 x 720 space is where
every stage's geometry and every UI offset is written. It is made bigger by
giving it more of the canvas — the side margins and the heading band are the
only slack, and both are trimmed to the least the heading needs, which lands
the panel about 12% larger in area on the same screen.

### The panel is a place

`.stage-floor` puts a work surface across the bottom of the panel at y=640
(y=600 in panel coordinates): a soft band with a hairline along its top edge.
Swiftee stands **on** it, the geometry floats **above** it, and the buttons live
on the apron **below** it. Every Swiftee stance in the lesson is snapped to that
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

`#swiftee-space` is the trick that lets Swiftee belong to the world: it shares the
panel's origin, so stage code keeps using panel coordinates, but nothing
clips it — `y > 720` puts Swiftee on the Mars ground below the panel, `x > 1280`
beside it.

### Layered depth from one plate

`mars-plate.webp` is drawn three times and clipped into bands (sky · distant relief ·
terrain). During the opening each band fades and settles a beat apart, so a
single flat asset reads as a layered environment; once seated the bands are
pixel-identical to the original. Pointer parallax moves them 5 / 11 / 18 px,
and dust motes 26 px, which is enough for depth and little enough to ignore.

### Opening sequence

`NL.Lesson.open()` runs before stage 1: sky → relief → terrain → atmosphere →
Swiftee flies in across the ground and looks at you → the panel is placed into
the world → the heading writes itself → the lesson begins. About five seconds.

## Sound

`NL.Sound` is a small synthesised library (no audio files) grouped by meaning,
not by waveform — `playUI`, `playCharacter`, `playShape`, `playSuccess`,
`playError`, `playHint`, `playDiscovery`, `playTransition`, `playComplete`.
Components ask for an event; the manager owns the tone and the mix level, and
one toggle silences everything without changing any behaviour. Each group has
its own gain node, so the mix in `GAIN` is real rather than decorative.

### Swiftee has a voice

`playExpression` is the character's own register: 14 short non-verbal motifs,
one per feeling, wired to the states in `swiftee.js` so a change of face is
also a change of tone — a question rises (`hm`), a doubt falls (`doubt`), a
realisation opens upward (`aha`), confidence sits on a bare fifth (`chest`).
They are deliberately **off** the lesson's mathematical pitches, so a feeling
can never be mistaken for a statement about the shape.

Two rules keep it from becoming noise:

* **an expression is queued, not played.** Stages set a state and then sound
  the beat themselves — `set('celebrate')` then `sfx('win')` — so playing
  immediately would double every reward. A 90 ms hold lets the louder voice
  arrive and cancel the expression; alone, it plays imperceptibly late. Only
  the loud groups outrank it (`success`, `error`, `discovery`): a state change
  and a line of speech arrive together, so letting a caption tick cancel the
  expression would have silenced it on almost every line.
* **the same feeling twice in a breath is suppressed.** `confused` and
  `incorrect` share a voice, and hearing it twice reads as a stutter, not as
  emphasis.

`idle` has no voice on purpose: it is where every movement ends, so a sound
there would fire on every step of the lesson.

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
| 07 | a, b and h | picks the real height after Swiftee's own mistake |
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
* **the slanted side is not the height** — in stage 07 *Swiftee* grabs the
  slanted side first, catches itself, stands that side upright next to the
  perpendicular and shows it poking out over the top.

## Visual language

One palette, four roles, applied everywhere:

| role | colour | where |
|---|---|---|
| shape body | pale yellow `#faefa6` with a deep-green `#2f5d34` outline | every polygon |
| parallel sides (a, b) | deep green `#2f5d34`, italic labels, mid-edge arrows | edges, labels, `<em>` in a subtitle |
| perpendicular height (h) | violet `#5a3cb8`, dashed, right-angle marker | never confusable with a parallel side |
| the learner's own choice | yellow `#ffc21f`, a wide swipe under the outline | a side they have tapped, before it is judged |
| interaction | teal, Swiftee's own plumage — `--accent #159289` for marks, `--brand #0b6f69` for buttons | tap hints and selection · CTAs |

Interaction is one hue split by the job it does, because the two jobs have
different contrast bars. `--accent` only ever marks the diagram, so it answers
to the 3:1 for graphics and stays vivid. `--brand` is a surface carrying white
19px and 16px type, so **both** gradient stops have to clear 4.5:1 alone — a
light, candy teal cannot, which is the usual way a button ends up unreadable.

The three inks are all legible on the card: `--ink` 16.4:1, `--ink-2` 7.3:1,
`--ink-3` 5.4:1. `--ink-3` is the one that matters — it carries the 14-18px
captions, shape names, formula operators and step numbers, and at its old
value it was 3.0:1, which made the names under the diagrams guesswork.

Green is reserved for what the diagram has *established* — the chevrons on a
confirmed parallel pair. A side the learner has merely *chosen* is yellow, and
the distinction matters: the first version of the tapping stage turned a chosen
side green, so picking one looked like being told you were right. The swipe is
drawn under the shape, so the deep-green outline stays crisp on top of it and
the yellow reads as a band running alongside the edge, like a highlighter.

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
src/components/swiftee.data.js  generated sheet manifest (see tools/)
src/components/swiftee.js  NL.Swiftee — the character system
src/components/ui.js       copy, buttons, choices, cards, formulas, drag & drop
src/stages/act1.js         stages 01-05
src/stages/act2.js         stages 06-11
src/stages/act3.js         stages 12-16
assets/swiftee/*.webp      24 animation sheets + the poster atlas
tools/build_swiftee_assets.py   rebuilds the two lines above from the sprite pack
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

### Board elements arrive one at a time

Shapes and edges have their own entrances (`G.popIn`, and the stroke-drawing
in `NL.Anim`), but the decorations — labels, chevrons, tick marks, right
angles, dimension lines — used to be appended straight into the SVG and simply
blinked into existence, several at once. `G.parallelMark`, `G.tickMark`,
`G.rightAngle`, `G.dimension` and `G.label` are now wrapped so whatever they
return rises and settles on its own beat.

The stagger is automatic rather than per call site: everything built in the
same frame joins one queue and enters in the order it was made, so a stage says
what it wants on the board and the board leads the eye through it. The step
shortens as the queue grows, so eight marks still read as a sequence without
stalling the lesson. `G.raw.*` keeps the unwrapped builders for anything that
needs to drive its own timing, and an element that is not in the document by
the next frame is left alone — the stage is holding it back deliberately.

### Swiftee

`src/components/swiftee.js` maps the lesson's **semantic states** onto the
character's **animation clips**, and exposes:

```js
swiftee.set('point-right');            // semantic state, optional flip
swiftee.to(x, y, {then: 'listening'}); // travel to a spot, feet-anchored
swiftee.say('That’s the height!');     // one line on the panel's caption
swiftee.react('ok' | 'wrong', line);   // reaction + sound + squash/shake
swiftee.squash(); swiftee.hop();
```

Swiftee is positioned by its feet, lives on its own layer between the diagram
and the text, and is placed per stage so it never covers a formula, an
answer or a measurement.

Stages never name a clip. They ask for `celebrate`, `measuring`, `incorrect`,
and the component decides what that looks like — which is what let the whole
character be swapped without touching a single stage.

`say()` writes to `#caption`, one line on the panel's apron between the Back
and Next buttons. It used to be a bubble anchored to Swiftee's own body, which
meant the narration drifted across the diagram it was describing — and on the
tapping stages it covered the very edge under discussion. The character now
carries the feeling, in its face and its voice; the panel carries the words,
always in the same place. `side`, `dx` and `w` are still accepted and ignored,
so no stage had to change, and the awaited timing is untouched.

Every primary action in the lesson is therefore at `{r: 34, b: 30}` — the two
stages that centred theirs would have sat on the caption, and one consistent
CTA position is worth more than either composition.

### Expressions

27 states, 16 looping clips. States share a clip wherever the lesson's
distinction is one of *words*, not of face: `explaining` and `teaching` are
both `talking`, `correct` and `encouraging` are both `happy`. Two choices are
deliberate:

* **there is no sad pose.** A miss reads as `confused` — "hm, not quite" —
  never as disappointment. The character is puzzled *with* the learner.
* **direction is a mirror, not a pose.** Swiftee is drawn front-on and raises
  one wing, so `point-left` and `point-right` are the same clip flipped, and
  the wing always ends up on the side the diagram is.

A state may play a one-shot **lead-in** before settling into its loop, so a
reaction lands as a beat rather than a jump cut (`surprised_start` →
`surprised`). If that lead-in has not streamed in yet it is skipped: a beat is
worth less than a stall.

### Sprite pipeline

The character ships as uniform sprite sheets — every frame of every clip in
the same 256px cell with the pivot at the exact cell centre — so clips are
interchangeable and Swiftee never shifts a pixel between them. The component
leans on that hard: **one** scale, measured from the standing idle, drives
every clip, which is why a jump reads as a jump rather than a resize.

`tools/build_swiftee_assets.py` takes the sprite pack and emits only what the
lesson can reach: 24 sheets as **lossless WebP** (flat vector art with alpha —
about a third of the shipped PNG8, and far smaller than lossy WebP, which
wastes bits on the hard edges), one `poster.webp` holding a still of every clip
for the frame or two before a sheet decodes, and `swiftee.data.js` carrying the
grids and measured ink boxes as plain JS, so the component needs no fetch and
no async boot.

Clips stream: six core ones load immediately, the rest trickle in after
`load`, and any state asked for early shows its poster still until its sheet
lands.

## Reuse for another lesson

`NL.Geo`, `NL.UI`, `NL.Swiftee`, `NL.Anim` and the lesson shell carry no
trapezium-specific logic. A new lesson is a new file of
`NL.Lesson.register({...})` calls plus its own shape maths.
