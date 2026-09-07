/* ============================================================
   NL.Nibi — the recurring learning companion.
   One component, many semantic states, driven from the provided
   sprite sheet (frames pre-cut to /assets/nibi/*.png).
   Nibi is positioned by its FEET: (x = centre, y = ground line).
   ============================================================ */
(function (NL) {
  const { h, clamp } = NL;
  const { wait, tween } = NL.Anim;
  const DIR = 'assets/nibi/';

  /* semantic state -> sprite frame(s) */
  const STATE = {
    idle:        { loop: ['idle1','idle2','idle3','idle4','idle5','idle6'], fps: 7, pingpong: true },
    walk:        { loop: ['walk1','walk2','walk3','walk4','walk5','walk6','walk7','walk8'], fps: 12 },
    thinking:    'thinking',
    pondering:   { loop: ['thinking','thinkingPose'], fps: .9 },

    happy: 'happy',            excited: 'excited',        curious: 'curious',
    confused: 'confused',      surprised: 'surprised',    proud: 'proud',
    mistake: 'oops',           determined: 'determined',  wink: 'wink',
    sad: 'sad',                frustrated: 'frustrated',  tired: 'tired',

    'point-left': 'pointLeft', 'point-right': 'pointRight',
    'look-left':  'curiousLook','look-right': 'curiousLook',
    explaining: 'explaining',  presenting: 'presenting',  celebrate: 'cheering',
    listening: 'listening',    wave: 'wave',              attention: 'callingAttention',
    hint: 'idea',              thumbs: 'thumbsUp',        encouraging: 'encourage',
    correct: 'celebrate',      incorrect: 'incorrect',    realization: 'realization',
    measuring: 'measuring',    observing: 'lookingAtShape',
    diagram: 'explainingDiagram', teaching: 'pointToText', peek: 'peek',

    split: 'morphSplit',       merge: 'morphMerge',       stretch: 'morphStretch',
    squish: 'morphSquish',     flatten: 'morphFlatten',   normal: 'morphNormal'
  };

  const ALL = (() => {
    const set = new Set();
    Object.values(STATE).forEach(v => (typeof v === 'string' ? [v] : v.loop).forEach(f => set.add(f)));
    return [...set];
  })();

  /* keep sprites warm so state changes never flicker */
  const cache = {};
  ALL.forEach(f => { const im = new Image(); im.src = DIR + f + '.png'; cache[f] = im; });

  class Nibi {
    constructor(layer) {
      this.anchor = h('div#nibi');
      this.shadow = h('div.nibi-shadow');
      this.body   = h('div.nibi-body');
      this.img    = document.createElement('img');
      this.img.alt = 'Nibi';
      this.body.appendChild(this.img);
      this.anchor.append(this.shadow, this.body);
      layer.appendChild(this.anchor);

      this.x = 640; this.y = 620; this.size = 132; this.flip = false;
      this.state = null; this._raf = null; this._bubble = null;
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

    /* smooth travel; `walk` plays the walk cycle, `hop` gives a little jump */
    async to(x, y, o) {
      o = o || {};
      const dur = o.dur === undefined ? 620 : o.dur;
      const goingLeft = x < this.x - 4;
      if (o.size !== undefined) this.resize(o.size);
      const prev = this.state;
      if (o.walk !== false && Math.abs(x - this.x) > 60) {
        this.set('walk', { flip: goingLeft });
        this.bob(false);
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
      this.set(o.then || (prev && prev !== 'walk' ? prev : 'idle'), { flip: o.keepFlip ? goingLeft : false });
      this.bob(true);
      return this;
    }

    resize(px) {
      this.size = px;
      this.img.style.height = px + 'px';
      this.shadow.style.width = (px * .56) + 'px';
      return this;
    }

    /* ---------- sprite state ---------- */
    set(name, o) {
      o = o || {};
      const def = STATE[name] || STATE.idle;
      this.state = name;
      this.flip = !!o.flip;
      this.body.style.transform = `translateX(-50%) scaleX(${this.flip ? -1 : 1})`;
      cancelAnimationFrame(this._raf); this._raf = null;
      if (typeof def === 'string') {
        this.frame(def);
      } else {
        const fs = def.loop, fps = def.fps || 8;
        const seqFrames = def.pingpong ? fs.concat(fs.slice(1, -1).reverse()) : fs;
        let i = 0, last = 0;
        const step = now => {
          if (now - last > 1000 / fps) { this.frame(seqFrames[i % seqFrames.length]); i++; last = now; }
          this._raf = requestAnimationFrame(step);
        };
        this._raf = requestAnimationFrame(step);
      }
      this.img.style.height = this.size + 'px';
      return this;
    }

    frame(f) {
      this._frame = f;
      const src = DIR + f + '.png';
      if (this.img.getAttribute('src') !== src) this.img.setAttribute('src', src);
      return this;
    }

    /* rendered width of the current frame — sprite widths vary a lot
       (a pointing pose is far wider than an idle one), so speech has to
       clear the real silhouette rather than a fraction of the height   */
    spriteWidth() {
      const im = cache[this._frame];
      const ratio = im && im.naturalHeight ? im.naturalWidth / im.naturalHeight : .88;
      return this.size * ratio;
    }

    bob(on) { this.body.classList.toggle('nibi-anim-bob', !!on); return this; }

    /* one-shot body flourishes */
    fx(kind) {
      const cls = 'nibi-anim-' + kind;
      this.img.classList.remove(cls);
      void this.img.offsetWidth;
      this.img.classList.add(cls);
      return wait(kind === 'squash' ? 620 : 520);
    }
    squash() { return this.fx('squash'); }
    hop()    { return this.fx('hop'); }
    shake()  { return this.fx('shake'); }
    pop()    { return this.fx('pop'); }

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
         rather than sliding back across Nibi's face                     */
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

  NL.Nibi = Nibi;
  NL.NibiStates = STATE;
})(window.NL);
