/* ============================================================
   NL.Sound — the lesson's sound manager.
   Everything is synthesised (no audio files), grouped by meaning
   rather than by waveform, and mixed low: interaction feedback
   sits under the mathematical events, which sit under nothing.
   Components never build tones themselves; they ask for an event.
   ============================================================ */
(function (NL) {
  let ctx = null, bus = null, enabled = true;
  /* expression sits under everything: it is the character's breathing,
     not an event the learner has to hear */
  const GAIN = { ui: .55, character: .6, shape: .62, success: .8, error: .55,
                 discovery: .85, transition: .4, expression: .40 };
  /* one persistent node per group, and the node the current voice writes
     into. Setting bus.gain per call would not work: the value is restored
     in the same tick, long before the graph renders a single sample.   */
  const nodes = {};
  let dest = null;

  function boot() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    bus = ctx.createGain();
    bus.gain.value = .085;                       /* deliberately quiet */
    bus.connect(ctx.destination);
    for (const k in GAIN) {
      const g = ctx.createGain();
      g.gain.value = GAIN[k] / .6;               /* .6 is the reference group */
      g.connect(bus);
      nodes[k] = g;
    }
    dest = bus;
  }

  /* ---------- primitives ---------- */
  function tone(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + o.d);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, o.g === undefined ? .5 : o.g), t0 + (o.a || .012));
    g.gain.exponentialRampToValueAtTime(.0001, t0 + o.d);
    osc.connect(g);
    if (o.pan !== undefined && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.value = o.pan;
      g.connect(p); p.connect(dest);
    } else g.connect(dest);
    osc.start(t0); osc.stop(t0 + o.d + .03);
  }

  /* filtered noise — used for whooshes, dust and line drawing */
  function noise(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.at || 0);
    const len = Math.max(.05, o.d);
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = o.filter || 'bandpass';
    bp.frequency.setValueAtTime(o.f || 900, t0);
    if (o.to) bp.frequency.linearRampToValueAtTime(o.to, t0 + len);
    bp.Q.value = o.q === undefined ? 1.1 : o.q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(o.g === undefined ? .25 : o.g, t0 + len * .25);
    g.gain.linearRampToValueAtTime(0, t0 + len);
    src.connect(bp); bp.connect(g); g.connect(dest);
    src.start(t0); src.stop(t0 + len + .02);
  }

  /* ---------- the event vocabulary ---------- */
  const VOICE = {
    /* UI */
    tap:      () => tone({ f: 330, to: 380, d: .05, g: .3, type: 'triangle' }),
    click:    () => tone({ f: 470, to: 560, d: .07, g: .38, type: 'triangle' }),
    nav:      () => { tone({ f: 400, d: .07, g: .34, type: 'triangle' }); tone({ f: 620, at: .05, d: .1, g: .26 }); },
    card:     () => { noise({ f: 380, to: 1500, d: .5, g: .16, q: .7 }); tone({ f: 300, to: 520, d: .42, g: .16 }); },

    /* character */
    bounce:   () => tone({ f: 280, to: 420, d: .14, g: .34 }),
    pop:      () => tone({ f: 620, to: 900, d: .1, g: .42 }),
    whoosh:   () => noise({ f: 500, to: 1800, d: .34, g: .14, q: .6 }),
    land:     () => { tone({ f: 180, to: 120, d: .16, g: .34 }); noise({ f: 700, to: 300, d: .2, g: .12 }); },

    /* geometry */
    draw:     () => noise({ f: 1400, to: 2600, d: .32, g: .1, q: 2.2 }),
    shape:    () => tone({ f: 520, to: 700, d: .12, g: .34 }),
    morph:    () => { noise({ f: 400, to: 1600, d: .5, g: .13, q: .8 }); tone({ f: 240, to: 480, d: .5, g: .14 }); },
    measure:  () => { tone({ f: 880, d: .06, g: .26 }); tone({ f: 1170, at: .07, d: .09, g: .2 }); },
    tick:     () => tone({ f: 1050, d: .05, g: .22 }),
    snap:     () => { tone({ f: 700, d: .06, g: .4 }); tone({ f: 1050, at: .05, d: .1, g: .3 }); },

    /* the mathematics, in pitch.
       Both parallel sides ring the SAME note — they are the same kind of
       thing. The height rings a different one. The sliding height probe
       holds ONE steady pitch, because the distance it measures never
       changes. The shear starts and ends on the same note: same area.   */
    paraTick:   () => tone({ f: 587.33, d: .16, g: .34 }),
    heightTick: () => tone({ f: 880, d: .18, g: .32 }),
    constant:   () => tone({ f: 523.25, d: 2.0, g: .13, a: .3 }),
    join:       () => { noise({ f: 700, to: 220, d: .2, g: .15 }); tone({ f: 392, at: .05, d: .26, g: .36, to: 523.25 }); },
    sameArea:   () => { tone({ f: 440, d: 1.0, g: .17 }); tone({ f: 659.25, at: .5, d: .5, g: .12 }); },

    /* feedback */
    correct:  () => [523, 659, 784].forEach((f, i) => tone({ f, at: i * .075, d: .3, g: .4 })),
    oops:     () => { tone({ f: 392, to: 330, d: .16, g: .3 }); tone({ f: 294, at: .13, d: .24, g: .22 }); },
    hint:     () => { tone({ f: 740, d: .1, g: .26 }); tone({ f: 988, at: .1, d: .16, g: .2 }); },

    /* discovery + completion */
    discover: () => { [392, 523, 659, 784].forEach((f, i) => tone({ f, at: i * .07, d: .38, g: .34 })); noise({ f: 2200, to: 5200, d: .5, g: .07, q: 3 }); },
    win:      () => [523, 659, 784, 1046].forEach((f, i) => tone({ f, at: i * .085, d: .42, g: .38 })),
    complete: () => {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f, at: i * .1, d: .6, g: .34 }));
      tone({ f: 261, at: .1, d: 1.1, g: .16 });
      noise({ f: 2600, to: 6000, d: .8, g: .06, q: 3 });
    },

    /* ---------- the character's expressions ----------
       Non-verbal, short, and deliberately OFF the lesson's mathematical
       pitches (D5 587.33, A5 880, C5 523.25) so a feeling can never be
       mistaken for a statement about the shape. Each one is a gesture in
       two or three notes: a question rises, a doubt falls, a realisation
       opens upward, and confidence sits on a bare fifth.               */
    hm:       () => { tone({ f: 392, d: .1, g: .22, type: 'triangle' }); tone({ f: 466.16, at: .1, d: .16, g: .2, type: 'triangle' }); },
    muse:     () => { tone({ f: 294, d: .5, g: .13, a: .12 }); tone({ f: 349.23, at: .26, d: .34, g: .09 }); },
    doubt:    () => { tone({ f: 440, to: 370, d: .22, g: .2, type: 'triangle' }); tone({ f: 311, at: .16, d: .2, g: .13 }); },
    oh:       () => { tone({ f: 494, to: 740, d: .13, g: .26 }); },
    aha:      () => [587.33, 740, 988].forEach((f, i) => tone({ f, at: i * .06, d: .24, g: .22 })),
    warm:     () => { tone({ f: 523.25, d: .16, g: .22 }); tone({ f: 659.25, at: .09, d: .24, g: .18 }); },
    chest:    () => { tone({ f: 349.23, d: .2, g: .2 }); tone({ f: 523.25, at: .1, d: .3, g: .17 }); },
    spark:    () => { tone({ f: 1174.7, d: .07, g: .18 }); tone({ f: 1568, at: .06, d: .14, g: .13 }); },
    steady:   () => { tone({ f: 261.63, d: .12, g: .22, type: 'triangle' }); tone({ f: 392, at: .11, d: .22, g: .2, type: 'triangle' }); },
    focus:    () => tone({ f: 698.46, d: .42, g: .12, a: .14 }),
    gesture:  () => tone({ f: 622.25, d: .1, g: .2, type: 'triangle' }),
    buzz:     () => [659.25, 831, 1046.5].forEach((f, i) => tone({ f, at: i * .045, d: .16, g: .2 })),
    cheer:    () => { [523.25, 698.46, 880].forEach((f, i) => tone({ f, at: i * .055, d: .3, g: .24 })); noise({ f: 2400, to: 4800, d: .34, g: .05, q: 3 }); },
    flap:     () => { noise({ f: 620, to: 260, d: .16, g: .1, q: .8 }); noise({ f: 540, to: 240, at: .17, d: .16, g: .08, q: .8 }); },

    /* world */
    rise:     () => { tone({ f: 110, to: 220, d: 1.3, g: .1, a: .4 }); noise({ f: 200, to: 700, d: 1.2, g: .05, q: .5 }); },
    sweep:    () => noise({ f: 260, to: 1100, d: .8, g: .12, q: .5, filter: 'lowpass' })
  };

  function fire(name, group) {
    if (!enabled) return;
    boot();
    if (!ctx || !VOICE[name]) return;
    if (ctx.state === 'suspended') ctx.resume();
    /* an expression is the quietest thing in the mix and must never fight
       a real event, so a louder voice landing in the queue window wins */
    if (group !== 'expression' && queued) { clearTimeout(queued); queued = null; }
    dest = nodes[group] || bus;
    try { VOICE[name](); } catch (e) { /* never let audio break a lesson */ }
    dest = bus;
  }

  /* Expressions are QUEUED, not played. Stages set a state and then sound
     the beat themselves (`set('celebrate')` then `sfx('win')`), so playing
     immediately would double every reward. A short hold lets the louder
     voice arrive and cancel this one; alone, it plays imperceptibly late. */
  let queued = null, lastVoice = '', lastAt = 0;
  function express(name) {
    if (!enabled || !VOICE[name]) return;
    const now = performance.now();
    /* the same feeling twice in a breath is a stutter, not emphasis */
    if (name === lastVoice && now - lastAt < 420) return;
    lastVoice = name; lastAt = now;
    clearTimeout(queued);
    queued = setTimeout(() => { queued = null; fire(name, 'expression'); }, 90);
  }

  /* ---------- the manager surface used by components ---------- */
  const Sound = {
    playUI:         (n) => fire(n || 'click', 'ui'),
    playCharacter:  (n) => fire(n || 'bounce', 'character'),
    playShape:      (n) => fire(n || 'shape', 'shape'),
    playSuccess:    (n) => fire(n || 'correct', 'success'),
    playError:      (n) => fire(n || 'oops', 'error'),
    playHint:       (n) => fire(n || 'hint', 'ui'),
    playDiscovery:  (n) => fire(n || 'discover', 'discovery'),
    playTransition: (n) => fire(n || 'sweep', 'transition'),
    playExpression: (n) => express(n),
    playComplete:   () => fire('complete', 'discovery'),
    toggle() {
      enabled = !enabled;
      if (!enabled) { clearTimeout(queued); queued = null; }
      else fire('tap', 'ui');
      return enabled;
    },
    get enabled() { return enabled; }
  };

  /* every legacy event name a stage may ask for, mapped to a voice
     and a mix group, so stages stay declarative                     */
  const LEGACY = {
    pop:    ['pop', 'shape'],       tick:   ['tap', 'ui'],
    click:  ['click', 'ui'],        snap:   ['snap', 'shape'],
    reveal: ['shape', 'shape'],     ok:     ['correct', 'success'],
    near:   ['oops', 'error'],      win:    ['win', 'success'],
    swoosh: ['morph', 'shape'],     boing:  ['bounce', 'character'],
    draw:   ['draw', 'shape'],      measure:['measure', 'shape'],
    hint:   ['hint', 'ui'],         card:   ['card', 'ui'],
    land:   ['land', 'character'],  whoosh: ['whoosh', 'character'],
    nav:    ['nav', 'ui'],          discover: ['discover', 'discovery'],
    complete: ['complete', 'discovery']
  };

  NL.Sound = Sound;
  NL.Sfx = {
    play(name) { const m = LEGACY[name]; if (m) fire(m[0], m[1]); else fire(name, 'ui'); },
    toggle: () => Sound.toggle(),
    get enabled() { return enabled; }
  };
  window.addEventListener('pointerdown', boot, { once: true });
})(window.NL);
