/* ============================================================
   NL.UI — reusable lesson UI: copy blocks, buttons, choices,
   shape cards, feedback, formula rows, guided steps and a
   pointer/click drag-and-drop system. All in design-space px.
   ============================================================ */
(function (NL) {
  const { h, s, at } = NL;
  const { wait, on } = NL.Anim;

  const scale = () => (NL.Stage && NL.Stage.scale) || 1;

  /* ---------- copy ---------- */
  function text(kind, str, box, cls) {
    const el = h('div.' + kind + (cls ? '.' + cls.split(' ').join('.') : ''), { html: str });
    at(el, box);
    if (box.cx !== undefined) el.classList.add('at-center');
    return el;
  }
  const title       = (t, box) => text('headline', t, box);
  const instruction = (t, box) => text('instruction', t, box);
  const subline     = (t, box) => text('subline', t, box);
  const tag         = (t, box) => text('tag', t, box);

  /* elements enter with a soft rise; use `appear` for anything built */
  function appear(el, o) {
    o = o || {};
    el.style.opacity = 0;
    el.style.transition = `opacity 380ms var(--ease-out) ${o.delay || 0}ms, transform 420ms var(--ease-out) ${o.delay || 0}ms`;
    const base = el.style.transform || '';
    el.style.transform = base + ` translateY(${o.dy === undefined ? 12 : o.dy}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity = 1;
      el.style.transform = base;
    }));
    return el;
  }

  function vanish(el, dur) {
    el.style.transition = `opacity ${dur || 240}ms var(--ease), transform ${dur || 240}ms var(--ease)`;
    el.style.opacity = 0;
    el.style.transform = (el.style.transform || '') + ' translateY(-8px)';
    setTimeout(() => el.remove(), (dur || 240) + 40);
  }

  /* ---------- buttons ---------- */
  function btn(label, onClick, o) {
    o = o || {};
    const el = h('button.btn.btn-abs' + (o.ghost ? '.ghost' : '') + (o.small ? '.small' : ''), { text: label, type: 'button' });
    at(el, o.box || {});
    if (o.box && o.box.cx !== undefined) el.style.transform = 'translateX(-50%)';
    el.addEventListener('click', e => { NL.Sfx.play('click'); onClick(e, el); });
    return el;
  }

  /* ---------- multiple choice ---------- */
  /* items: [{id,label,sub}]  -> api */
  function choices(o) {
    const wrap = h('div.choices' + (o.dir === 'col' ? '.col' : ''));
    at(wrap, o.box);
    if (o.box.cx !== undefined) wrap.style.transform = 'translateX(-50%)';
    if (o.w) wrap.style.width = o.w + 'px';
    const els = {};
    o.items.forEach(it => {
      const el = h('button.choice', { type: 'button' }, [
        h('span', { html: it.label }),
        it.sub ? h('span.sub', { text: it.sub }) : null
      ]);
      if (o.cw) el.style.width = o.cw + 'px';
      const mark = h('span.choice-mark');
      el.appendChild(mark);
      el.__mark = mark;
      el.addEventListener('click', () => {
        if (el.classList.contains('locked') || wrap.dataset.busy) return;
        NL.Sfx.play('click');
        o.onPick(it, el, api);
      });
      els[it.id] = el;
      wrap.appendChild(el);
    });
    const api = {
      el: wrap, els,
      busy(v) { if (v) wrap.dataset.busy = '1'; else delete wrap.dataset.busy; },
      lock() { Object.values(els).forEach(e => e.classList.add('locked')); },
      unlock() { Object.values(els).forEach(e => e.classList.remove('locked')); },
      mark(id, kind) {
        const e = els[id]; if (!e) return;
        e.classList.add(kind === 'ok' ? 'is-ok' : 'is-near');
        e.__mark.textContent = kind === 'ok' ? '✓' : '!';
        e.__mark.classList.add('show', kind === 'ok' ? 'ok' : 'near');
      },
      dim(id) { if (els[id]) els[id].classList.add('is-dim', 'locked'); },
      dimOthers(id) { Object.keys(els).forEach(k => k !== id && api.dim(k)); },
      clearMarks() {
        Object.values(els).forEach(e => {
          e.classList.remove('is-ok', 'is-near');
          e.__mark.classList.remove('show', 'ok', 'near');
        });
      }
    };
    return api;
  }

  /* ---------- shape cards ---------- */
  /* items: [{id, cap, draw(svg,w,h), correct}] */
  function cardGrid(o) {
    const grid = h('div.card-grid');
    at(grid, o.box);
    if (o.box.cx !== undefined) grid.style.transform = 'translateX(-50%)';
    grid.style.gridTemplateColumns = `repeat(${o.cols}, ${o.cw}px)`;
    if (o.gap !== undefined) grid.style.gap = o.gap + 'px';
    const els = {};
    o.items.forEach(it => {
      const card = h('div.shape-card', { style: { width: o.cw + 'px', height: o.ch + 'px' } });
      const svg = s('svg', { width: o.cw, height: o.ch, viewBox: `0 0 ${o.cw} ${o.ch}` });
      it.draw(svg, o.cw, o.ch);
      card.appendChild(svg);
      if (it.cap) card.appendChild(h('span.cap', { text: it.cap }));
      const mark = h('span.card-mark'); card.appendChild(mark);
      card.__mark = mark; card.__svg = svg; card.__item = it;
      card.addEventListener('click', () => {
        if (card.classList.contains('locked')) return;
        NL.Sfx.play('tick');
        o.onPick(it, card, api);
      });
      els[it.id] = card;
      grid.appendChild(card);
    });
    const api = {
      el: grid, els,
      selected: () => Object.keys(els).filter(k => els[k].classList.contains('sel')),
      toggle(id) { els[id].classList.toggle('sel'); return els[id].classList.contains('sel'); },
      mark(id, kind) {
        const e = els[id]; if (!e) return;
        e.classList.add(kind === 'ok' ? 'is-ok' : 'is-look');
        e.__mark.textContent = kind === 'ok' ? '✓' : '?';
        e.__mark.classList.toggle('near', kind !== 'ok');
        e.__mark.classList.add('show');
      },
      clearMarks() {
        Object.values(els).forEach(e => {
          e.classList.remove('is-ok', 'is-look');
          e.__mark.classList.remove('show', 'near');
        });
      },
      lock() { Object.values(els).forEach(e => e.classList.add('locked')); }
    };
    return api;
  }

  /* ---------- feedback ---------- */
  function feedback(kind, msg, box) {
    const el = h('div.feedback.' + kind, {}, [
      h('span.ico', { text: kind === 'ok' ? '✓' : '!' }),
      h('span', { html: msg })
    ]);
    at(el, box);
    if (box.cx !== undefined) el.style.transform = 'translateX(-50%)';
    return el;
  }

  /* ---------- formula row ----------
     spec: [{v:'A'}, {op:'='}, {v:'½', k:'half'}, ... ] with k in
     {para,hgt} colouring and id for later reference               */
  function formula(spec, box, o) {
    o = o || {};
    const el = h('div.formula');
    at(el, box);
    if (box.cx !== undefined) el.style.transform = 'translateX(-50%)';
    if (o.size) el.style.fontSize = o.size + 'px';
    const toks = {}, slots = {};
    spec.forEach(t => {
      if (t.op !== undefined) { el.appendChild(h('span.op', { html: t.op })); return; }
      if (t.slot) {
        const sl = h('span.slot.inline', { dataset: { id: t.slot } });
        sl.style.width = (t.w || 92) + 'px';
        sl.style.height = (t.h || 58) + 'px';
        slots[t.slot] = sl;
        el.appendChild(sl);
        return;
      }
      const sp = h('span.tok' + (t.k ? '.' + t.k : ''), { html: t.v });
      if (t.id) toks[t.id] = sp;
      el.appendChild(sp);
    });
    return { el, toks, slots };
  }

  /* ---------- guided steps ---------- */
  function steps(box, o) {
    o = o || {};
    const el = h('div.steps');
    at(el, box);
    const api = {
      el, rows: [],
      add(html, opt) {
        opt = opt || {};
        const row = h('div.step' + (opt.final ? '.final' : ''), {}, [
          opt.lead !== undefined ? h('span.lead', { text: opt.lead }) : null,
          h('span', { html })
        ]);
        if (o.size) row.style.fontSize = o.size + 'px';
        el.appendChild(row);
        appear(row, { dy: 8 });
        NL.Sfx.play(opt.final ? 'ok' : 'reveal');
        api.rows.push(row);
        return row;
      }
    };
    return api;
  }

  /* ---------- drag & drop (pointer + click fallback) ---------- */
  /* chips: [{id,label,x,y}]  slots: [{id,x,y,w,h,ph}] */
  function dragSet(o) {
    const host = o.host;
    const chips = {}, slots = {};
    let armed = null, drag = null;

    /* a slot is either declared with coordinates or handed in as an
       element already laid out inside a formula row                     */
    o.slots.forEach(sd => {
      let el;
      if (sd.el) { el = sd.el; el.dataset.id = sd.id; }
      else {
        el = h('div.slot', { text: sd.ph || '' });
        at(el, { l: sd.x, t: sd.y, w: sd.w, hh: sd.h });
        el.dataset.id = sd.id;
        host.appendChild(el);
      }
      el.__def = sd;
      el.addEventListener('click', () => { if (armed) tryDrop(armed, el); });
      slots[sd.id] = el;
    });
    /* slot geometry in design-space px, whatever the slot is nested in */
    function boxOf(el) {
      const r = el.getBoundingClientRect();
      const hr = document.getElementById('ui-layer').getBoundingClientRect();
      const k = scale() || 1;
      return { x: (r.left - hr.left) / k, y: (r.top - hr.top) / k, w: r.width / k, h: r.height / k };
    }

    o.chips.forEach(cd => {
      const el = h('div.chip', { text: cd.label });
      at(el, { l: cd.x, t: cd.y });
      el.dataset.id = cd.id;
      el.__def = cd; el.__home = { x: cd.x, y: cd.y };
      el.addEventListener('pointerdown', e => start(e, el));
      chips[cd.id] = el; host.appendChild(el);
    });

    function start(e, el) {
      if (el.classList.contains('placed')) return;
      el.setPointerCapture(e.pointerId);
      NL.Sound.playUI('tap');
      drag = { el, sx: e.clientX, sy: e.clientY, ox: parseFloat(el.style.left), oy: parseFloat(el.style.top), moved: 0 };
      el.classList.add('lifted');
      const move = ev => {
        if (!drag) return;
        const k = scale();
        const dx = (ev.clientX - drag.sx) / k, dy = (ev.clientY - drag.sy) / k;
        drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
        el.style.left = (drag.ox + dx) + 'px';
        el.style.top = (drag.oy + dy) + 'px';
        const hot = hitSlot(el);
        Object.values(slots).forEach(sl => sl.classList.toggle('hot', sl === hot));
      };
      const up = ev => {
        el.releasePointerCapture && el.releasePointerCapture(ev.pointerId);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        el.classList.remove('lifted');
        Object.values(slots).forEach(sl => sl.classList.remove('hot'));
        const target = hitSlot(el);
        const wasTap = drag.moved < 7;
        drag = null;
        if (wasTap) { home(el); arm(el); return; }
        if (target) tryDrop(el, target); else { home(el); NL.Sfx.play('tick'); }
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    function arm(el) {
      const already = el.classList.contains('armed');
      Object.values(chips).forEach(c => c.classList.remove('armed'));
      if (already) { armed = null; return; }
      el.classList.add('armed'); armed = el; NL.Sfx.play('tick');
    }

    function home(el) {
      el.style.left = el.__home.x + 'px';
      el.style.top = el.__home.y + 'px';
    }

    function hitSlot(chipEl) {
      const c = chipEl.getBoundingClientRect();
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      let best = null, bd = 1e9;
      Object.values(slots).forEach(sl => {
        if (sl.classList.contains('full')) return;
        const r = sl.getBoundingClientRect();
        const d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
        const near = cx > r.left - 60 && cx < r.right + 60 && cy > r.top - 60 && cy < r.bottom + 60;
        if (near && d < bd) { bd = d; best = sl; }
      });
      return best;
    }

    function tryDrop(chipEl, slotEl) {
      const ok = o.accept(chipEl.__def, slotEl.__def);
      Object.values(chips).forEach(c => c.classList.remove('armed'));
      armed = null;
      if (!ok) {
        home(chipEl);
        chipEl.classList.remove('nudge'); void chipEl.offsetWidth; chipEl.classList.add('nudge');
        NL.Sfx.play('near');
        o.onReject && o.onReject(chipEl.__def, slotEl.__def, api);
        return;
      }
      /* snap into the slot */
      const sr = boxOf(slotEl);
      chipEl.style.left = (sr.x + sr.w / 2) + 'px';
      chipEl.style.top = (sr.y + sr.h / 2) + 'px';
      chipEl.style.transform = 'translate(-50%,-50%)';
      chipEl.classList.add('placed');
      slotEl.classList.add('full');
      slotEl.textContent = '';
      slotEl.__filled = chipEl.__def.id;
      NL.Sfx.play('snap');
      o.onAccept && o.onAccept(chipEl.__def, slotEl.__def, api);
      if (Object.values(slots).every(sl => sl.classList.contains('full'))) {
        setTimeout(() => o.onComplete && o.onComplete(api), 260);
      }
    }

    const api = {
      chips, slots,
      filled: () => Object.keys(slots).map(k => slots[k].__filled),
      lock() { Object.values(chips).forEach(c => c.style.pointerEvents = 'none'); }
    };
    return api;
  }

  /* ---------- small celebratory sparks (used sparingly) ---------- */
  function sparks(host, x, y, n, hue) {
    for (let i = 0; i < (n || 8); i++) {
      const p = h('div.spark');
      const a = (Math.PI * 2 * i) / (n || 8) + Math.random() * .5;
      const d = 34 + Math.random() * 30;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.background = hue || (i % 2 ? 'var(--warn)' : 'var(--brand)');
      p.style.transition = 'transform 620ms var(--ease-out), opacity 620ms var(--ease)';
      host.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 12}px) scale(.3) rotate(${a}rad)`;
        p.style.opacity = 0;
      });
      setTimeout(() => p.remove(), 700);
    }
  }

  NL.UI = { text, title, instruction, subline, tag, appear, vanish, btn, choices, cardGrid, feedback, formula, steps, dragSet, sparks };
})(window.NL);
