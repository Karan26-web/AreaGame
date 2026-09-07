/* ============================================================
   NL.Lesson — the lesson shell.
   * one persistent 1280x720 stage, uniformly scaled
   * one persistent SVG board (groups survive between stages by
     key, which is what makes the trapezium feel continuous)
   * one persistent Swiftee
   * stages are async functions: they build, choreograph, wait for
     the learner, then `await ctx.ready()` to hand over.
   ============================================================ */
(function (NL) {
  const { h, s } = NL;
  const { wait } = NL.Anim;

  const stages = [];

  /* the composition canvas: heading + panel + a strip of Mars below */
  const CANVAS = { w: 1520, h: 1010 };

  const Stage = {
    scale: 1,
    fit() {
      const st = document.getElementById('stage');
      const pad = window.innerWidth < 900 ? 10 : 20;
      const k = Math.min((window.innerWidth - pad * 2) / CANVAS.w,
                         (window.innerHeight - pad * 2) / CANVAS.h);
      Stage.scale = Math.max(.25, Math.min(k, 1.4));
      st.style.transform = `translate(-50%, -50%) scale(${Stage.scale})`;
    }
  };

  function board(svg) {
    return {
      svg,
      g(key) {
        let el = svg.querySelector(`g[data-key="${key}"]`);
        if (!el) { el = s('g', { 'data-key': key }); svg.appendChild(el); }
        return el;
      },
      fresh(key) { this.remove(key); return this.g(key); },
      has(key) { return !!svg.querySelector(`g[data-key="${key}"]`); },
      remove(key) { const e = svg.querySelector(`g[data-key="${key}"]`); if (e) e.remove(); },
      raise(key) { const e = this.g(key); svg.appendChild(e); return e; },
      keys() { return [...svg.querySelectorAll('g[data-key]')].map(g => g.dataset.key); },
      async clearExcept(keep, dur) {
        const kill = [...svg.querySelectorAll('g[data-key]')].filter(g => keep.indexOf(g.dataset.key) < 0);
        kill.forEach(g => {
          g.style.transition = `opacity ${dur || 300}ms var(--ease)`;
          g.style.opacity = 0;
        });
        if (kill.length) await wait(dur || 300);
        kill.forEach(g => g.remove());
      }
    };
  }

  const Lesson = {
    register(def) { stages.push(def); return def; },
    get stages() { return stages; },
    index: 0,
    sig: null,

    async boot() {
      this.stageEl = document.getElementById('stage');
      this.uiLayer = document.getElementById('ui-layer');
      this.fxLayer = document.getElementById('fx-layer');
      this.board = board(document.getElementById('board'));
      this.swiftee = new NL.Swiftee(document.getElementById('swiftee-layer'));
      this.card = document.getElementById('card');
      this.head = document.getElementById('lesson-head');
      this.headTitle = document.getElementById('lesson-title');
      this.headSub = document.getElementById('lesson-sub');
      this.pbar = document.querySelector('#progress i');

      document.getElementById('sound').addEventListener('click', e => {
        const on = NL.Sfx.toggle();
        e.currentTarget.style.color = on ? '' : 'var(--line)';
      });

      window.addEventListener('resize', Stage.fit);
      Stage.fit();

      window.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          const b = this.uiLayer.querySelector('.cta-next');
          if (b) b.click();
        }
        if (e.key === 'ArrowLeft') this.back();
      });

      this.opening = true;
      await this.open();
      this.opening = false;
      const q = this._queued;
      this._queued = null;
      this.goto(q ? q[0] : 0, q ? q[1] : { first: true });
    },

    /* ---------- the opening sequence ----------
       world → atmosphere → Swiftee → panel → heading → lesson        */
    async open() {
      const { wait } = NL.Anim;
      const n = this.swiftee;
      NL.World.build();

      /* ?skip jumps straight into the lesson (used when re-entering) */
      if (/(\?|&)skip/.test(location.search)) {
        ['w-sky', 'w-mid', 'w-ground', 'w-stars', 'w-dust'].forEach(id => {
          const e = document.getElementById(id); e.style.transition = 'none'; e.style.opacity = 1;
        });
        document.getElementById('w-haze').style.opacity = 1;
        NL.World.ready = true;
        this.card.classList.add('on');
        n.resize(161).place(214, 660, true).set('idle');
        return;
      }
      n.hide();
      n.resize(161).place(-190, 786, true);

      await NL.World.reveal();

      /* Swiftee flies in across the Mars ground, below the panel */
      n.show(); n.set('walk', { flip: false });
      NL.Sfx.play('whoosh');
      await n.to(214, 782, { dur: 900, arc: 54, then: 'curious' });
      NL.Sfx.play('land');
      await n.fx('hop');
      await wait(180);
      n.set('wink'); await wait(620);      /* long enough for the wink to read */
      n.set('curious'); await wait(220);

      /* the panel is placed into the world */
      NL.Sfx.play('card');
      this.card.classList.add('on');
      await wait(420);
      this.setHead('Area of a Trapezium',
        'A trapezium is a 4-sided shape with <em>one pair of parallel sides.</em>');
      await wait(700);
    },

    /* ---------- lesson heading, set on the world ---------- */
    setHead(title, sub) {
      const head = this.head, t = this.headTitle, b = this.headSub;
      if (!title && !sub) { head.classList.remove('on'); return; }
      if (t.innerHTML === title && b.innerHTML === (sub || '')) return;
      const write = () => {
        t.innerHTML = title || '';
        b.innerHTML = sub || '';
        head.classList.add('on');
      };
      if (!head.classList.contains('on')) return write();
      head.classList.remove('on');
      clearTimeout(this._headT);
      this._headT = setTimeout(write, 260);
    },

    async goto(i, opts) {
      opts = opts || {};
      if (i < 0 || i >= stages.length) return;
      /* the opening owns the screen until it is done */
      if (this.opening) { this._queued = [i, opts]; return; }
      if (this.sig) this.sig.cancel();
      const sig = this.sig = NL.Anim.signal();
      const prev = stages[this.index];
      this.index = i;
      const def = stages[i];

      /* retire the previous stage's UI */
      const oldUi = this.uiLayer.querySelector('.stage-ui');
      if (oldUi) {
        oldUi.style.transition = 'opacity 260ms var(--ease)';
        oldUi.style.opacity = 0;
        setTimeout(() => oldUi.remove(), 300);
      }
      this.fxLayer.innerHTML = '';
      this.swiftee.hush();

      /* keep only the board groups the incoming stage wants */
      const keep = (opts.back ? [] : (def.keep || []));
      await this.board.clearExcept(keep, oldUi ? 260 : 0);
      if (sig.cancelled) return;

      /* a concept boundary gets a dust sweep and a breath from the panel */
      if (!opts.first && (def.act === true)) {
        NL.World.dustSweep();
        this.card.classList.add('settling');
        this.card.classList.remove('on');
        await NL.Anim.wait(300);
        if (sig.cancelled) return;
        this.card.classList.add('on');
        setTimeout(() => this.card.classList.remove('settling'), 360);
      } else if (!opts.first) {
        NL.Sfx.play('nav');
      }

      /* heading on the world */
      this.setHead(def.title === null ? '' : (def.title || 'Area of a Trapezium'), def.sub || '');

      document.getElementById('back').classList.toggle('gone', i === 0);
      this.pbar.style.width = ((i + 1) / stages.length * 100).toFixed(1) + '%';

      const host = h('div.stage-ui');
      this.uiLayer.appendChild(host);

      const ctx = this.makeCtx(host, sig, def);
      try {
        await def.enter(ctx);
      } catch (err) { console.error('[stage ' + def.id + ']', err); }
      if (!sig.cancelled) this.next();
    },

    makeCtx(host, sig, def) {
      const L = this;
      const ctx = {
        sig, def,
        board: L.board,
        swiftee: L.swiftee,
        fx: L.fxLayer,
        host,
        add(...els) { els.forEach(e => e && host.appendChild(e)); return els[0]; },
        /* build + fade in */
        show(el, o) { host.appendChild(el); NL.UI.appear(el, o); return el; },
        wait: ms => NL.Anim.wait(ms, sig),
        tween: (d, f, o) => NL.Anim.tween(d, f, Object.assign({ sig }, o)),
        draw: (el, d, o) => { NL.Sound.playShape('draw'); return NL.Anim.draw(el, d, Object.assign({ sig }, o)); },
        world: NL.World,
        sfx: n => NL.Sfx.play(n),

        /* the hand-over beat: Swiftee steps back, a soft cue, then silence.
           Used at every explanation -> interaction seam so the learner
           learns the rhythm of the lesson rather than reading a cue.     */
        async turn(o) {
          o = o || {};
          L.swiftee.hush();
          L.swiftee.set(o.state || 'listening');
          NL.Sound.playUI('nav');
          await NL.Anim.wait(o.pause === undefined ? 420 : o.pause, sig);
        },

        /* the heading on the world, updatable mid-stage */
        head(title, sub) { L.setHead(title, sub); },

        /* replaceable copy blocks: the previous one cross-fades out */
        headline(html, box) {
          const old = host.querySelector('.instruction');
          if (old) { old.classList.remove('instruction'); NL.UI.vanish(old, 200); }
          const el = NL.UI.instruction(html, box);
          host.appendChild(el); NL.UI.appear(el, { dy: 8 });
          return el;
        },
        note(html, box) {
          const old = host.querySelector('.subline');
          if (old) { old.classList.remove('subline'); NL.UI.vanish(old, 200); }
          const el = NL.UI.subline(html, box);
          host.appendChild(el); NL.UI.appear(el, { dy: 8 });
          return el;
        },

        /* primary hand-over: shows the CTA and resolves on click */
        ready(label, o) {
          o = o || {};
          const old = host.querySelector('.cta-next');
          if (old) old.remove();
          return new Promise(res => {
            const b = NL.UI.btn(label || 'Next', () => { if (!sig.cancelled) res(); }, {
              box: o.box || { r: 34, b: 30 }, small: o.small
            });
            b.classList.add('cta-next');
            host.appendChild(b);
            NL.UI.appear(b, { dy: 10 });
          });
        },

        /* an inline gate ("tap to keep going") that removes itself */
        gate(label, o) {
          o = o || {};
          return new Promise(res => {
            const b = NL.UI.btn(label || 'Continue', () => {
              NL.UI.vanish(b, 180);
              if (!sig.cancelled) res();
            }, { box: o.box || { r: 34, b: 30 }, ghost: o.ghost, small: o.small });
            b.classList.add('cta-next');
            host.appendChild(b);
            NL.UI.appear(b, { dy: 10 });
          });
        },

        /* wait for any one-shot learner action */
        once() {
          let done;
          const p = new Promise(r => done = r);
          p.resolve = v => done(v);
          return p;
        }
      };
      return ctx;
    },

    next() { if (this.index < stages.length - 1) this.goto(this.index + 1); },
    back() { if (this.index > 0) this.goto(this.index - 1, { back: true }); },
    restart() { this.goto(0, { back: true }); }
  };

  NL.Stage = Stage;
  NL.Lesson = Lesson;
})(window.NL);
