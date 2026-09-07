/* ============================================================
   ACT 1 — from familiar shapes to the trapezium family
   Stages 01-05
   ============================================================ */
(function (NL) {
  const { h, s, Geo, UI, Lesson } = NL;
  const G = Geo;

  /* draw a shape centred inside a card svg */
  function centred(svg, w, hh, make, cls, dy) {
    const sh = make();
    const b = sh.bbox;
    const outer = s('g', {
      transform: `translate(${(w - (b.x1 - b.x0)) / 2 - b.x0}, ${(hh - (b.y1 - b.y0)) / 2 - b.y0 + (dy || 0)})`
    });
    const g = s('g');                       /* the entrance animates this */
    outer.appendChild(g);
    g.appendChild(G.poly(sh, { class: 'shape ' + (cls || '') }));
    svg.appendChild(outer);
    return { g, sh, outer };
  }

  /* ------------------------------------------------------------
     01 — WARM UP : drag each name onto its shape
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'warmup', label: 'Warm-up',
    title: null,
    async enter(ctx) {
      const { swiftee } = ctx;

      /* Swiftee steps up from the Mars ground onto the panel */
      swiftee.resize(159);
      if (swiftee.y > 700) await swiftee.to(206, 600, { sig: ctx.sig, dur: 560, arc: 40, then: 'excited' });
      else swiftee.place(206, 600, true).set('excited');

      /* three familiar shapes */
      const defs = [
        { id: 'rect',   cap: '', make: () => G.rect({ x: 0, y: 0, w: 190, h: 126 }) },
        { id: 'square', cap: '', make: () => G.rect({ x: 0, y: 0, w: 140, h: 140 }) },
        { id: 'tri',    cap: '', make: () => G.tri({ x: 0, y: 0, w: 172, h: 142 }) }
      ];
      const CW = 272, CH = 200, X = [156, 504, 852];
      const cards = UI.cardGrid({
        box: { l: 156, t: 92 }, cols: 3, cw: CW, ch: CH, gap: 76,
        items: defs.map(d => ({ id: d.id, draw: (svg, w, hh) => { d.node = centred(svg, w, hh, d.make); } })),
        onPick() {}
      });
      cards.lock();
      ctx.add(cards.el);
      defs.forEach((d, i) => G.popIn(d.node.g, d.node.sh.center, { delay: 160 + i * 170 }));
      ctx.show(UI.subline('Drag each name to its shape.', { cx: 640, t: 44 }), { delay: 620 });

      /* label slots + shuffled chips */
      const names = { rect: 'Rectangle', square: 'Square', tri: 'Triangle' };
      const order = NL.shuffle(['rect', 'square', 'tri']);
      const chipX = [438, 664, 890];

      const drag = UI.dragSet({
        host: ctx.host,
        slots: defs.map((d, i) => ({ id: d.id, x: X[i] + (CW - 204) / 2, y: 318, w: 204, h: 58, ph: '' })),
        chips: order.map((id, i) => ({ id, label: names[id], x: chipX[i], y: 404 })),
        accept: (chip, slot) => chip.id === slot.id,
        async onAccept(chip, slot) {
          const i = defs.findIndex(d => d.id === slot.id);
          cards.mark(slot.id, 'ok');
          swiftee.set('happy'); swiftee.squash();
          NL.Sound.playSuccess('correct');
        },
        async onReject(chip, slot) {
          const hints = {
            rect: "Hmm… that one has <b>4 sides</b>, and two of them are longer.",
            square: "Look again — that shape has <b>4 equal</b> sides.",
            tri: "Count the corners on that one — a triangle has only <b>3</b>."
          };
          swiftee.set('curious'); swiftee.shake();
          await swiftee.say(hints[slot.id], { side: 'right', w: 260 });
        },
        async onComplete() {
          swiftee.set('celebrate');
          swiftee.squash();
          ctx.sfx('win');
          UI.sparks(ctx.fx, 640, 220, 10);
          await swiftee.say("Nice — your shape memory is warm! 🔥", { side: 'right' });
          ready.resolve();
        }
      });

      await swiftee.say("Let’s see what you remember.", { side: 'right', w: 240 });
      const ready = ctx.once();
      await ready;

      /* ------------------------------------------------------------
         Beat 2 — the one fact today's derivation will stand on.
         Same letters, same colours the trapezium will use later, on
         a shape the learner already owns.
         ------------------------------------------------------------ */
      swiftee.hush();
      await ctx.wait(420);
      await swiftee.to(160, 600, { sig: ctx.sig, then: 'curious', dur: 420 });
      UI.vanish(cards.el, 320);
      Object.values(drag.chips).forEach(c => UI.vanish(c, 320));
      Object.values(drag.slots).forEach(sl => UI.vanish(sl, 320));
      await ctx.wait(380);
      ctx.host.querySelectorAll('.subline').forEach(e => UI.vanish(e, 200));
      ctx.head('One You Already Know', 'The area of a <em>rectangle</em> is base × height.');

      const g = ctx.board.fresh('warm');
      const R = G.rect({ x: 240, y: 166, w: 330, h: 210 });
      const rp = G.poly(R);
      g.appendChild(rp);
      await G.popIn(rp, R.center, { dur: 560 });
      await ctx.wait(160);

      swiftee.set('point-right');
      const be = G.edge(R.bottom[0], R.bottom[1], 'para'); g.appendChild(be);
      await ctx.draw(be, 380);
      const bl = G.label(R.x + R.w / 2, R.y + R.h + 32, 'b', 'para'); g.appendChild(bl); UI.appear(bl);
      const he = G.edge(R.TL, R.BL, 'hgt'); g.appendChild(he);
      await ctx.draw(he, 340);
      g.appendChild(G.rightAngle(R.BL, R.BR, R.TL, 14));
      const hl = G.label(R.x - 24, R.y + R.h / 2, 'h', 'hgt', 'end'); g.appendChild(hl); UI.appear(hl);
      ctx.sfx('pop');

      await ctx.turn();
      ctx.show(UI.instruction('What is its area?', { l: 700, t: 236, w: 400 }));
      const q = ctx.once();
      const ch = UI.choices({
        box: { l: 700, t: 302 }, dir: 'col', cw: 300,
        items: [
          { id: 'bh',   label: 'b × h' },
          { id: 'sum',  label: 'b + h' },
          { id: 'half', label: '½ × b × h' }
        ],
        onPick: async (it, el, api) => {
          api.busy(true);
          if (it.id === 'bh') {
            api.mark('bh', 'ok'); api.dimOthers('bh'); api.lock();
            const tint = G.poly(R, { fill: 'var(--para)', stroke: 'none' });
            tint.style.opacity = 0; tint.style.transition = 'opacity 460ms var(--ease)';
            g.insertBefore(tint, be);
            requestAnimationFrame(() => tint.style.opacity = .12);
            const f = UI.formula([
              { v: 'A' }, { op: '=' }, { v: 'b', k: 'para' }, { op: '×' }, { v: 'h', k: 'hgt' }
            ], { l: 700, t: 236 }, { size: 38 });
            ctx.host.querySelectorAll('.instruction').forEach(e => UI.vanish(e, 200));
            ctx.show(f.el, { delay: 220 });
            await swiftee.react('ok', 'Hold on to that one — we build on it today.', { side: 'right', w: 250 });
            q.resolve();
          } else {
            api.mark(it.id, 'near');
            await swiftee.react('wrong', it.id === 'sum'
              ? 'Adding the sides gives the distance <b>around</b> it, not the space inside.'
              : 'That would be a <b>triangle</b> — exactly half of this rectangle.',
              { side: 'right', w: 250 });
            api.clearMarks(); api.busy(false);
          }
        }
      });
      ctx.show(ch.el, { delay: 140 });
      await q;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     02 — MEET THE TRAPEZIUM : find the parallel pair
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'meet', label: 'Meet the trapezium', act: true,
    title: 'What is a Trapezium?',
    sub: 'Three shapes you know… and one that’s <em>new</em>.',
    async enter(ctx) {
      const { swiftee, board } = ctx;
      const g = board.fresh('meet');

      /* ---- the three shapes they already own: small, quiet, to one side ---- */
      const known = [
        { sh: G.tri({ x: 96, y: 336, w: 96, h: 84 }), name: 'triangle' },
        { sh: G.rect({ x: 214, y: 348, w: 100, h: 72 }), name: 'rectangle' },
        { sh: G.rect({ x: 340, y: 340, w: 80, h: 80 }), name: 'square' }
      ];
      known.forEach((k, i) => {
        const gg = s('g');
        gg.appendChild(G.poly(k.sh, { class: 'shape inert' }));
        gg.appendChild(G.label(k.sh.center.x, 448, k.name, 'name'));
        g.appendChild(gg);
        G.popIn(gg, k.sh.center, { delay: 140 + i * 160 });
      });
      const knownNote = ctx.show(UI.subline('You already know these.', { l: 96, t: 268, w: 320 }), { delay: 300 });

      /* the newcomer: the hero of this stage, and much larger than the rest */
      const T = G.trap({ x: 560, y: 190, a: 150, b: 380, h: 230, type: 'iso' });

      /* ---- Swiftee walks on and finds the stage empty ---- */
      swiftee.place(-150, 600, true).resize(154).set('walk');
      await ctx.wait(620);
      NL.Sound.playCharacter('whoosh');
      await swiftee.to(470, 600, { sig: ctx.sig, dur: 1000, then: 'curious' });
      await ctx.wait(260);

      /* ---- the shape DRAWS itself: an object arriving, not a slide ---- */
      swiftee.set('surprised');
      const tg = s('g');
      const poly = G.poly(T, { fill: 'none' });
      tg.appendChild(poly);
      g.appendChild(tg);
      await ctx.draw(poly, 1150);
      poly.style.transition = 'fill 520ms var(--ease)';
      poly.setAttribute('fill', 'var(--shape-fill)');
      NL.Sound.playShape('shape');
      await swiftee.fx('hop');
      await swiftee.say('Ooh! What <b>is</b> that?', { side: 'right', w: 210 });

      /* ---- Swiftee shows the learner where to look ----
         the top side lights up while Swiftee points at it; then Swiftee walks
         the whole length of the bottom side while that one lights up,
         so the two sides are introduced as a matched pair            */
      swiftee.hush();
      const hintTop = G.edge(T.top[0], T.top[1], 'tapzone');
      const hintBot = G.edge(T.bottom[0], T.bottom[1], 'tapzone');
      hintTop.style.opacity = 0; hintBot.style.opacity = 0;
      g.append(hintTop, hintBot);

      swiftee.set('point-right');
      hintTop.style.opacity = .6;
      NL.Sound.playShape('paraTick');
      await ctx.wait(1000);
      hintTop.style.opacity = 0;

      swiftee.set('walk');
      hintBot.style.opacity = .6;
      NL.Sound.playShape('paraTick');
      await swiftee.to(T.bottom[1].x - 60, 600, { sig: ctx.sig, dur: 1200, arc: 0, then: 'curious', walk: false });
      await ctx.wait(320);
      hintBot.style.opacity = 0;
      /* and they go: left in the group they would be caught by the dimming
         pass below and become a standing 34% highlight on the correct pair,
         which hands the learner the answer */
      hintTop.remove(); hintBot.remove();

      /* ---- hand over ---- */
      swiftee.hush();
      await swiftee.to(486, 600, { sig: ctx.sig, then: 'curious', size: 138 });
      [...g.children].forEach(e => {
        if (e === tg) return;
        e.style.transition = 'opacity 500ms var(--ease)';
        e.style.opacity = .34;
      });
      UI.vanish(knownNote, 240);
      await ctx.turn();
      /* The task sits directly above the shape it is about, not away in the
         corner: the learner's eye is already on the trapezium, and an
         instruction it has to go looking for is an instruction it misses. */
      const ask = ctx.show(UI.instruction(
        'Tap the <b>two sides</b> you think are parallel.',
        { cx: T.center.x, t: 92, w: 430 }));
      /* and a plain count, so "how many?" and "am I done?" are both answered
         without reading the sentence again */
      const tally = ctx.show(UI.tag('0 of 2 chosen', { cx: T.center.x, t: 470 }), { delay: 260 });

      const edges = {
        top:  { pts: T.top,    adj: ['legL', 'legR'] },
        bot:  { pts: T.bottom, adj: ['legL', 'legR'] },
        legL: { pts: T.legL,   adj: ['top', 'bot'] },
        legR: { pts: T.legR,   adj: ['top', 'bot'] }
      };
      const hl = s('g'); g.insertBefore(hl, tg);   /* halo under the outline */
      const marks = s('g'); g.appendChild(marks);
      const overlay = {};
      Object.keys(edges).forEach(k => {
        const [p, q] = edges[k].pts;
        const line = G.edge(p, q, 'tapzone');
        line.style.opacity = 0;
        hl.appendChild(line);
        overlay[k] = line;
      });

      let picked = [], busy = false, hovered = null, touched = false;
      const done = ctx.once();

      /* every side gets a visible, hoverable handle — the learner should
         never have to guess what can be touched                          */
      Object.keys(edges).forEach((k, i) => {
        const [p, q] = edges[k].pts;
        const hit = G.hit(p, q, () => choose(k));
        hit.addEventListener('pointerenter', () => { hovered = k; paint(); });
        hit.addEventListener('pointerleave', () => { if (hovered === k) hovered = null; paint(); });
        g.appendChild(hit);
        setTimeout(() => {
          overlay[k].style.removeProperty('opacity');   /* CSS owns it from here */
          paint();
          NL.Sound.playUI('tap');
        }, 180 + i * 140);
      });

      function paint() {
        Object.keys(overlay).forEach(k => {
          const on = picked.indexOf(k) >= 0;
          const el = overlay[k];
          /* the four handles keep pulsing until the learner touches one:
             an affordance that fades out after two beats is an affordance
             that is gone by the time it is needed */
          el.setAttribute('class', 'edge ' + (on ? 'pick' : 'tapzone')
                                 + (!on && !touched ? ' hint' : '')
                                 + (hovered === k && !on ? ' hot' : ''));
        });
        if (tally) tally.innerHTML = picked.length + ' of 2 chosen';
      }

      async function choose(k) {
        if (busy) return;
        if (picked.indexOf(k) >= 0) { picked = picked.filter(x => x !== k); touched = true; paint(); return; }
        picked.push(k); touched = true; ctx.sfx('tick'); paint();
        if (picked.length < 2) return;
        busy = true;
        const [a, b] = picked;
        const isPair = (a === 'top' && b === 'bot') || (a === 'bot' && b === 'top') || (a === 'legL' && b === 'legR') || (a === 'legR' && b === 'legL');

        if (a === 'top' && b === 'bot' || a === 'bot' && b === 'top') {
          /* correct */
          swiftee.set('correct'); ctx.sfx('ok'); swiftee.squash();
          marks.appendChild(G.parallelMark(T.top[0], T.top[1], 1));
          marks.appendChild(G.parallelMark(T.bottom[0], T.bottom[1], 1));
          UI.sparks(ctx.fx, T.center.x, T.center.y, 8);
          await swiftee.say("Exactly! These two run side by side <b>forever</b>.", { side: 'right', w: 250 });
          done.resolve();
          return;
        }

        if (isPair) {
          /* the two slanted legs — extend them and watch them close in */
          swiftee.set('confused');
          const A = T.legL, B = T.legR;
          const ip = intersect(A[0], A[1], B[0], B[1]);
          const rays = s('g');
          g.appendChild(rays);
          [A, B].forEach(seg => {
            const r = s('line', {
              x1: seg[1].x, y1: seg[1].y, x2: seg[1].x, y2: seg[1].y,
              stroke: 'var(--warn)', 'stroke-width': 2.5, 'stroke-dasharray': '7 7', 'stroke-linecap': 'round'
            });
            rays.appendChild(r);
            NL.Anim.tween(620, t => {
              r.setAttribute('x2', seg[1].x + (ip.x - seg[1].x) * t);
              r.setAttribute('y2', seg[1].y + (ip.y - seg[1].y) * t);
            }, { sig: ctx.sig });
          });
          await ctx.wait(660);
          const dot = s('circle', { cx: ip.x, cy: ip.y, r: 0, fill: 'var(--warn)' });
          rays.appendChild(dot);
          await ctx.tween(280, t => dot.setAttribute('r', 7 * t), { ease: 'back' });
          ctx.sfx('boing');
          await swiftee.react('near', "They <b>meet</b> up there! Parallel sides never touch.", { side: 'right', w: 250 });
          await ctx.wait(950);
          UI.vanish(rays, 240);
        } else {
          /* adjacent sides already share a corner */
          const shared = sharedPoint(edges[a].pts, edges[b].pts);
          const dot = s('circle', { cx: shared.x, cy: shared.y, r: 0, fill: 'var(--warn)' });
          g.appendChild(dot);
          await ctx.tween(300, t => dot.setAttribute('r', 8 * t), { ease: 'back' });
          ctx.sfx('boing');
          await swiftee.react('near', "Those two already touch — right at that corner!", { side: 'right', w: 250 });
          await ctx.wait(950);
          UI.vanish(dot, 240);
        }
        picked = []; paint(); busy = false;
        swiftee.set('listening');
      }

      await done;
      swiftee.hush();

      /* build the definition, one idea at a time */
      ask.remove();
      if (tally) UI.vanish(tally, 200);
      ctx.head('What is a Trapezium?', 'A trapezium is a 4-sided shape with <em>one pair of parallel sides</em>.');
      NL.Sound.playDiscovery();
      ctx.show(UI.instruction('Just <b>one</b> pair.', { l: 60, t: 92, w: 430 }));
      ctx.show(UI.subline('Remember that — it matters in a moment.', { l: 60, t: 142, w: 430 }), { delay: 220 });
      await ctx.ready('Next');
    }
  });

  function intersect(p1, p2, p3, p4) {
    const a1 = p2.y - p1.y, b1 = p1.x - p2.x, c1 = a1 * p1.x + b1 * p1.y;
    const a2 = p4.y - p3.y, b2 = p3.x - p4.x, c2 = a2 * p3.x + b2 * p3.y;
    const d = a1 * b2 - a2 * b1;
    if (!d) return { x: p1.x, y: p1.y };
    return { x: (b2 * c1 - b1 * c2) / d, y: (a1 * c2 - a2 * c1) / d };
  }
  function sharedPoint(e1, e2) {
    for (const p of e1) for (const q of e2) if (NL.dist(p, q) < 1) return p;
    return e1[0];
  }

  /* ------------------------------------------------------------
     03 — TRAPEZIUM vs PARALLELOGRAM (misconception check)
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'versus', label: 'Trapezium or not?',
    title: 'Are Both of These Trapeziums?',
    sub: 'Count the <em>pairs</em> of parallel sides.',
    async enter(ctx) {
      const { swiftee, board } = ctx;
      const g = board.fresh('versus');

      const T = G.trap({ x: 168, y: 128, a: 140, b: 268, h: 168, type: 'iso' });
      const P = G.para({ x: 742, y: 128, base: 232, h: 168, skew: 62 });
      const tg = s('g'), pg = s('g');
      tg.appendChild(G.poly(T)); pg.appendChild(G.poly(P));
      g.append(tg, pg);
      G.popIn(tg, T.center, { delay: 120 });
      G.popIn(pg, P.center, { delay: 300 });

      swiftee.place(1128, 600, true).resize(141).set('thinking');
      await swiftee.say('Hmm. What do you think?', { side: 'left' });

      const marksT = s('g'), marksP = s('g'), capT = s('g'), capP = s('g');
      g.append(marksT, marksP, capT, capP);

      const done = ctx.once();
      let tries = 0;

      const ch = UI.choices({
        box: { cx: 640, t: 392 }, items: [
          { id: 'both', label: 'Yes — both of them' },
          { id: 'one',  label: 'No — only one' }
        ],
        cw: 250,
        onPick: async (it, el, api) => {
          api.busy(true);
          swiftee.hush();
          tries++;
          if (it.id === 'one') {
            api.mark('one', 'ok'); api.dim('both'); api.lock();
            await swiftee.react('ok', 'Right! Let me show you why.', { side: 'left' });
            await demo();
            done.resolve();
          } else {
            api.mark('both', 'near');
            await swiftee.react('wrong', 'Almost — let’s <b>count the pairs</b> together.', { side: 'left', state: 'confused' });
            await demo();
            api.clearMarks(); api.dim('both'); api.busy(false);
            await swiftee.say('Now — how many of them are trapeziums?', { side: 'left' });
          }
        }
      });
      ctx.show(ch.el, { delay: 220 });

      async function demo() {
        swiftee.hush();
        /* trapezium: one pair */
        await swiftee.to(T.center.x, 638, { sig: ctx.sig, then: 'point-right', size: 133 });
        const t1 = G.edge(T.top[0], T.top[1], 'para'), t2 = G.edge(T.bottom[0], T.bottom[1], 'para');
        marksT.append(t1, t2);
        await Promise.all([ctx.draw(t1, 460), ctx.draw(t2, 460)]);
        marksT.append(G.parallelMark(T.top[0], T.top[1], 1), G.parallelMark(T.bottom[0], T.bottom[1], 1));
        ctx.sfx('pop');
        await swiftee.say('One pair. ✓', { side: 'right', hold: 520 });
        const l1 = G.edge(T.legL[0], T.legL[1], 'soft'), l2 = G.edge(T.legR[0], T.legR[1], 'soft');
        marksT.append(l1, l2);
        await Promise.all([ctx.draw(l1, 380), ctx.draw(l2, 380)]);
        await swiftee.say('These two lean apart — not parallel.', { side: 'right', hold: 700 });
        capT.appendChild(G.label(T.center.x, 338, 'ONE pair of parallel sides', 'tiny'));

        /* parallelogram: two pairs */
        swiftee.hush();
        await swiftee.to(P.center.x, 638, { sig: ctx.sig, then: 'point-left', size: 133 });
        const p1 = G.edge(P.top[0], P.top[1], 'para'), p2 = G.edge(P.bottom[0], P.bottom[1], 'para');
        marksP.append(p1, p2);
        await Promise.all([ctx.draw(p1, 420), ctx.draw(p2, 420)]);
        marksP.append(G.parallelMark(P.top[0], P.top[1], 1), G.parallelMark(P.bottom[0], P.bottom[1], 1));
        await swiftee.say('One pair here too…', { side: 'left', hold: 620 });
        const p3 = G.edge(P.legL[0], P.legL[1], 'para'), p4 = G.edge(P.legR[0], P.legR[1], 'para');
        marksP.append(p3, p4);
        await Promise.all([ctx.draw(p3, 420), ctx.draw(p4, 420)]);
        marksP.append(G.parallelMark(P.legL[0], P.legL[1], 2), G.parallelMark(P.legR[0], P.legR[1], 2));
        ctx.sfx('pop');
        swiftee.set('surprised');
        await swiftee.say('…and <b>another</b> pair! That makes <b>two</b>.', { side: 'left', hold: 800 });
        capP.appendChild(G.label(P.center.x, 338, 'TWO pairs — that’s a parallelogram', 'tiny'));
      }

      await done;
      swiftee.hush();
      await swiftee.to(1140, 600, { sig: ctx.sig, then: 'proud', size: 128 });
      ctx.show(UI.feedback('ok', 'A parallelogram has <b>two</b> pairs of parallel sides — so it is <b>not</b> a trapezium.', { cx: 620, t: 496, w: 700 }));
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     04 — SELECT ALL THE TRAPEZIUMS
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'select', label: 'Spot them all',
    title: 'Spot Every Trapezium',
    sub: 'Select the shapes with <em>one pair of parallel sides</em>.',
    async enter(ctx) {
      const { swiftee } = ctx;
      swiftee.place(1136, 600, true).resize(138).set('listening');

      const items = [
        { id: 'a', ok: true,  make: () => G.trap({ x: 0, y: 0, a: 90, b: 162, h: 98, type: 'iso' }) },
        { id: 'b', ok: false, make: () => G.para({ x: 0, y: 0, base: 126, h: 96, skew: 40 }) },
        { id: 'c', ok: true,  make: () => G.trap({ x: 0, y: 0, a: 112, b: 172, h: 98, type: 'right' }) },
        { id: 'd', ok: false, make: () => G.kite({ x: 0, y: 0, w: 130, h: 124 }) },
        { id: 'e', ok: true,  make: () => G.trap({ x: 0, y: 0, a: 86, b: 174, h: 98, type: 'scalene', lean: .82 }) },
        { id: 'f', ok: false, make: () => G.rect({ x: 0, y: 0, w: 158, h: 102 }) }
      ];

      const cards = UI.cardGrid({
        box: { cx: 640, t: 126 }, cols: 3, cw: 252, ch: 174, gap: 30,
        items: items.map(it => ({
          id: it.id,
          draw: (svg, w, hh) => {
            const r = centred(svg, w, hh, it.make, '', -4);
            it.shape = r.sh; it.grp = r.g; it.node = r;
            const mk = s('g', { class: 'fade-in' });
            r.outer.appendChild(mk);
            it.markLayer = mk;
          }
        })),
        onPick: (it, card, api) => { api.toggle(it.id); }
      });
      ctx.add(cards.el);
      items.forEach((it, i) => G.popIn(it.node.g, it.shape.center, { delay: 120 + i * 120 }));

      let tries = 0;
      const done = ctx.once();
      const fb = UI.feedback('near', '', { cx: 512, t: 524, w: 560 });
      fb.style.opacity = 0; ctx.add(fb);

      function say(kind, msg) {
        fb.className = 'feedback ' + kind;
        fb.querySelector('.ico').textContent = kind === 'ok' ? '✓' : '!';
        fb.querySelector('span:last-child').innerHTML = msg;
        fb.style.transition = 'opacity 260ms var(--ease)';
        fb.style.opacity = 1;
      }

      const check = UI.btn('Check', async () => {
        const sel = cards.selected();
        if (!sel.length) { swiftee.set('curious'); await swiftee.say('Pick the ones with just <b>one</b> pair.', { side: 'left', w: 210 }); return; }
        tries++;
        const wrong = sel.filter(id => !items.find(i => i.id === id).ok);
        const missed = items.filter(i => i.ok && sel.indexOf(i.id) < 0);

        if (!wrong.length && !missed.length) {
          cards.lock(); cards.clearMarks();
          items.filter(i => i.ok).forEach(i => cards.mark(i.id, 'ok'));
          items.filter(i => i.ok).forEach(i => showMarks(i, 1));
          say('ok', 'All three — exactly <b>one</b> pair each.');
          swiftee.set('celebrate'); swiftee.squash(); ctx.sfx('win');
          UI.sparks(ctx.fx, 640, 250, 12);
          await swiftee.say('You’ve got the eye for it!', { side: 'left', w: 200 });
          check.remove();
          done.resolve();
          return;
        }

        cards.clearMarks();
        wrong.forEach(id => cards.mark(id, 'near'));
        if (wrong.length) {
          const w = items.find(i => i.id === wrong[0]);
          const why = { b: 'that one has <b>two</b> pairs of parallel sides', d: 'that one has <b>no</b> parallel sides at all', f: 'that one has <b>two</b> pairs — it’s a rectangle' };
          say('near', 'Almost — ' + why[w.id] + '.');
          swiftee.set('incorrect'); ctx.sfx('near');
          await swiftee.say('Look at the sides I marked.', { side: 'left', w: 200 });
          showMarks(w, w.id === 'd' ? 0 : 2);
        } else {
          say('near', 'Good so far — but you’ve <b>missed one</b>.');
          swiftee.set('curious'); ctx.sfx('near');
          await swiftee.say('One more is hiding in there…', { side: 'left', w: 210 });
        }

        if (tries === 2) {
          await ctx.wait(700);
          swiftee.set('hint');
          NL.Sound.playHint();
          await swiftee.say('Here — I’ll mark them all.', { side: 'left', w: 200 });
          items.forEach(i => showMarks(i, i.ok ? 1 : (i.id === 'd' ? 0 : 2)));
        }
        if (tries >= 3) {
          await ctx.wait(900);
          cards.lock(); cards.clearMarks();
          items.filter(i => i.ok).forEach(i => cards.mark(i.id, 'ok'));
          say('ok', 'These three are the trapeziums — <b>one</b> pair each.');
          swiftee.set('encouraging');
          await swiftee.say('Now you know the trick: count the <b>pairs</b>.', { side: 'left', w: 220 });
          check.remove();
          done.resolve();
        }
      }, { box: { r: 34, b: 30 } });          /* where every other CTA lives */
      ctx.show(check, { delay: 300 });

      function showMarks(item, pairs) {
        if (item.marked) return;
        item.marked = true;
        const sh = item.shape, L = item.markLayer;
        if (pairs >= 1 && sh.parallels.length) {
          L.appendChild(G.parallelMark(sh.parallels[0][0], sh.parallels[0][1], 1));
          L.appendChild(G.parallelMark(sh.parallels[1][0], sh.parallels[1][1], 1));
        }
        if (pairs >= 2 && sh.parallels.length > 3) {
          L.appendChild(G.parallelMark(sh.parallels[2][0], sh.parallels[2][1], 2));
          L.appendChild(G.parallelMark(sh.parallels[3][0], sh.parallels[3][1], 2));
        }
        if (pairs === 0) {
          L.appendChild(G.label(sh.center.x, sh.bbox.y1 + 16, 'no parallel sides', 'tiny'));
        }
        L.classList.add('on');
        ctx.sfx('pop');
      }

      await done;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     05 — THE TRAPEZIUM FAMILY
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'family', label: 'The family',
    title: 'The Trapezium Family',
    sub: 'Three different looks, <em>one shared property</em>. Tap each one.',
    async enter(ctx) {
      const { swiftee, board } = ctx;
      const g = board.fresh('family');

      const kinds = [
        {
          id: 'right', name: 'Right-angled', cx: 288,
          sh: G.trap({ x: 200, y: 236, a: 116, b: 190, h: 148, type: 'right' }),
          line: 'This one stands up <b>straight</b> on one side.',
          state: 'determined',
          extra(sh, L) {
            L.appendChild(G.rightAngle(sh.BL, sh.BR, sh.TL, 15, 'var(--ink-2)'));
            L.appendChild(G.rightAngle(sh.TL, sh.TR, sh.BL, 15, 'var(--ink-2)'));
          }
        },
        {
          id: 'iso', name: 'Isosceles', cx: 640,
          sh: G.trap({ x: 545, y: 236, a: 112, b: 196, h: 148, type: 'iso' }),
          line: 'Both slanted sides are <b>equal</b> — twins!',
          state: 'happy',
          extra(sh, L) {
            L.appendChild(G.tickMark(sh.TL, sh.BL, 1));
            L.appendChild(G.tickMark(sh.TR, sh.BR, 1));
          }
        },
        {
          id: 'scal', name: 'Scalene', cx: 992,
          sh: G.trap({ x: 898, y: 236, a: 104, b: 196, h: 148, type: 'scalene', lean: .86 }),
          line: 'Every side different. A bit lopsided… still a trapezium!',
          state: 'curious',
          extra(sh, L) { L.appendChild(G.label(sh.center.x, sh.bbox.y1 + 66, 'no equal sides · no right angle', 'tiny')); }
        }
      ];

      swiftee.place(232, 600, true).resize(143).set('presenting');

      let opened = 0;
      const done = ctx.once();

      kinds.forEach((k, i) => {
        const gg = s('g', { class: 'pointer' });
        const poly = G.poly(k.sh);
        const L = s('g', { class: 'fade-in' });
        gg.append(poly, L);
        /* parallel markers are the family trait — always visible */
        gg.appendChild(G.parallelMark(k.sh.top[0], k.sh.top[1], 1));
        gg.appendChild(G.parallelMark(k.sh.bottom[0], k.sh.bottom[1], 1));
        const nm = G.label(k.cx, 426, k.name, 'name');
        gg.appendChild(nm);
        g.appendChild(gg);
        G.popIn(gg, k.sh.center, { delay: 120 + i * 170 });

        k.grp = gg; k.mark = L; k.nameEl = nm;
        gg.addEventListener('click', () => open(k));
      });

      async function open(k) {
        if (k.done) return;
        k.done = true; opened++;
        ctx.sfx('pop');
        /* gentle emphasis: scale about the shape centre */
        const c = k.sh.center;
        NL.Anim.tween(420, t => {
          const sc = 1 + .09 * t;
          k.grp.setAttribute('transform', `translate(${c.x},${c.y}) scale(${sc}) translate(${-c.x},${-c.y})`);
        }, { ease: 'back', sig: ctx.sig });
        k.nameEl.setAttribute('class', 'lbl dim');
        k.extra(k.sh, k.mark);
        k.mark.classList.add('on');
        swiftee.hush();
        await swiftee.to(Math.max(268, k.cx - 160), 664, { sig: ctx.sig, then: k.state, size: 138 });
        await swiftee.say(k.line, { side: k.cx > 800 ? 'left' : 'right' });
        if (opened === 3) {
          await ctx.wait(300);
          swiftee.hush();
          await swiftee.to(640, 600, { sig: ctx.sig, then: 'celebrate', size: 143 });
          swiftee.squash(); ctx.sfx('ok');
          await swiftee.say('All three have <b>one pair</b> of parallel sides. That’s what counts.', { side: 'up', dx: -150 });
          done.resolve();
        }
      }

      await done;
      await ctx.ready('Next');
    }
  });
})(window.NL);
