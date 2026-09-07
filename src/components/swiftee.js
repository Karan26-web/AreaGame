/* ============================================================
   NL.Swiftee — the recurring learning companion.

   Swiftee ships as uniform sprite sheets: every frame of every clip
   sits in the same 256px cell with the pivot at the cell centre, so
   clips are interchangeable and the character never shifts a pixel
   between them. That property is what this component leans on:

   * ONE scale, measured from the standing idle, drives every clip —
     so a jump reads as a jump rather than a resize,
   * Swiftee is positioned by its FEET: (x = centre, y = ground line),
     the same contract the stages were already written against,
   * semantic states, not clip names, are what stages ask for, and a
     state may play a one-shot lead-in before settling into its loop
     so a reaction lands as a beat instead of a jump cut,
   * clips stream in: the poster atlas stands in for the frame or two
     before a sheet decodes, so a state change never shows a gap.
   ============================================================ */
(function (NL) {
  const { h } = NL;
  const { wait, tween } = NL.Anim;
  const D = NL.SwifteeData;

  /* Fraction of the cell the standing character occupies, and where its
     feet sit in that cell. Every clip shares this registration.        */
  const STAND = D.stand;              /* standing height / cell         */
  const BELOW = 1 - D.foot;           /* cell left under the foot line  */

  /* ---------- semantic state -> clip ----------
     `in` is a one-shot lead-in; `loop` is held for as long as the state
     lasts. `flip` is the direction the pose reads in, used when the
     caller does not care. `bob` is the gentle idle sway, switched off
     for clips that already carry their own weight. `sfx` is the voice the
     expression speaks in — queued, so a stage sounding its own beat right
     after (`set('celebrate')` then `sfx('win')`) cancels it rather than
     doubling up. `idle` has none on purpose: it is where every movement
     ends, so a voice there would sound on every step of the lesson.

     Several states share a clip on purpose — Swiftee has no separate
     "sad" or "wrong" pose, and a lesson is better for it: a miss reads
     as `confused` ("hm, not quite"), never as disappointment.         */
  const STATE = {
    /* presence */
    idle:        { loop: 'blinking' },
    walk:        { loop: 'flapping', fps: 24, bob: false, sfx: 'flap' },
    listening:   { loop: 'listening', sfx: 'gesture' },

    /* thought */
    thinking:    { loop: 'thinking', sfx: 'muse' },
    pondering:   { loop: 'thinking', fps: 12, sfx: 'muse' },
    curious:     { loop: 'curious', sfx: 'hm' },
    measuring:   { loop: 'focussed', sfx: 'focus' },
    determined:  { loop: 'confident', sfx: 'steady' },

    /* speaking to the learner */
    explaining:  { loop: 'talking', sfx: 'gesture' },
    teaching:    { in: 'talk_start', loop: 'talking', sfx: 'gesture' },

    /* directing attention — the raised wing carries the direction,
       so left and right are the same clip, mirrored              */
    'point-left':  { in: 'wave_start', loop: 'waving', flip: false, sfx: 'gesture' },
    'point-right': { in: 'wave_start', loop: 'waving', flip: true,  sfx: 'gesture' },
    presenting:    { in: 'wave_start', loop: 'waving', sfx: 'warm' },
    split:         { in: 'wave_start', loop: 'waving', sfx: 'gesture' },

    /* the beats */
    surprised:   { in: 'surprised_start', loop: 'surprised', sfx: 'oh' },
    realization: { in: 'surprised_start', loop: 'surprised', sfx: 'aha' },
    confused:    { in: 'confused_start', loop: 'confused', sfx: 'doubt' },
    incorrect:   { in: 'confused_start', loop: 'confused', sfx: 'doubt' },
    wink:        { in: 'playful_start', loop: 'playful', sfx: 'spark' },
    hint:        { in: 'playful_start', loop: 'playful', sfx: 'spark' },

    /* the rewards, in three sizes */
    happy:       { in: 'happy_start', loop: 'happy', sfx: 'warm' },
    correct:     { in: 'happy_start', loop: 'happy', sfx: 'warm' },
    /* encouraging follows a miss, so it wants a warm face looking at the
       learner rather than the neutral narration of `talking` */
    encouraging: { in: 'happy_start', loop: 'happy', sfx: 'warm' },
    thumbs:      { in: 'proud_start', loop: 'proud', sfx: 'chest' },
    proud:       { in: 'proud_start', loop: 'proud', sfx: 'chest' },
    excited:     { loop: 'excited', bob: false, sfx: 'buzz' },
    celebrate:   { in: 'celebrate_start', loop: 'celebrating', bob: false, sfx: 'cheer' }
  };

  /* ---------- clip streaming ----------
     The poster covers every loop clip at half resolution in one request,
     so any state can be shown correctly on the frame it is asked for.
     Sheets then load over the top, core ones first.                    */
  const loaded = {};
  const poster = new Image();
  poster.src = D.dir + D.poster.file;

  function load(name) {
    let im = loaded[name];
    if (im) return im;
    im = loaded[name] = new Image();
    im.src = D.dir + name + '.webp';
    return im;
  }

  const CORE = ['blinking', 'talking', 'waving', 'happy', 'listening', 'curious'];
  CORE.forEach(load);
  /* the rest once the opening has the network to itself */
  window.addEventListener('load', () => {
    const rest = Object.keys(D.clips).filter(c => CORE.indexOf(c) < 0);
    const next = () => { const c = rest.shift(); if (c) { load(c); setTimeout(next, 60); } };
    setTimeout(next, 400);
  });

  const ready = im => im.complete && im.naturalWidth > 0;

  class Swiftee {
    constructor(layer) {
      /* One transform per element, so nothing fights for the property:
         the anchor travels, the body bobs, the flip mirrors, the cell
         takes the one-shot flourishes. A CSS animation overrides inline
         style, so sharing an element would silently drop the mirror.  */
      this.anchor = h('div#swiftee');
      this.shadow = h('div.swiftee-shadow');
      this.body   = h('div.swiftee-body');
      this.flipEl = h('div.swiftee-flip');
      this.cell   = h('div.swiftee-cell', { role: 'img', 'aria-label': 'Swiftee' });
      this.flipEl.appendChild(this.cell);
      this.body.appendChild(this.flipEl);
      this.anchor.append(this.shadow, this.body);
      layer.appendChild(this.anchor);

      /* squash, hop and bob all pivot on the feet, which sit a little
         above the bottom of the cell */
      const foot = (D.foot * 100).toFixed(2) + '%';
      this.body.style.transformOrigin = this.cell.style.transformOrigin = '50% ' + foot;

      this.x = 640; this.y = 620; this.flip = false;
      this.state = null; this._raf = null; this._bubble = null;
      this._clip = null;
      this.resize(132);
      this.set('idle');
      this.place(this.x, this.y, true);
      this.bob(true);
    }

    /* ---------- position ---------- */
    place(x, y, instant) {
      this.x = x; this.y = y;
      if (instant) this.anchor.classList.add('instant');
      this.anchor.style.transform = `translate(${x}px, ${y}px)`;
      if (instant) requestAnimationFrame(() => this.anchor.classList.remove('instant'));
      return this;
    }

    /* smooth travel; the walk cycle plays for anything but a nudge */
    async to(x, y, o) {
      o = o || {};
      const dur = o.dur === undefined ? 620 : o.dur;
      const goingLeft = x < this.x - 4;
      if (o.size !== undefined) this.resize(o.size);
      const prev = this.state;
      if (o.walk !== false && Math.abs(x - this.x) > 60) {
        this.set('walk', { flip: goingLeft });
      }
      const x0 = this.x, y0 = this.y;
      const arc = o.arc === undefined ? Math.min(46, Math.abs(x - x0) * .16) : o.arc;
      this.anchor.classList.add('instant');
      await tween(dur, t => {
        const cx = x0 + (x - x0) * t;
        const cy = y0 + (y - y0) * t - Math.sin(Math.PI * t) * arc;
        this.anchor.style.transform = `translate(${cx}px, ${cy}px)`;
      }, { ease: o.ease || 'inOut', sig: o.sig });
      this.x = x; this.y = y;
      this.anchor.classList.remove('instant');
      /* no flip argument unless the caller asked to keep facing:
         every state knows which way it reads                      */
      this.set(o.then || (prev && prev !== 'walk' ? prev : 'idle'),
               o.keepFlip ? { flip: goingLeft } : {});
      return this;
    }

    /* `px` is the standing character's height, as it always was — the
       cell is scaled up around it and hangs below the foot line, so the
       stage coordinates written against the old sprite still land.    */
    resize(px) {
      this.size = px;
      const cell = px / STAND;
      this._cellPx = cell;
      this.cell.style.width = this.cell.style.height = cell + 'px';
      this.body.style.bottom = -(BELOW * cell) + 'px';
      this.shadow.style.width = (px * .52) + 'px';
      return this;
    }

    /* ---------- sprite state ---------- */
    set(name, o) {
      o = o || {};
      const def = STATE[name] || STATE.idle;
      const flip = o.flip === undefined ? !!def.flip : !!o.flip;
      /* re-asking for the state you are already in must not restart its
         lead-in — stages set a state on every beat of a sequence       */
      if (this.state === name && this.flip === flip) return this;

      this.state = name;
      this.flip = flip;
      if (def.sfx) NL.Sound.playExpression(def.sfx);
      this.flipEl.style.transform = `scaleX(${flip ? -1 : 1})`;
      this.bob(def.bob !== false);

      cancelAnimationFrame(this._raf); this._raf = null;
      const fps = def.fps || D.fps;
      const queue = def.in ? [def.in, def.loop] : [def.loop];
      let qi = 0, i = 0, last = 0;
      /* the lead-in is skipped rather than waited for if it has not
         streamed in yet: a beat is worth less than a stall           */
      if (def.in && !ready(load(def.in))) qi = 1;
      this.clip(queue[qi], 0);

      const step = now => {
        this._raf = requestAnimationFrame(step);
        if (now - last < 1000 / fps) return;
        last = now;
        const clip = D.clips[queue[qi]];
        i++;
        if (i >= clip.frames) {
          if (qi < queue.length - 1) { qi++; i = 0; } else i = 0;
        }
        this.clip(queue[qi], i);
      };
      this._raf = requestAnimationFrame(step);
      return this;
    }

    /* paint one cell of one clip, falling back to the poster while the
       clip's sheet is still in flight */
    clip(name, i) {
      const c = D.clips[name];
      this._clip = name;
      const im = load(name);
      if (ready(im)) {
        if (this._painted !== name) {
          this._painted = name;
          this.cell.style.backgroundImage = `url("${D.dir}${name}.webp")`;
          this.cell.style.backgroundSize = `${c.cols * 100}% ${c.rows * 100}%`;
        }
        const col = i % c.cols, row = (i / c.cols) | 0;
        this.cell.style.backgroundPosition =
          `${c.cols > 1 ? col / (c.cols - 1) * 100 : 0}% ${c.rows > 1 ? row / (c.rows - 1) * 100 : 0}%`;
        return this;
      }
      /* not here yet — hold the poster still for this clip's loop, and
         repaint as soon as the sheet lands */
      const P = D.poster, key = STATE[this.state] && STATE[this.state].loop;
      const idx = P.index[key];
      if (idx !== undefined && this._painted !== 'poster:' + key) {
        this._painted = 'poster:' + key;
        this.cell.style.backgroundImage = `url("${D.dir}${P.file}")`;
        this.cell.style.backgroundSize = `${P.cols * 100}% ${P.rows * 100}%`;
        this.cell.style.backgroundPosition =
          `${idx % P.cols / (P.cols - 1) * 100}% ${((idx / P.cols) | 0) / (P.rows - 1) * 100}%`;
      }
      if (!im._wired) {
        im._wired = true;
        im.addEventListener('load', () => { if (this._clip === name) this.clip(name, 0); }, { once: true });
      }
      return this;
    }

    /* rendered width of the current clip's silhouette — a raised wing is
       far wider than an idle stance, so speech has to clear the real ink
       rather than a fraction of the height */
    spriteWidth() {
      const c = D.clips[this._clip] || D.clips.blinking;
      return (c.ink[2] - c.ink[0]) * this._cellPx;
    }

    bob(on) { this.body.classList.toggle('swiftee-anim-bob', !!on); return this; }

    /* one-shot body flourishes */
    fx(kind) {
      const cls = 'swiftee-anim-' + kind;
      this.cell.classList.remove(cls);
      void this.cell.offsetWidth;
      this.cell.classList.add(cls);
      return wait(kind === 'squash' ? 620 : 520);
    }
    squash() { return this.fx('squash'); }
    shake()  { return this.fx('shake'); }

    /* ---------- speech ---------- */
    say(text, o) {
      o = o || {};
      this.hush();
      const side = o.side || (this.x > 800 ? 'left' : this.x < 470 ? 'right' : 'up');
      const b = h('div.bubble', { html: text });
      if (o.w) b.style.maxWidth = o.w + 'px';
      const S = this.size;
      /* clear the silhouette, then a breathing gap on top of that */
      const gap = Math.round(this.spriteWidth() / 2) + 26;
      if (side === 'up')    { b.style.left = (o.dx === undefined ? -34 : o.dx) + 'px'; b.style.bottom = (S + 22) + 'px'; b.classList.add('tail-bl'); }
      if (side === 'right') { b.style.left  = gap + 'px'; b.style.bottom = Math.round(S * .52) + 'px'; b.classList.add('tail-l'); }
      if (side === 'left')  { b.style.right = gap + 'px'; b.style.bottom = Math.round(S * .52) + 'px'; b.classList.add('tail-r'); }
      this.anchor.appendChild(b);
      this._bubble = b;
      /* keep the bubble inside the stage — narrow it first so it wraps
         rather than sliding back across Swiftee's face                 */
      requestAnimationFrame(() => {
        const r = b.getBoundingClientRect(), st = document.getElementById('card').getBoundingClientRect();
        const k = (NL.Stage && NL.Stage.scale) || 1;
        const M = 18;                                    /* stage margin */
        const avail = side === 'left'
          ? (r.right - st.left) / k - M
          : (st.right - r.left) / k - M;
        if (r.width / k > avail) b.style.maxWidth = Math.max(170, Math.floor(avail)) + 'px';

        requestAnimationFrame(() => {
          const r2 = b.getBoundingClientRect();
          let over = 0;
          if (r2.right > st.right - M * k) over = (r2.right - (st.right - M * k)) / k;
          if (r2.left < st.left + M * k)   over = -((st.left + M * k) - r2.left) / k;
          if (over) {
            if (b.style.left) b.style.left = (parseFloat(b.style.left) - over) + 'px';
            else b.style.right = (parseFloat(b.style.right) + over) + 'px';
          }
          const top = (r2.top - st.top) / k;
          if (top < 70 && b.style.bottom) b.style.bottom = (parseFloat(b.style.bottom) - (70 - top)) + 'px';
          b.classList.add('show');
        });
      });
      NL.Sfx.play('pop');
      /* speech clears itself once it has been read, so it never lingers
         over the diagram; o.life = 0 keeps it until the next line       */
      const life = o.life === undefined
        ? Math.min(9000, 2400 + b.textContent.length * 62)
        : o.life;
      if (life) setTimeout(() => { if (this._bubble === b) this.hush(); }, life);
      return wait(o.hold === undefined ? 260 : o.hold);
    }

    hush() {
      const b = this._bubble;
      this._bubble = null;
      if (!b) return;
      b.classList.remove('show');
      setTimeout(() => b.remove(), 300);
    }

    hide()  { this.anchor.classList.add('hidden'); this.hush(); return this; }
    show()  { this.anchor.classList.remove('hidden'); return this; }

    /* ---------- reusable reactions ---------- */
    async react(kind, line, o) {
      o = o || {};
      if (kind === 'ok') {
        this.set(o.state || 'correct');
        NL.Sfx.play('ok');
        this.squash();
      } else if (kind === 'wow') {
        this.set('excited'); NL.Sfx.play('win'); this.squash();
      } else {
        this.set(o.state || 'incorrect');
        NL.Sfx.play('near');
        this.shake();
      }
      if (line) await this.say(line, o);
      return this;
    }
  }

  NL.Swiftee = Swiftee;
})(window.NL);
