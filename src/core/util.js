/* ============================================================
   NL — tiny DOM / SVG helpers shared by every lesson component
   ============================================================ */
window.NL = window.NL || {};

(function (NL) {
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* h('div.headline', {style:{left:'40px'}}, 'text' | node | [nodes]) */
  function h(spec, attrs, children) {
    const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(spec);
    const tag = (m && m[1]) || 'div';
    const el = document.createElement(tag);
    if (m && m[2]) {
      m[2].split(/(?=[.#])/).forEach(t => {
        if (t[0] === '.') el.classList.add(t.slice(1));
        else el.id = t.slice(1);
      });
    }
    apply(el, attrs);
    append(el, children);
    return el;
  }

  /* s('polygon', {points, class}) — SVG element */
  function s(tag, attrs, children) {
    const el = document.createElementNS(SVGNS, tag);
    apply(el, attrs);
    append(el, children);
    return el;
  }

  function apply(el, attrs) {
    if (!attrs) return el;
    for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'class' || k === 'className') el.setAttribute('class', v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    return el;
  }

  function append(el, children) {
    if (children === null || children === undefined) return el;
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return el;
  }

  /* place an absolutely positioned element in design-space px */
  function at(el, box) {
    const st = el.style;
    if (box.l !== undefined) st.left = box.l + 'px';
    if (box.t !== undefined) st.top = box.t + 'px';
    if (box.r !== undefined) st.right = box.r + 'px';
    if (box.b !== undefined) st.bottom = box.b + 'px';
    if (box.w !== undefined) st.width = box.w + 'px';
    if (box.hh !== undefined) st.height = box.hh + 'px';
    if (box.cx !== undefined) { st.left = box.cx + 'px'; st.transform = 'translateX(-50%)'; }
    return el;
  }

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ~~(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad2 = n => String(n).padStart(2, '0');

  Object.assign(NL, { h, s, at, apply, clamp, lerp, dist, mid, shuffle, pad2, SVGNS });
})(window.NL);
