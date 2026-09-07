/* ============================================================
   ACT 2 — from "what is it?" to "why the formula works"
   Stages 06-11. The hero trapezium is a single board group
   ("hero") that survives every stage in this act, so the shape
   never jumps: only labels, copies and dimensions change.
   ============================================================ */
(function (NL) {
  const { s, Geo, UI, Lesson } = NL;
  const G = Geo;

  /* the one canonical trapezium of this lesson */
  const H = { x: 80, y: 170, a: 200, b: 360, h: 230, type: 'scalene', lean: .6875 };
  const T = G.trap(H);
  const M = G.mid(T.TR, T.BR);                       /* pivot for the copy */
  const rot = p => ({ x: 2 * M.x - p.x, y: 2 * M.y - p.y });
  const COMB = [T.TL, rot(T.BL), rot(T.TL), T.BL];   /* the parallelogram  */

  const PANEL = 540;   /* words column while the shape stands alone      */
  const DPANEL = 800;  /* words column once the copy needs the space     */

  const q = (g, id) => g.querySelector('[data-id="' + id + '"]');

  function hero(ctx) {
    const g = ctx.board.g('hero');
    if (!q(g, 'poly')) {
      const p = G.poly(T, { 'data-id': 'poly' });
      g.appendChild(p);
      G.popIn(p, T.center, { dur: 620 });
    }
    return g;
  }

  /* rebuild a, b and h on the hero (used if a learner jumps in mid-act) */
  function labelHero(g) {
    let L = q(g, 'parts');
    if (L) return L;
    L = s('g', { 'data-id': 'parts' }); g.appendChild(L);
    L.appendChild(G.edge(T.top[0], T.top[1], 'para'));
    L.appendChild(G.edge(T.bottom[0], T.bottom[1], 'para'));
    L.appendChild(G.parallelMark(T.top[0], T.top[1], 1));
    L.appendChild(G.parallelMark(T.bottom[0], T.bottom[1], 1));
    L.appendChild(G.label(T.top[0].x + T.a / 2, T.y - 26, 'a', 'para'));
    L.appendChild(G.label(T.x + T.b / 2, T.y + T.h + 30, 'b', 'para'));
    L.appendChild(G.edge(T.TL, T.foot, 'hgt'));
    L.appendChild(G.rightAngle(T.foot, T.BR, T.TL, 13));
    L.appendChild(G.label(T.TL.x + 19, T.y + T.h / 2, 'h', 'hgt', 'start'));
    return L;
  }

  /* ------------------------------------------------------------
     06 — WHAT IS AREA?  (tap to fill the shape)
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'area-intro', label: 'What is area?', keep: ['hero'], act: true,
    title: 'How Much Space?',
    sub: '<em>Area</em> is the flat space inside a shape.',
    async enter(ctx) {
      const { nibi } = ctx;
      const g = hero(ctx);

      ctx.headline('Now the big question.', { l: PANEL, t: 214, w: 460 });
      nibi.place(246, 600, true).resize(158).set('thinking');
      await ctx.wait(520);
      await nibi.say('Okay… but how much <b>space</b> does it cover?', { side: 'right', w: 290 });

      /* a unit grid, clipped to the shape, sweeps in when tapped */
      const defs = s('defs');
      const cp = s('clipPath', { id: 'heroClip' });
      cp.appendChild(s('polygon', { points: T.points }));
      const rc = s('clipPath', { id: 'sweepClip' });
      const rect = s('rect', { x: T.bbox.x0 - 4, y: T.bbox.y0 - 4, width: 0, height: T.h + 8 });
      rc.appendChild(rect);
      defs.append(cp, rc);
      g.appendChild(defs);

      const fillG = s('g', { 'clip-path': 'url(#heroClip)', 'data-id': 'areaFill' });
      const inner = s('g', { 'clip-path': 'url(#sweepClip)' });
      inner.appendChild(s('rect', {
        x: T.bbox.x0 - 4, y: T.bbox.y0 - 4, width: T.b + 8, height: T.h + 8,
        fill: 'var(--para)', opacity: .1
      }));
      for (let x = T.bbox.x0; x < T.bbox.x1 + 20; x += 20)
        inner.appendChild(s('line', { x1: x, y1: T.bbox.y0 - 4, x2: x, y2: T.bbox.y1 + 4, stroke: 'var(--para)', 'stroke-width': 1, opacity: .32 }));
      for (let y = T.bbox.y0; y < T.bbox.y1 + 20; y += 20)
        inner.appendChild(s('line', { x1: T.bbox.x0 - 4, y1: y, x2: T.bbox.x1 + 4, y2: y, stroke: 'var(--para)', 'stroke-width': 1, opacity: .32 }));
      fillG.appendChild(inner);
      g.appendChild(fillG);

      const tapper = G.poly(T, { class: 'pointer', fill: 'transparent', stroke: 'none' });
      g.appendChild(tapper);
      ctx.note('Tap the trapezium.', { l: PANEL, t: 272 });

      const done = ctx.once();
      tapper.addEventListener('click', async () => {
        if (tapper.dataset.used) return;
        tapper.dataset.used = '1';
        tapper.remove();
        ctx.sfx('swoosh');
        nibi.set('excited');
        await ctx.tween(900, t => rect.setAttribute('width', Math.max(0, (T.b + 8) * t)), { ease: 'inOut' });
        ctx.sfx('pop');
        ctx.note('<b>Area</b> is the flat space inside a shape.<br>Now — how do we <b>measure</b> it?', { l: PANEL, t: 272, w: 460 });
        await nibi.say('Counting those one by one would take <b>forever</b>. We need a rule.', { side: 'right', w: 290 });
        done.resolve();
      });

      await done;
      [...inner.querySelectorAll('line')].forEach(l => {
        l.style.transition = 'opacity 600ms var(--ease)';
        l.style.opacity = .12;                 /* the squares stay, quietly */
      });
      await ctx.ready('Let’s measure it');
    }
  });

  /* ------------------------------------------------------------
     07 — a, b and h  (height vs slanted side)
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'parts', label: 'a, b and h', keep: ['hero'],
    title: 'Naming the Parts',
    sub: 'Two <em>parallel sides</em> and one <em class="h">perpendicular height</em>.',
    async enter(ctx) {
      const { nibi } = ctx;
      const g = hero(ctx);
      const L = s('g', { 'data-id': 'parts' });
      g.appendChild(L);

      ctx.headline('Three measurements matter.', { l: PANEL, t: 214, w: 460 });

      /* --- a --- */
      nibi.place(330, 600, true).resize(148).set('point-right');
      const aE = G.edge(T.top[0], T.top[1], 'para'); L.appendChild(aE);
      await ctx.draw(aE, 420);
      const aL = G.label(T.top[0].x + T.a / 2, T.y - 26, 'a', 'para'); L.appendChild(aL);
      UI.appear(aL); ctx.sfx('pop');
      L.appendChild(G.parallelMark(T.top[0], T.top[1], 1));
      await nibi.say('This parallel side is <span class="para">a</span>.', { side: 'right' });

      /* --- b --- */
      nibi.hush();
      const bE = G.edge(T.bottom[0], T.bottom[1], 'para'); L.appendChild(bE);
      await ctx.draw(bE, 420);
      const bL = G.label(T.x + T.b / 2, T.y + T.h + 30, 'b', 'para'); L.appendChild(bL);
      UI.appear(bL); ctx.sfx('pop');
      L.appendChild(G.parallelMark(T.bottom[0], T.bottom[1], 1));
      await nibi.say('And the other one is <span class="para">b</span>.', { side: 'right' });

      /* --- Nibi's own mistake --- */
      nibi.hush();
      await nibi.to(300, 600, { sig: ctx.sig, then: 'point-left', size: 148 });
      const legE = G.edge(T.legL[0], T.legL[1], 'slant'); L.appendChild(legE);
      await ctx.draw(legE, 380);
      const legL = G.label(T.legL[0].x - 26, T.y + T.h / 2 + 6, 'h ?', 'dim', 'end'); L.appendChild(legL);
      legL.style.fill = 'var(--warn)';
      UI.appear(legL);
      nibi.set('proud');
      await nibi.say('And <b>that</b> must be the height. Easy!', { side: 'right', hold: 900 });

      nibi.hush(); nibi.set('curious'); await ctx.wait(420);
      nibi.set('confused'); await ctx.wait(560);
      nibi.set('realization'); ctx.sfx('boing');
      await nibi.say('…hold on a second.', { side: 'right', hold: 620 });

      /* stand the slanted side up next to the height: it overshoots */
      nibi.hush(); nibi.set('measuring');
      const legLen = G.len(G.sub(T.TL, T.BL));
      const stand = s('line', {
        x1: T.BL.x, y1: T.BL.y, x2: T.TL.x, y2: T.TL.y,
        stroke: 'var(--warn)', 'stroke-width': 4.5, 'stroke-linecap': 'round'
      });
      L.appendChild(stand);
      const dx = T.foot.x - T.BL.x;
      await ctx.tween(520, t => {                       /* slide it across  */
        stand.setAttribute('x1', T.BL.x + dx * t);
        stand.setAttribute('x2', T.TL.x + dx * t);
      }, { ease: 'inOut' });
      const ang0 = Math.atan2(T.TL.x - T.BL.x, T.foot.y - T.TL.y);
      await ctx.tween(720, t => {                       /* stand it upright */
        const a = ang0 * (1 - t);
        stand.setAttribute('x2', T.foot.x + Math.sin(a) * legLen);
        stand.setAttribute('y2', T.foot.y - Math.cos(a) * legLen);
      }, { ease: 'inOut' });

      const guide = s('line', {
        x1: T.x - 26, y1: T.y, x2: rot(T.BL).x, y2: T.y,
        stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '5 6', opacity: 0
      });
      const over = s('line', {
        x1: T.foot.x, y1: T.y, x2: T.foot.x, y2: T.foot.y - legLen,
        stroke: 'var(--warn)', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0
      });
      L.append(guide, over);
      guide.style.transition = over.style.transition = 'opacity 300ms';
      requestAnimationFrame(() => { guide.style.opacity = .8; over.style.opacity = .95; });
      ctx.sfx('near');
      nibi.set('surprised');
      await nibi.say('It <b>pokes out</b>! The slanted side is too long.', { side: 'right', hold: 1200 });

      [stand, over, guide, legE, legL].forEach(e => { e.style.transition = 'opacity 320ms'; e.style.opacity = 0; });
      await ctx.wait(360);
      [stand, over, guide, legE, legL].forEach(e => e.remove());

      /* --- learner picks the real height --- */
      nibi.hush();
      await nibi.to(560, 600, { sig: ctx.sig, then: 'listening', size: 143 });
      ctx.headline('So which line is the <b>height</b>?', { l: PANEL, t: 214, w: 460 });
      ctx.note('Tap it on the shape.', { l: PANEL, t: 274 });

      const cands = {
        legL: { pts: [T.BL, T.TL],   dash: false },
        legR: { pts: [T.BR, T.TR],   dash: false },
        perp: { pts: [T.TL, T.foot], dash: true }
      };
      const cg = s('g'); L.appendChild(cg);
      Object.keys(cands).forEach((k, i) => {
        const c = cands[k];
        const ln = G.edge(c.pts[0], c.pts[1], 'tapzone');
        if (c.dash) ln.style.strokeDasharray = '12 9';
        ln.style.opacity = 0;
        cg.appendChild(ln);
        c.el = ln;
        const hit = G.hit(c.pts[0], c.pts[1], () => pick(k));
        hit.addEventListener('pointerenter', () => { if (!busy) ln.style.opacity = .62; });
        hit.addEventListener('pointerleave', () => { if (!busy) ln.style.opacity = .4; });
        cg.appendChild(hit);
        setTimeout(() => { ln.style.opacity = .4; ln.classList.add('hint'); NL.Sound.playUI('tap'); }, 160 + i * 150);
      });

      const done = ctx.once();
      let busy = false;
      async function pick(k) {
        if (busy) return; busy = true;
        if (k === 'perp') {
          ['legL', 'legR'].forEach(x => { cands[x].el.classList.remove('hint'); cands[x].el.style.opacity = 0; });
          const hl = cands.perp.el;
          hl.classList.remove('hint');
          hl.setAttribute('class', 'edge hgt'); hl.style.opacity = 1; hl.style.strokeDasharray = '';
          L.appendChild(G.rightAngle(T.foot, T.BR, T.TL, 13));
          const hLbl = G.label(T.TL.x + 19, T.y + T.h / 2, 'h', 'hgt', 'start'); L.appendChild(hLbl);
          UI.appear(hLbl);
          UI.sparks(ctx.fx, T.foot.x, T.y + T.h / 2, 8, 'var(--hgt)');
          await nibi.react('ok', 'Yes! Straight down, at a right angle.', { side: 'up', dx: -140 });

          /* and it is the same everywhere between the two parallel sides */
          nibi.hush(); nibi.set('measuring');
          const probe = G.edge({ x: T.TL.x, y: T.y }, { x: T.TL.x, y: T.foot.y }, 'hgt');
          probe.setAttribute('stroke-width', 6);
          probe.style.opacity = .55;
          L.appendChild(probe);
          const x0 = T.TL.x + 14, x1 = T.TR.x - 14;
          await ctx.tween(2100, t => {
            const p = (1 - Math.cos(Math.PI * 2 * t)) / 2;
            const x = x0 + (x1 - x0) * p;
            probe.setAttribute('x1', x); probe.setAttribute('x2', x);
          }, { ease: 'linear' });
          probe.remove();
          await nibi.say('Wherever you measure it, the gap is the <b>same</b>.', { side: 'up', dx: -170 });
          done.resolve();
        } else {
          await nibi.react('wrong', 'That’s the one that fooled me — it <b>leans</b>.', { side: 'up', dx: -140, state: 'incorrect' });
          busy = false; nibi.set('listening');
        }
      }
      await done;
      nibi.hush();

      ctx.headline('Now we have all three.', { l: PANEL, t: 214, w: 460 });
      ctx.note('', { l: PANEL, t: 274 });
      const leg = NL.h('div.legend', {}, [
        NL.h('div.row', {}, [NL.h('span.key.para', { text: 'a' }), NL.h('span', { html: 'one <b>parallel</b> side' })]),
        NL.h('div.row', {}, [NL.h('span.key.para', { text: 'b' }), NL.h('span', { html: 'the other <b>parallel</b> side' })]),
        NL.h('div.row', {}, [NL.h('span.key.hgt',  { text: 'h' }), NL.h('span', { html: '<b>perpendicular</b> height' })])
      ]);
      NL.at(leg, { l: PANEL, t: 288 });
      ctx.show(leg, { delay: 60 });
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     08 — DERIVE THE FORMULA (the aha moment)
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'derive', label: 'Build the formula', keep: ['hero'], act: true,
    title: 'Building the Formula',
    sub: 'Two trapeziums make a shape we <em>already know</em>.',
    async enter(ctx) {
      const { nibi } = ctx;
      const g = hero(ctx);
      const L = labelHero(g);

      ctx.headline('Watch this trick.', { l: DPANEL, t: 196, w: 400 });
      nibi.place(560, 600, true).resize(154).set('presenting');
      await nibi.say('One trapezium is hard. <b>Two</b> is easy!', { side: 'up', dx: -150 });

      /* 1 — an identical copy */
      const copyG = s('g', { 'data-id': 'copy' });
      g.insertBefore(copyG, L);
      const copy = G.poly(T, { class: 'shape copy' });
      copy.style.opacity = 0;
      copy.style.transition = 'opacity 460ms var(--ease)';
      copyG.appendChild(copy);
      /* the copy lifts clear of the original first, so it is obvious that
         there are now two of the same shape before anything rotates      */
      const OFF = { x: 330, y: -34 };
      copyG.setAttribute('transform', `translate(${OFF.x}, ${OFF.y})`);
      requestAnimationFrame(() => copy.style.opacity = 1);
      ctx.sfx('pop');
      nibi.hush(); nibi.set('split');
      await nibi.say('An <b>identical</b> copy — same sides, same height.', { side: 'up', dx: -160, hold: 1000 });

      /* 2 — Nibi plants itself directly under the pivot and turns the copy
             around that point: the rotation happens over its head        */
      nibi.hush();
      await nibi.to(M.x, 600, { sig: ctx.sig, then: 'determined', size: 140 });
      await nibi.fx('squash');                   /* anticipation          */
      NL.Sound.playShape('morph');
      await ctx.tween(1750, t => {
        copyG.setAttribute('transform',
          `translate(${OFF.x * (1 - t)}, ${OFF.y * (1 - t)}) rotate(${180 * t}, ${M.x}, ${M.y})`);
        if (t > .5 && !nibi.flip) nibi.set('determined', { flip: true });
      }, { ease: 'inOut' });
      NL.Sound.playShape('join');
      nibi.hush(); nibi.set('excited'); nibi.squash();
      await ctx.wait(700);                       /* let the join land */

      /* 3 — trace what the two of them make */
      const outline = s('polygon', {
        points: G.str(COMB), fill: 'none', stroke: 'var(--brand)',
        'stroke-width': 3.5, 'stroke-linejoin': 'round', 'data-id': 'outline'
      });
      g.appendChild(outline);
      await ctx.draw(outline, 900);
      await nibi.say('Look what they make — a <b>parallelogram</b>!', { side: 'up', dx: -140 });

      /* 4 — the learner works out the new base */
      nibi.hush();
      await nibi.to(1152, 600, { sig: ctx.sig, then: 'listening', size: 133 });
      ctx.headline('How long is its <b>base</b> now?', { l: DPANEL, t: 196, w: 400 });

      const gate = ctx.once();
      const ch = UI.choices({
        box: { l: DPANEL, t: 262 }, dir: 'col', cw: 300,
        items: [{ id: 'sum', label: 'a + b' }, { id: 'prod', label: 'a × b' }, { id: 'diff', label: 'b − a' }],
        onPick: async (it, el, api) => {
          api.busy(true);
          if (it.id === 'sum') {
            api.mark('sum', 'ok'); api.dimOthers('sum'); api.lock();
            await nibi.react('ok', 'Exactly — <span class="para">b</span> then <span class="para">a</span>, end to end.', { side: 'left' });
            gate.resolve();
          } else {
            api.mark(it.id, 'near');
            await nibi.react('wrong', it.id === 'prod'
              ? 'We’re laying the sides <b>next to</b> each other, not multiplying.'
              : 'Nothing is taken away — the two sides <b>join up</b>.', { side: 'left' });
            api.clearMarks(); api.busy(false);
          }
        }
      });
      ctx.show(ch.el, { delay: 140 });
      await gate;
      nibi.hush();
      UI.vanish(ch.el, 240);

      /* 5 — dimension the parallelogram, then reason about its area */
      const dims = s('g', { 'data-id': 'dims' });
      g.appendChild(dims);
      const dimAB = G.dimension(T.BL, rot(T.TL), { off: 62, label: 'a + b', lab: -15, cls: 'para', color: 'var(--para)' });
      dims.appendChild(dimAB);
      dimAB.style.opacity = 0; dimAB.style.transition = 'opacity 420ms';
      requestAnimationFrame(() => dimAB.style.opacity = 1);
      ctx.sfx('reveal');

      ctx.headline('So its area is…', { l: DPANEL, t: 196, w: 400 });
      const st = UI.steps({ l: DPANEL - 16, t: 250 }, { size: 23 });
      ctx.add(st.el);
      st.add('base = <span style="color:var(--para)">a + b</span>');
      await ctx.wait(520);
      st.add('height = <span style="color:var(--hgt)">h</span>');
      await ctx.wait(620);

      /* --- why base x height? because a parallelogram is a pushed-over
             rectangle: straighten it and nothing is gained or lost --- */
      nibi.hush(); nibi.set('explaining');
      await nibi.say('Why base × height? Watch it straighten.', { side: 'left', hold: 700 });
      const heroPoly = q(g, 'poly');
      const shear = s('polygon', {
        points: G.str(COMB), class: 'shape', 'data-id': 'shear'
      });
      g.insertBefore(shear, outline);
      [heroPoly, copy, outline, L].forEach(e => {
        e.style.transition = 'opacity 260ms var(--ease)'; e.style.opacity = 0;
      });
      const hDim = G.dimension({ x: T.x - 34, y: T.y + T.h }, { x: T.x - 34, y: T.y },
        { off: 0, ext: false, label: 'h', lab: -18, cls: 'hgt', color: 'var(--hgt)' });
      g.appendChild(hDim);
      const REC = [{ x: T.BL.x, y: T.y }, { x: rot(T.TL).x, y: T.y }, rot(T.TL), T.BL];
      await ctx.wait(240);
      ctx.sfx('swoosh');
      await ctx.tween(1000, t => {
        shear.setAttribute('points', G.str(COMB.map((p, i) => ({
          x: p.x + (REC[i].x - p.x) * t, y: p.y + (REC[i].y - p.y) * t
        }))));
      }, { ease: 'inOut' });
      await nibi.say('Same base. Same height. <b>Same space.</b>', { side: 'left', hold: 1250 });
      await ctx.tween(760, t => {
        shear.setAttribute('points', G.str(REC.map((p, i) => ({
          x: p.x + (COMB[i].x - p.x) * t, y: p.y + (COMB[i].y - p.y) * t
        }))));
      }, { ease: 'inOut' });
      hDim.style.transition = 'opacity 260ms'; hDim.style.opacity = 0;
      [heroPoly, copy, outline, L].forEach(e => e.style.opacity = 1);
      await ctx.wait(280);
      shear.remove(); hDim.remove();

      nibi.hush(); nibi.set('teaching');
      st.add('area = <b>(a + b) × h</b>');
      await nibi.say('That’s <b>both</b> trapeziums together.', { side: 'left', hold: 950 });

      /* 6 — halve it (Nibi stays right so the a + b dimension stays readable) */
      nibi.hush(); nibi.set('split');
      await nibi.say('But the two halves are <b>identical</b> — we made one from the other.',
        { side: 'left', w: 250, hold: 900 });
      copy.style.transition = 'opacity 520ms var(--ease)';
      copy.style.opacity = .26;
      const flash = G.poly(T, { fill: 'var(--para)', opacity: 0, stroke: 'none' });
      g.insertBefore(flash, L);
      flash.style.transition = 'opacity 400ms';
      requestAnimationFrame(() => flash.style.opacity = .16);
      ctx.sfx('boing');
      await ctx.wait(640);
      st.add('so one trapezium = <b>half</b> of that');
      await ctx.wait(520);
      const final = st.add('A = <b>½ × (a + b) × h</b>', { final: true });
      final.style.fontSize = '27px';
      NL.Sound.playDiscovery();
      ctx.head('Building the Formula', 'Area = ½ × <em>(a + b)</em> × <em class="h">h</em>');
      UI.sparks(ctx.fx, DPANEL + 140, 470, 12);
      nibi.set('celebrate'); await nibi.squash(); ctx.sfx('win');
      await nibi.say('We <b>built</b> it. Nothing to memorise!', { side: 'left', w: 210 });
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     09 — FORMULA REVEAL (tap a letter, light up the diagram)
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'formula', label: 'The formula', keep: ['hero'],
    title: 'Area of a Trapezium',
    sub: 'Area = ½ × <em>(a + b)</em> × <em class="h">h</em>',
    async enter(ctx) {
      const { nibi } = ctx;
      const g = hero(ctx);
      labelHero(g);
      /* the copy leaves; the trapezium itself does not move */
      ['copy', 'outline', 'dims'].forEach(k => {
        const e = q(g, k);
        if (e) { e.style.transition = 'opacity 400ms var(--ease)'; e.style.opacity = 0; setTimeout(() => e.remove(), 440); }
      });

      const parts = { a: T.top, b: T.bottom, h: [T.TL, T.foot] };
      const glowG = s('g'); g.appendChild(glowG);
      const glow = {};
      Object.keys(parts).forEach(k => {
        const ln = G.edge(parts[k][0], parts[k][1], k === 'h' ? 'hgt' : 'para');
        ln.setAttribute('stroke-width', 17);
        ln.setAttribute('stroke-linecap', 'round');
        ln.style.strokeDasharray = 'none';
        ln.style.opacity = 0; ln.style.transition = 'opacity 280ms var(--ease)';
        glowG.appendChild(ln); glow[k] = ln;
      });

      ctx.show(UI.tag('AREA OF A TRAPEZIUM', { l: PANEL, t: 196 }));
      const f = UI.formula([
        { v: 'A' }, { op: '=' }, { v: '½' }, { op: '×' }, { op: '(' },
        { v: 'a', k: 'para', id: 'a' }, { op: '+' }, { v: 'b', k: 'para', id: 'b' }, { op: ')' },
        { op: '×' }, { v: 'h', k: 'hgt', id: 'h' }
      ], { l: PANEL, t: 224 }, { size: 44 });
      ctx.show(f.el, { delay: 120 });
      ctx.note('Tap each letter to see where it lives.', { l: PANEL, t: 306 });

      nibi.place(1104, 600, true).resize(141).set('proud');
      await ctx.wait(280);

      const legend = NL.h('div.legend');
      NL.at(legend, { l: PANEL, t: 358 });
      ctx.add(legend);

      const meanings = {
        a: ['para', 'a', 'first <b>parallel</b> side'],
        b: ['para', 'b', 'second <b>parallel</b> side'],
        h: ['hgt', 'h', '<b>perpendicular</b> height']
      };
      let opened = 0;
      const done = ctx.once();

      Object.keys(f.toks).forEach(k => {
        const tk = f.toks[k];
        tk.classList.add('live');
        tk.addEventListener('click', async () => {
          if (tk.dataset.used) return;
          tk.dataset.used = '1';
          tk.classList.add('on');
          glow[k].style.opacity = .26;
          ctx.sfx('pop');
          const [cls, key, txt] = meanings[k];
          const row = NL.h('div.row', {}, [NL.h('span.key.' + cls, { text: key }), NL.h('span', { html: txt })]);
          legend.appendChild(row); UI.appear(row, { dy: 6 });
          opened++;
          if (opened === 1) nibi.set('point-right', { flip: true });
          if (opened === 3) {
            nibi.set('celebrate'); nibi.squash(); ctx.sfx('ok');
            await nibi.say('<b>a</b> and <b>b</b> are parallel.<br><b>h</b> is perpendicular.', { side: 'left', w: 250 });
            done.resolve();
          }
        });
      });

      await done;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     10 — WHAT THE FORMULA MEANS  (match symbol to meaning)
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'meaning', label: 'In your own words', keep: ['hero'],
    title: 'What the Formula Means',
    sub: '½ × <em>(sum of parallel sides)</em> × <em class="h">perpendicular height</em>',
    async enter(ctx) {
      const { nibi } = ctx;
      const g = hero(ctx);
      labelHero(g);

      const glowG = s('g'); g.appendChild(glowG);
      const mk = (pts, cls) => {
        const ln = G.edge(pts[0], pts[1], cls);
        ln.setAttribute('stroke-width', 17);
        ln.setAttribute('stroke-linecap', 'round');
        ln.style.strokeDasharray = 'none';
        ln.style.opacity = 0; ln.style.transition = 'opacity 320ms var(--ease)';
        glowG.appendChild(ln); return ln;
      };
      const gA = mk(T.top, 'para'), gB = mk(T.bottom, 'para'), gH = mk([T.TL, T.foot], 'hgt');

      ctx.headline('Say it in words.', { l: PANEL, t: 182, w: 420 });
      const f = UI.formula([
        { v: 'A' }, { op: '=' }, { v: '½' }, { op: '×' },
        { v: '(a + b)', k: 'para' }, { op: '×' }, { v: 'h', k: 'hgt' }
      ], { l: PANEL, t: 232 }, { size: 32 });
      ctx.show(f.el, { delay: 100 });
      ctx.note('Drag each piece onto what it means.', { l: PANEL, t: 294 });

      nibi.place(300, 600, true).resize(133).set('explaining');
      await nibi.say('A formula is a <b>sentence</b> in symbols.', { side: 'right', w: 220 });

      const rows = [
        { id: 'sum', label: 'sum of the parallel sides', y: 344 },
        { id: 'hgt', label: 'perpendicular height',      y: 424 }
      ];
      rows.forEach(r => {
        const el = NL.h('div.panel.flat', {
          html: r.label,
          style: { padding: '15px 18px', fontSize: '19px', fontWeight: 600, color: 'var(--ink-2)' }
        });
        NL.at(el, { l: PANEL + 128, t: r.y + 3, w: 300 });
        ctx.show(el, { delay: 180 });
      });

      const done = ctx.once();
      UI.dragSet({
        host: ctx.host,
        slots: rows.map(r => ({ id: r.id, x: PANEL, y: r.y, w: 112, h: 58 })),
        chips: [
          { id: 'sum', label: 'a + b', x: PANEL + 30, y: 522 },
          { id: 'hgt', label: 'h',     x: PANEL + 172, y: 522 }
        ],
        accept: (c, sl) => c.id === sl.id,
        async onAccept(c) {
          if (c.id === 'sum') { gA.style.opacity = .26; gB.style.opacity = .26; }
          else gH.style.opacity = .26;
          nibi.set('happy'); nibi.squash();
        },
        async onReject(c) {
          nibi.set('incorrect'); ctx.sfx('near');
          await nibi.say(c.id === 'hgt'
            ? '<b>h</b> is a single measurement — the straight-down one.'
            : '<b>a + b</b> adds the two parallel sides together.', { side: 'right', w: 240 });
        },
        async onComplete() {
          nibi.set('celebrate'); nibi.squash(); ctx.sfx('ok');
          ctx.show(UI.feedback('ok', 'Area = ½ × <b>(sum of parallel sides)</b><br>× <b>perpendicular height</b>',
            { l: 84, t: 508, w: 430 }));
          await nibi.say('Now it <b>means</b> something.', { side: 'right', w: 200 });
          done.resolve();
        }
      });

      await done;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     11 — DOES THE FORMULA CHANGE?
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'universal', label: 'One formula, three shapes',
    title: 'One Formula, Every Trapezium',
    sub: 'Does changing the shape change <em>the rule</em>?',
    async enter(ctx) {
      const { nibi, board } = ctx;
      const g = board.fresh('universal');


      const A = 66, B = 116, HH = 100;
      const kinds = [
        { id: 'right', name: 'Right-angled', type: 'right',   cx: 262, lean: 0 },
        { id: 'iso',   name: 'Isosceles',    type: 'iso',     cx: 640, lean: 0 },
        { id: 'scal',  name: 'Scalene',      type: 'scalene', cx: 1018, lean: .8 }
      ];

      kinds.forEach((k, i) => {
        const sh = G.trap({ x: k.cx - B / 2 - 46, y: 168, a: A, b: B, h: HH, type: k.type, lean: k.lean });
        k.sh = sh;
        const grp = s('g');
        k.grp = grp;
        k.copyG = s('g');
        const cp = G.poly(sh, { class: 'shape copy' });
        cp.style.opacity = 0; cp.style.transition = 'opacity 360ms';
        k.copy = cp; k.copyG.appendChild(cp);
        grp.append(k.copyG, G.poly(sh));
        grp.appendChild(G.edge(sh.top[0], sh.top[1], 'para'));
        grp.appendChild(G.edge(sh.bottom[0], sh.bottom[1], 'para'));
        grp.appendChild(G.edge(sh.TL, sh.foot, 'hgt'));
        grp.appendChild(G.rightAngle(sh.foot, sh.BR, sh.TL, 11));
        grp.appendChild(G.label(sh.top[0].x + A / 2, 152, 'a', 'para'));
        grp.appendChild(G.label(sh.x + B / 2, 168 + HH + 26, 'b', 'para'));
        grp.appendChild(G.label(sh.TL.x + 15, 168 + HH / 2, 'h', 'hgt', 'start'));
        grp.appendChild(G.label(sh.x + B / 2, 168 + HH + 62, k.name, 'name'));
        g.appendChild(grp);
        G.popIn(grp, sh.center, { delay: 120 + i * 160 });
      });

      nibi.place(1146, 600, true).resize(141).set('pondering');
      await nibi.say('One formula… or three?', { side: 'left', w: 210 });

      const done = ctx.once();
      const ch = UI.choices({
        box: { cx: 640, t: 430 }, cw: 190,
        items: [{ id: 'yes', label: 'YES, it changes' }, { id: 'no', label: 'NO, it stays' }],
        onPick: async (it, el, api) => {
          api.busy(true); api.lock();
          if (it.id === 'no') {
            api.mark('no', 'ok'); api.dim('yes');
            await nibi.react('ok', 'Let’s prove it.', { side: 'left', w: 180 });
          } else {
            api.mark('yes', 'near');
            await nibi.react('wrong', 'Let’s test it — same trick on all three.', { side: 'left', w: 230 });
          }
          UI.vanish(ch.el, 240);
          nibi.hush();
          await nibi.to(1146, 600, { sig: ctx.sig, then: 'determined', size: 131 });
          await prove();
          done.resolve();
        }
      });
      ctx.show(ch.el, { delay: 200 });

      async function prove() {
        ctx.sfx('swoosh');
        await Promise.all(kinds.map(k => {
          const m = G.mid(k.sh.TR, k.sh.BR);
          k.copy.style.opacity = 1;
          return ctx.tween(1050, t => k.copyG.setAttribute('transform', `rotate(${180 * t}, ${m.x}, ${m.y})`), { ease: 'inOut' });
        }));
        ctx.sfx('snap');
        nibi.set('excited'); nibi.squash();
        await ctx.wait(260);
        await NL.Anim.stagger(kinds, 180, k => {
          const m = G.mid(k.sh.TR, k.sh.BR);
          const rr = p => ({ x: 2 * m.x - p.x, y: 2 * m.y - p.y });
          const out = s('polygon', {
            points: G.str([k.sh.TL, rr(k.sh.BL), rr(k.sh.TL), k.sh.BL]),
            fill: 'none', stroke: 'var(--brand)', 'stroke-width': 3, 'stroke-linejoin': 'round'
          });
          k.grp.appendChild(out);
          NL.Anim.draw(out, 620, { sig: ctx.sig });
          const lbl = G.label(k.sh.x + 58, 392, 'A = ½ (a + b) h', 'para');
          lbl.setAttribute('font-size', '20');
          lbl.style.opacity = 0; lbl.style.transition = 'opacity 400ms';
          k.grp.appendChild(lbl);
          setTimeout(() => lbl.style.opacity = 1, 380);
          ctx.sfx('pop');
        }, ctx.sig);
        await ctx.wait(680);
        ctx.show(UI.feedback('ok', 'The shape changes. The <b>formula does not</b>.', { cx: 640, t: 496 }));
        nibi.set('celebrate'); nibi.squash(); ctx.sfx('win');
        await nibi.say('Every trapezium, same rule.', { side: 'left', w: 230 });
      }

      await done;
      await ctx.ready('Next');
    }
  });
})(window.NL);
