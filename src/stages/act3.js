/* ============================================================
   ACT 3 — use the formula, then look back
   Stages 12-16. Stages 12-14 share one measured trapezium
   (board group "ex") so the worked example feels continuous.
   ============================================================ */
(function (NL) {
  const { s, Geo, UI, Lesson } = NL;
  const G = Geo;

  const EX = { x: 130, y: 248, a: 190, b: 270, h: 140, type: 'iso' };
  const E = G.trap(EX);
  const PANEL = 620;

  /* the measured example trapezium, built once and kept */
  function example(ctx) {
    const g = ctx.board.g('ex');
    if (g.childNodes.length) return g;
    g.appendChild(G.poly(E));
    g.appendChild(G.edge(E.top[0], E.top[1], 'para'));
    g.appendChild(G.edge(E.bottom[0], E.bottom[1], 'para'));
    g.appendChild(G.parallelMark(E.top[0], E.top[1], 1));
    g.appendChild(G.parallelMark(E.bottom[0], E.bottom[1], 1));
    g.appendChild(G.edge(E.TL, E.foot, 'hgt'));
    g.appendChild(G.rightAngle(E.foot, E.BR, E.TL, 13));
    g.appendChild(G.label(E.top[0].x + E.a / 2, E.y - 28, '18 cm', 'para'));
    g.appendChild(G.label(E.x + E.b / 2, E.y + E.h + 32, '20 cm', 'para'));
    g.appendChild(G.label(E.TL.x + 18, E.y + E.h / 2, '10 cm', 'hgt', 'start'));
    g.appendChild(G.label(E.center.x, E.y + E.h + 66, 'diagram not to scale', 'tiny'));
    G.popIn(g, E.center, { dur: 600 });
    return g;
  }

  /* ------------------------------------------------------------
     12 — GUIDED EXAMPLE
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'guided', label: 'Work one out', keep: ['ex'], act: true,
    title: 'Work One Out',
    sub: 'a = <em>18 cm</em>,  b = <em>20 cm</em>,  h = <em class="h">10 cm</em>',
    async enter(ctx) {
      const { swiftee } = ctx;
      const g = example(ctx);

      ctx.show(UI.instruction('What do we do <b>first</b>?', { l: PANEL, t: 150 }));
      swiftee.place(286, 600, true).resize(148).set('curious');

      const gate = ctx.once();
      const ch = UI.choices({
        box: { l: PANEL, t: 212 }, dir: 'col', cw: 430,
        items: [
          { id: 'sum',  label: 'Add the parallel sides' },
          { id: 'slant',label: 'Multiply the height by the slanted side' },
          { id: 'all',  label: 'Add all four sides' },
          { id: 'half', label: 'Divide the height by 2' }
        ],
        onPick: async (it, el, api) => {
          api.busy(true);
          if (it.id === 'sum') {
            api.mark('sum', 'ok'); api.dimOthers('sum'); api.lock();
            swiftee.set('point-left');
            await swiftee.react('ok', 'Yes — <span class="para">18</span> and <span class="para">20</span>.', { side: 'right', state: 'correct' });
            gate.resolve();
          } else {
            api.mark(it.id, 'near');
            const why = {
              slant: 'The slanted side never appears in the formula.',
              all:   'That would give the <b>perimeter</b> — the distance around.',
              half:  'The ½ multiplies the <b>whole</b> thing, not just h.'
            }[it.id];
            await swiftee.react('wrong', why, { side: 'right' });
            api.clearMarks(); api.busy(false);
          }
        }
      });
      ctx.show(ch.el, { delay: 160 });
      await gate;
      swiftee.hush();
      UI.vanish(ch.el, 260);
      ctx.host.querySelectorAll('.instruction').forEach(e => e.remove());
      ctx.show(UI.instruction('Step by step.', { l: PANEL, t: 150 }));

      const st = UI.steps({ l: PANEL - 18, t: 206 }, { size: 27 });
      ctx.add(st.el);

      st.add('A = ½ × ( <span class="em">a</span> + <span class="em">b</span> ) × h', { lead: '1' });
      await ctx.gate('Next step', { small: true });
      st.add('A = ½ × ( <span class="em">18</span> + <span class="em">20</span> ) × 10', { lead: '2' });
      swiftee.set('point-left');

      /* the learner does the arithmetic, rather than tapping through it */
      await ctx.turn();
      const sumGate = ctx.once();
      const sumQ = UI.choices({
        box: { l: PANEL - 18, t: 400 }, cw: 118,
        items: [{ id: '38', label: '38' }, { id: '380', label: '380' }, { id: '2', label: '2' }],
        onPick: async (it, el, api) => {
          api.busy(true);
          if (it.id === '38') {
            api.mark('38', 'ok'); api.dimOthers('38'); api.lock();
            NL.Sound.playSuccess();
            sumGate.resolve();
          } else {
            api.mark(it.id, 'near');
            await swiftee.react('wrong', it.id === '380'
              ? 'That’s 18 <b>×</b> 20. We’re adding them.'
              : 'That’s the <b>difference</b>. We want the total.', { side: 'right', w: 240 });
            api.clearMarks(); api.busy(false);
          }
        }
      });
      const sumAsk = ctx.show(UI.subline('18 + 20 = ?', { l: PANEL - 18, t: 352 }), { delay: 80 });
      ctx.show(sumQ.el, { delay: 140 });
      await sumGate;
      UI.vanish(sumQ.el, 220); UI.vanish(sumAsk, 220);
      await ctx.wait(240);

      st.add('A = ½ × <span class="em">38</span> × 10', { lead: '3' });
      await ctx.gate('Next step', { small: true });
      swiftee.hush(); swiftee.set('teaching');
      st.add('A = 19 × 10', { lead: '4' });
      await ctx.gate('And the answer?', { small: true });
      const fin = st.add('A = <b>190 cm²</b>', { lead: '5', final: true });
      fin.style.fontSize = '31px';
      UI.sparks(ctx.fx, PANEL + 120, 470, 10);
      swiftee.set('celebrate'); swiftee.squash(); ctx.sfx('win');
      await swiftee.say('One hundred and ninety square centimetres!', { side: 'right' });
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     13 — DRAG THE VALUES INTO THE FORMULA
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'drag', label: 'Fill the formula', keep: ['ex'],
    title: 'Fill in the Formula',
    sub: 'Drag each measurement into <em>its own place</em>.',
    async enter(ctx) {
      const { swiftee } = ctx;
      example(ctx);

      ctx.headline('Now you build it.', { l: PANEL, t: 150 });
      ctx.note('Drag each measurement into the right place.', { l: PANEL, t: 200 });
      swiftee.place(286, 600, true).resize(146).set('listening');

      const f = UI.formula([
        { v: 'A' }, { op: '=' }, { v: '½' }, { op: '×' }, { op: '(' },
        { slot: 'p1' }, { op: '+' }, { slot: 'p2' }, { op: ')' }, { op: '×' }, { slot: 'hh' }
      ], { l: PANEL, t: 258 }, { size: 32 });
      ctx.show(f.el, { delay: 140 });

      const done = ctx.once();
      UI.dragSet({
        host: ctx.host,
        slots: [{ id: 'p1', el: f.slots.p1 }, { id: 'p2', el: f.slots.p2 }, { id: 'hh', el: f.slots.hh }],
        chips: [
          { id: 'v18', label: '18 cm', x: PANEL + 6,   y: 400 },
          { id: 'v20', label: '20 cm', x: PANEL + 116, y: 400 },
          { id: 'v10', label: '10 cm', x: PANEL + 226, y: 400 },
          { id: 'v38', label: '38 cm', x: PANEL + 336, y: 400 }
        ],
        accept(chip, slot) {
          if (chip.id === 'v38') return false;         /* already a + b, not a side */
          if (slot.id === 'hh') return chip.id === 'v10';
          return chip.id === 'v18' || chip.id === 'v20';
        },
        async onAccept() { swiftee.set('thumbs'); swiftee.squash(); },
        async onReject(chip, slot) {
          swiftee.set('incorrect'); ctx.sfx('near');
          const why = chip.id === 'v38'
            ? '38 is already 18 + 20. The brackets want the two sides <b>separately</b>.'
            : slot.id === 'hh'
              ? 'The last slot wants the <span class="hgt">perpendicular height</span> — straight down.'
              : 'Those brackets are for the two <span class="para">parallel sides</span>.';
          await swiftee.say(why, { side: 'right', w: 260 });
        },
        async onComplete() {
          swiftee.set('celebrate'); swiftee.squash(); ctx.sfx('win');
          ctx.show(UI.feedback('ok', 'A = ½ × ( 18 + 20 ) × 10', { l: PANEL + 48, t: 492 }));
          await swiftee.say('Perfect fit. The order of <b>18</b> and <b>20</b> doesn’t matter — we add them.', { side: 'right', w: 300 });
          done.resolve();
        }
      });

      await done;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     14 — CHOOSE THE CORRECT AREA
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'answer', label: 'Find the area', keep: ['ex'],
    title: 'Find the Area',
    sub: 'A = ½ × ( <em>18</em> + <em>20</em> ) × <em class="h">10</em>',
    async enter(ctx) {
      const { swiftee } = ctx;
      const g = example(ctx);

      ctx.show(UI.instruction('Choose the correct area.', { l: PANEL, t: 150 }));
      const f = UI.formula([
        { v: 'A' }, { op: '=' }, { v: '½' }, { op: '×' }, { op: '(' },
        { v: '18', k: 'para' }, { op: '+' }, { v: '20', k: 'para' }, { op: ')' },
        { op: '×' }, { v: '10', k: 'hgt' }
      ], { l: PANEL, t: 206 }, { size: 30 });
      ctx.show(f.el, { delay: 120 });

      swiftee.place(286, 600, true).resize(146).set('thinking');

      const done = ctx.once();
      const ch = UI.choices({
        box: { l: PANEL, t: 286 }, dir: 'col', cw: 250,
        items: [
          { id: 'a190', label: '190 cm²' },
          { id: 'a380', label: '380 cm²' },
          { id: 'a270', label: '270 cm²' }
        ],
        onPick: async (it, el, api) => {
          api.busy(true);
          if (it.id === 'a190') {
            api.mark('a190', 'ok'); api.dimOthers('a190'); api.lock();
            swiftee.set('celebrate'); swiftee.squash(); ctx.sfx('win');
            const st = UI.steps({ l: PANEL - 10, t: 544 }, { size: 24 });
            ctx.add(st.el);
            st.add('½ × 38 × 10  =  19 × 10  =  <b>190 cm²</b>', { final: true });
            /* the answer settles inside the shape */
            const tint = G.poly(E, { fill: 'var(--ok)', opacity: 0, stroke: 'none' });
            g.appendChild(tint);
            tint.style.transition = 'opacity 500ms var(--ease)';
            requestAnimationFrame(() => tint.style.opacity = .14);
            const badge = G.label(E.x + E.b * .66, E.y + E.h * .68, '190 cm²', '');
            badge.setAttribute('font-size', '26'); badge.style.fill = 'var(--ok)';
            badge.style.opacity = 0; badge.style.transition = 'opacity 400ms';
            g.appendChild(badge);
            setTimeout(() => badge.style.opacity = 1, 300);
            UI.sparks(ctx.fx, E.center.x, E.center.y, 12);
            await swiftee.say('That’s it!', { side: 'right' });
            done.resolve();
          } else {
            api.mark(it.id, 'near');
            const why = it.id === 'a380'
              ? 'That’s 38 × 10 — you <b>forgot the ½</b>.'
              : 'Check the sum: 18 + 20 is <b>38</b>, not 54.';
            await swiftee.react('wrong', why, { side: 'right' });
            api.clearMarks(); api.busy(false);
          }
        }
      });
      ctx.show(ch.el, { delay: 200 });
      await done;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     15 — WHICH TRAPEZIUM IS BIGGER?
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'compare', label: 'Compare',
    title: 'Which One is Bigger?',
    sub: 'Wider is not always larger — <em class="h">height</em> counts too.',
    async enter(ctx) {
      const { swiftee, board } = ctx;
      const g = board.fresh('compare');


      const K = 6;
      const items = [
        { id: 'I',  name: 'Trapezium I',  cx: 340, a: 40, b: 25, h: 20, area: 650 },
        { id: 'II', name: 'Trapezium II', cx: 940, a: 30, b: 40, h: 15, area: 525 }
      ];
      items.forEach((it, i) => {
        const sh = G.trap({ x: it.cx - (it.b * K) / 2, y: 150, a: it.a * K, b: it.b * K, h: it.h * K, type: 'iso' });
        it.sh = sh;
        const grp = s('g', { class: 'pointer' });
        it.grp = grp;
        grp.appendChild(G.poly(sh));
        grp.appendChild(G.edge(sh.top[0], sh.top[1], 'para'));
        grp.appendChild(G.edge(sh.bottom[0], sh.bottom[1], 'para'));
        const mh = G.midHeight(sh);
        grp.appendChild(G.edge(mh[0], mh[1], 'hgt'));
        grp.appendChild(G.rightAngle(mh[1], sh.BR, mh[0], 12));
        grp.appendChild(G.label(sh.top[0].x + sh.a / 2, 132, it.a + ' cm', 'para'));
        grp.appendChild(G.label(sh.x + sh.b / 2, 150 + sh.h + 30, it.b + ' cm', 'para'));
        grp.appendChild(G.label(mh[0].x + 14, 150 + sh.h / 2, it.h + ' cm', 'hgt', 'start'));
        g.appendChild(grp);
        G.popIn(grp, sh.center, { delay: 120 + i * 200 });
        grp.addEventListener('click', () => pick(it.id));
      });

      swiftee.place(640, 600, true).resize(146).set('curious');
      await swiftee.say('Careful — the <b>wider</b> one isn’t always the bigger one.', { side: 'up', dx: -180 });

      const done = ctx.once();
      let answered = false;
      const ch = UI.choices({
        box: { cx: 640, t: 428 }, cw: 210,
        items: items.map(i => ({ id: i.id, label: i.name })),
        onPick: (it) => pick(it.id)
      });
      ctx.show(ch.el, { delay: 200 });

      async function pick(id) {
        if (answered) return;
        answered = true;
        ch.busy(true); ch.lock();
        ctx.sfx('click');
        swiftee.hush();
        ch.mark(id, id === 'I' ? 'ok' : 'near');

        /* Swiftee reacts while the middle of the stage is still empty */
        if (id === 'I') {
          swiftee.set('correct'); swiftee.squash(); ctx.sfx('ok');
          await swiftee.say('Let’s check them both and see.', { side: 'up', dx: -120 });
        } else {
          swiftee.set('incorrect'); ctx.sfx('near');
          await swiftee.say('It does look longer… let’s work them both out.', { side: 'up', dx: -170 });
        }
        await ctx.wait(450);
        swiftee.hush();
        await swiftee.to(1152, 600, { sig: ctx.sig, then: 'listening', size: 123, arc: 18 });

        /* three passes: sums, then heights, then areas — so the learner
           sees II win the first round and lose the one that matters      */
        const rows = items.map(it => {
          const mk = (html, sz, col) => NL.h('div', {
            html, style: { fontSize: sz + 'px', fontWeight: 700, color: col, marginTop: '4px' }
          });
          const l1 = mk('sum of sides = <b>' + (it.a + it.b) + '</b>', 20, 'var(--para)');
          const l2 = mk('height = <b>' + it.h + '</b>', 20, 'var(--hgt)');
          const l3 = mk('area = <b>' + it.area + ' cm²</b>', 25, it.area === 650 ? 'var(--ok)' : 'var(--ink-2)');
          l2.style.opacity = 0; l3.style.opacity = 0;
          const box = NL.h('div.panel.flat', {}, [l1, l2, l3]);
          NL.at(box, { l: it.cx - 130, t: 500, w: 260 });
          box.style.textAlign = 'center';
          ctx.show(box, {});
          return { it, l1, l2, l3 };
        });
        ctx.sfx('reveal');
        await ctx.wait(900);
        swiftee.set('surprised');
        await swiftee.say('Trapezium <b>II</b> has the bigger sum…', { side: 'left', w: 220, hold: 1100 });

        swiftee.hush();
        rows.forEach(r => { r.l2.style.opacity = 1; UI.appear(r.l2, { dy: 6 }); });
        ctx.sfx('reveal');
        await ctx.wait(700);
        swiftee.set('realization');
        await swiftee.say('…but <b>I</b> is much taller.', { side: 'left', w: 200, hold: 1100 });

        swiftee.hush();
        rows.forEach(r => { r.l3.style.opacity = 1; UI.appear(r.l3, { dy: 6 }); });
        ctx.sfx('ok');

        await ctx.wait(440);
        const win = items[0];
        /* tint sits above the fill but under the coloured edges */
        const tint = G.poly(win.sh, { fill: 'var(--ok)', stroke: 'none' });
        tint.style.opacity = 0;
        win.grp.insertBefore(tint, win.grp.childNodes[1]);
        tint.style.transition = 'opacity 460ms var(--ease)';
        requestAnimationFrame(() => requestAnimationFrame(() => tint.style.opacity = .2));

        ctx.head('Which One is Bigger?',
          '<em>Trapezium I</em> wins — 650 cm² against 525 cm². Height counts as much as width.');
        if (id === 'I') { swiftee.set('celebrate'); swiftee.squash(); ctx.sfx('win'); }
        else swiftee.set('encouraging');
        done.resolve();
      }

      await done;
      await ctx.ready('Next');
    }
  });

  /* ------------------------------------------------------------
     16 — RECAP
     ------------------------------------------------------------ */
  Lesson.register({
    id: 'recap', label: 'Remember', act: true,
    title: 'Remember!',
    sub: 'Three things to take with you.',
    async enter(ctx) {
      const { swiftee } = ctx;


      const mini = (build) => G.miniSvg(112, 78, build);

      const rows = [
        {
          n: '1', txt: 'A trapezium has <b>one pair</b> of parallel sides.',
          draw: svg => {
            const sh = G.trap({ x: 8, y: 12, a: 46, b: 92, h: 54, type: 'iso' });
            svg.appendChild(G.poly(sh));
            svg.appendChild(G.parallelMark(sh.top[0], sh.top[1], 1));
            svg.appendChild(G.parallelMark(sh.bottom[0], sh.bottom[1], 1));
          }
        },
        {
          n: '2', txt: 'The <b>height</b> is the perpendicular distance between them — never the slanted side.',
          draw: svg => {
            const sh = G.trap({ x: 8, y: 12, a: 46, b: 92, h: 54, type: 'scalene', lean: .6 });
            svg.appendChild(G.poly(sh));
            svg.appendChild(G.edge(sh.TL, sh.foot, 'hgt'));
            svg.appendChild(G.rightAngle(sh.foot, sh.BR, sh.TL, 10));
          }
        },
        {
          n: '3', txt: 'Area = <b>½ × (a + b) × h</b>',
          draw: svg => {
            const sh = G.trap({ x: 8, y: 12, a: 46, b: 92, h: 54, type: 'iso' });
            svg.appendChild(G.poly(sh));
            svg.appendChild(G.edge(sh.top[0], sh.top[1], 'para'));
            svg.appendChild(G.edge(sh.bottom[0], sh.bottom[1], 'para'));
            svg.appendChild(G.edge(sh.TL, sh.foot, 'hgt'));
          }
        }
      ];

      const list = NL.h('div.recap');
      NL.at(list, { l: 232, t: 108 });
      ctx.add(list);
      rows.forEach((r, i) => {
        const item = NL.h('div.recap-item', {}, [
          NL.h('span.n', { text: r.n }),
          mini(r.draw),
          NL.h('span.txt', { html: r.txt })
        ]);
        list.appendChild(item);
        UI.appear(item, { delay: 160 + i * 200, dy: 14 });
        setTimeout(() => NL.Sound.playShape('shape'), 160 + i * 200);
      });

      swiftee.place(1352, 766, true).resize(179).set('idle');
      await ctx.wait(760);
      swiftee.set('proud'); swiftee.squash();
      NL.Sound.playComplete();
      await swiftee.say('You didn’t memorise that formula —<br>you <b>built</b> it. 💚', { side: 'left', w: 250 });

      ctx.show(UI.btn('Start again', () => NL.Lesson.restart(), { box: { r: 34, b: 30 } }), { delay: 400 });
      await new Promise(() => {});   /* the lesson ends here */
    }
  });
})(window.NL);
