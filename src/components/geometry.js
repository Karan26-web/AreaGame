/* ============================================================
   NL.Geo — the lesson's geometry + diagram language.
   Shapes are described mathematically so every label, marker and
   dimension line is derived from the real coordinates.
   ============================================================ */
(function (NL) {
  const s = NL.s;
  const P = (x, y) => ({ x, y });
  const str = pts => pts.map(p => p.x.toFixed(2) + ',' + p.y.toFixed(2)).join(' ');
  const sub = (p, q) => P(p.x - q.x, p.y - q.y);
  const add = (p, q) => P(p.x + q.x, p.y + q.y);
  const mul = (p, k) => P(p.x * k, p.y * k);
  const len = p => Math.hypot(p.x, p.y);
  const norm = p => { const l = len(p) || 1; return P(p.x / l, p.y / l); };
  const perp = p => P(-p.y, p.x);
  const mid = (p, q) => P((p.x + q.x) / 2, (p.y + q.y) / 2);

  /* ---------- shape factories ----------
     Every quad returns: pts[], named corners, named edges,
     plus the perpendicular height foot where meaningful.        */

  /* trapezium: a = top parallel side, b = bottom parallel side */
  function trap(o) {
    const { x, y, a, b, h } = o, type = o.type || 'scalene';
    const BL = P(x, y + h), BR = P(x + b, y + h);
    let tx;
    if (type === 'right')  tx = x;
    else if (type === 'iso') tx = x + (b - a) / 2;
    else tx = x + (b - a) * (o.lean === undefined ? .34 : o.lean);
    const TL = P(tx, y), TR = P(tx + a, y);
    return finish({ TL, TR, BR, BL }, {
      kind: 'trap', type, x, y, a, b, h,
      top: [TL, TR], bottom: [BL, BR], legL: [TL, BL], legR: [TR, BR],
      parallels: [[TL, TR], [BL, BR]],
      foot: P(TL.x, y + h), apex: TL
    });
  }

  function para(o) { /* parallelogram */
    const { x, y, base, h } = o, sk = o.skew === undefined ? 46 : o.skew;
    const BL = P(x, y + h), BR = P(x + base, y + h);
    const TL = P(x + sk, y), TR = P(x + sk + base, y);
    return finish({ TL, TR, BR, BL }, {
      kind: 'para', x, y, base, h, top: [TL, TR], bottom: [BL, BR], legL: [TL, BL], legR: [TR, BR],
      parallels: [[TL, TR], [BL, BR], [TL, BL], [TR, BR]], foot: P(TL.x, y + h)
    });
  }

  function rect(o) {
    const { x, y, w, h } = o;
    return finish({ TL: P(x, y), TR: P(x + w, y), BR: P(x + w, y + h), BL: P(x, y + h) }, {
      kind: 'rect', x, y, w, h,
      top: [P(x, y), P(x + w, y)], bottom: [P(x, y + h), P(x + w, y + h)],
      legL: [P(x, y), P(x, y + h)], legR: [P(x + w, y), P(x + w, y + h)],
      parallels: [[P(x, y), P(x + w, y)], [P(x, y + h), P(x + w, y + h)],
                  [P(x, y), P(x, y + h)], [P(x + w, y), P(x + w, y + h)]]
    });
  }

  function tri(o) { /* isoceles triangle */
    const { x, y, w, h } = o;
    return finish({ A: P(x + w / 2, y), B: P(x + w, y + h), C: P(x, y + h) }, {
      kind: 'tri', x, y, w, h, bottom: [P(x, y + h), P(x + w, y + h)], parallels: []
    });
  }

  function kite(o) {
    const { x, y, w, h } = o, k = o.k === undefined ? .38 : o.k;
    return finish({ T: P(x + w / 2, y), R: P(x + w, y + h * k), B: P(x + w / 2, y + h), L: P(x, y + h * k) },
      { kind: 'kite', x, y, w, h, parallels: [] });
  }

  function finish(corners, extra) {
    const order = Object.keys(corners);
    const pts = order.map(k => corners[k]);
    const sh = Object.assign({ pts, corners, order, points: str(pts) }, corners, extra);
    sh.edges = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
    sh.bbox = bbox(pts);
    sh.center = P((sh.bbox.x0 + sh.bbox.x1) / 2, (sh.bbox.y0 + sh.bbox.y1) / 2);
    return sh;
  }

  function bbox(pts) {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  /* ---------- drawing ---------- */
  function poly(sh, attrs) {
    return s('polygon', Object.assign({ points: sh.points, class: 'shape' }, attrs));
  }

  function edge(p, q, cls, attrs) {
    return s('line', Object.assign({
      x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: 'edge ' + (cls || '')
    }, attrs));
  }

  function hit(p, q, onclick, key) {
    const l = edge(p, q, '');
    l.setAttribute('class', 'edge-hit');
    if (onclick) l.addEventListener('click', onclick);
    if (key) l.dataset.key = key;
    return l;
  }

  /* chevron "parallel" markers, n = 1 or 2, oriented along the edge */
  function parallelMark(p, q, n, color) {
    const m = mid(p, q), u = norm(sub(q, p)), v = perp(u);
    const g = s('g', { class: 'pmark' });
    const size = 11, gap = 10;
    for (let i = 0; i < (n || 1); i++) {
      const base = add(m, mul(u, (i - ((n || 1) - 1) / 2) * gap));
      const back = add(base, mul(u, -size * .8));
      const a = add(back, mul(v, size * .78)), b = add(back, mul(v, -size * .78));
      g.appendChild(s('path', {
        d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${base.x.toFixed(1)},${base.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`,
        fill: 'none', stroke: color || 'var(--para)', 'stroke-width': 3.4,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    }
    return g;
  }

  /* equal-length tick marks across an edge */
  function tickMark(p, q, n, color) {
    const m = mid(p, q), u = norm(sub(q, p)), v = perp(u);
    const g = s('g');
    for (let i = 0; i < (n || 1); i++) {
      const c = add(m, mul(u, (i - ((n || 1) - 1) / 2) * 6));
      const a = add(c, mul(v, 8)), b = add(c, mul(v, -8));
      g.appendChild(s('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: color || 'var(--ink-2)', 'stroke-width': 2.6, 'stroke-linecap': 'round'
      }));
    }
    return g;
  }

  /* small square at a right angle between directions u and v from corner c */
  function rightAngle(c, toward1, toward2, size, color) {
    const u = norm(sub(toward1, c)), v = norm(sub(toward2, c)), k = size || 13;
    const p1 = add(c, mul(u, k)), p3 = add(c, mul(v, k)), p2 = add(p1, mul(v, k));
    return s('polyline', {
      points: str([p1, p2, p3]), fill: 'none',
      stroke: color || 'var(--hgt)', 'stroke-width': 2.2, 'stroke-linejoin': 'round'
    });
  }

  /* offset dimension line with arrow caps + label */
  function dimension(p, q, o) {
    o = o || {};
    const off = o.off === undefined ? 34 : o.off;
    const u = norm(sub(q, p)), v = mul(perp(u), off);
    const A = add(p, v), B = add(q, v);
    const g = s('g', { class: 'dim' });
    const col = o.color || 'var(--ink-2)';
    if (o.ext !== false) {
      [[p, A], [q, B]].forEach(([f, t]) => g.appendChild(s('line', {
        x1: f.x, y1: f.y, x2: t.x + (t.x - f.x) * .12, y2: t.y + (t.y - f.y) * .12,
        stroke: col, 'stroke-width': 1, opacity: .45, 'stroke-dasharray': '3 3'
      })));
    }
    const line = s('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: col, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
    g.appendChild(line);
    [[A, u], [B, mul(u, -1)]].forEach(([pt, dir]) => {
      const back = add(pt, mul(dir, 9)), n = perp(dir);
      g.appendChild(s('path', {
        d: `M${pt.x},${pt.y} L${(back.x + n.x * 4).toFixed(1)},${(back.y + n.y * 4).toFixed(1)} L${(back.x - n.x * 4).toFixed(1)},${(back.y - n.y * 4).toFixed(1)} Z`,
        fill: col
      }));
    });
    if (o.label !== undefined) {
      const m = add(mid(A, B), mul(perp(u), o.lab === undefined ? -14 : o.lab));
      g.appendChild(s('text', {
        x: m.x, y: m.y, class: 'lbl ' + (o.cls || 'dim'),
        'text-anchor': 'middle', 'dominant-baseline': 'middle', text: o.label
      }));
    }
    return g;
  }

  /* dashed perpendicular height from the top-left vertex to the base */
  function heightLine(sh, o) {
    o = o || {};
    const from = o.from || sh.TL || sh.corners.TL, to = o.to || sh.foot;
    const g = s('g');
    const l = edge(from, to, 'hgt');
    g.appendChild(l);
    if (o.mark !== false) {
      const along = P(to.x + (sh.bottom[1].x > to.x ? 1 : -1), to.y);
      g.appendChild(rightAngle(to, along, from, 12));
    }
    if (o.label) {
      g.appendChild(s('text', {
        x: from.x + 13, y: (from.y + to.y) / 2 + 1, class: 'lbl hgt',
        'dominant-baseline': 'middle', text: o.label
      }));
    }
    return g;
  }

  /* perpendicular drawn at the middle of the base — always lands inside
     the shape, even when the top parallel side is the longer one         */
  function midHeight(sh) {
    const cx = (sh.bottom[0].x + sh.bottom[1].x) / 2;
    return [P(cx, sh.y), P(cx, sh.y + sh.h)];
  }

  function label(x, y, text, cls, anchor) {
    return s('text', {
      x, y, class: 'lbl ' + (cls || ''), text,
      'text-anchor': anchor || 'middle', 'dominant-baseline': 'middle'
    });
  }

  /* shapes arrive with weight: they scale up about their own centre,
     settle with a little overshoot, and make a sound when they land   */
  function popIn(node, centre, o) {
    o = o || {};
    const c = centre || { x: 0, y: 0 };
    const dur = o.dur || 520, delay = o.delay || 0;
    node.style.opacity = 0;
    const set = t => {
      const sc = .82 + .18 * t;
      const dy = (1 - t) * 14;
      node.setAttribute('transform',
        `translate(${c.x},${c.y + dy}) scale(${sc}) translate(${-c.x},${-c.y})`);
      node.style.opacity = Math.min(1, t * 1.6);
    };
    set(0);
    return new Promise(res => setTimeout(() => {
      if (o.sfx !== false) NL.Sound.playShape('shape');
      NL.Anim.tween(dur, set, { ease: 'back' }).then(() => {
        node.removeAttribute('transform');
        node.style.opacity = 1;
        res();
      });
    }, delay));
  }


  /* ---------- board elements arrive one at a time ----------
     Shapes and edges already have their own entrances (`popIn`, and the
     stroke-drawing in NL.Anim), but the DECORATIONS — labels, chevrons,
     tick marks, right angles, dimension lines — used to be appended
     straight into the SVG and simply blinked into existence, several at
     once. Each now rises and settles on its own beat.

     The stagger is automatic rather than per call site: everything born
     in the same frame joins one queue and enters in the order it was
     built, so a stage says what it wants on the board and the board leads
     the eye through it. The step shortens as the queue grows, so a burst
     of eight marks still reads as a sequence without stalling the lesson.

     An element that is not in the document by the next frame is left
     alone — the stage is holding it back for its own choreography, and
     guessing would fight it. */
  const STEP = 88, STEP_2 = 44, KNEE = 5;
  let queue = 0, queueRaf = null;

  function slot() {
    const i = queue++;
    if (!queueRaf) queueRaf = requestAnimationFrame(() => { queue = 0; queueRaf = null; });
    return i <= KNEE ? i * STEP : KNEE * STEP + (i - KNEE) * STEP_2;
  }

  /* fade + rise, scaled about the element's own middle so a chevron grows
     out of the edge it belongs to rather than sliding in from nowhere */
  function entrance(node, o) {
    o = o || {};
    const delay = o.delay === undefined ? slot() : o.delay;
    const dur = o.dur || 330, dy = o.dy === undefined ? 7 : o.dy;
    node.style.opacity = 0;
    let c = null;
    const set = t => {
      node.style.opacity = Math.min(1, t * 1.5);
      const y = (1 - t) * dy;
      if (c) {
        const k = .86 + .14 * t;
        node.setAttribute('transform',
          `translate(${c.x},${c.y + y}) scale(${k}) translate(${-c.x},${-c.y})`);
      } else node.setAttribute('transform', `translate(0,${y.toFixed(2)})`);
    };
    set(0);
    /* clearing the inline value rather than forcing 1 matters: a stage may
       have dimmed this element while the entrance was still queued, and
       that intent has to survive */
    const done = () => { node.style.removeProperty('opacity'); node.removeAttribute('transform'); };
    setTimeout(() => {
      if (!node.isConnected) return done();
      try {
        const b = node.getBBox();
        if (b.width || b.height) c = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      } catch (e) { /* not measurable yet; a plain rise still reads */ }
      NL.Anim.tween(dur, set, { ease: 'out' }).then(done);
    }, delay);
    return node;
  }

  /* wrap a builder so whatever it returns enters on its own beat */
  const staged = fn => function () { return entrance(fn.apply(null, arguments)); };

  /* an inline mini diagram for cards / recap rows */
  function miniSvg(w, hgt, build, cls) {
    const svg = s('svg', { width: w, height: hgt, viewBox: `0 0 ${w} ${hgt}`, class: cls || '' });
    build(svg);
    return svg;
  }

  NL.Geo = {
    P, str, sub, add, mul, len, norm, perp, mid, bbox,
    trap, para, rect, tri, kite,
    poly, edge, hit, heightLine, midHeight, miniSvg, popIn, entrance,
    /* the decorations stage themselves; the raw builders stay reachable
       for the few places that drive their own timing */
    parallelMark: staged(parallelMark), tickMark: staged(tickMark),
    rightAngle:   staged(rightAngle),   dimension: staged(dimension),
    label:        staged(label),
    raw: { parallelMark, tickMark, rightAngle, dimension, label }
  };
})(window.NL);
