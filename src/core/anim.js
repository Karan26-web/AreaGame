/* ============================================================
   NL.Anim — promise driven tween / timing utilities.
   Every stage owns a "signal"; when the stage exits the signal is
   cancelled and any pending sequence simply stops (never resolves),
   so half finished choreography can't touch the next stage.
   ============================================================ */
(function (NL) {
  const E = {
    linear: t => t,
    out:    t => 1 - Math.pow(1 - t, 3),
    outQ:   t => 1 - Math.pow(1 - t, 4),
    in:     t => t * t * t,
    inOut:  t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    sine:   t => -(Math.cos(Math.PI * t) - 1) / 2,
    back:   t => { const c = 1.70158 + 1; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic:t => t === 0 || t === 1 ? t : Math.pow(2, -11 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1
  };

  const NEVER = () => new Promise(() => {});
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wait(ms, sig) {
    if (sig && sig.cancelled) return NEVER();
    return new Promise(res => setTimeout(() => (sig && sig.cancelled) ? undefined : res(), reduced ? Math.min(ms, 60) : ms));
  }

  /* tween(dur, onUpdate(t01), {ease, sig}) */
  function tween(dur, onUpdate, opts) {
    opts = opts || {};
    const sig = opts.sig;
    if (sig && sig.cancelled) return NEVER();
    const ease = typeof opts.ease === 'function' ? opts.ease : (E[opts.ease] || E.out);
    const d = reduced ? Math.min(dur, 60) : dur;
    return new Promise(res => {
      const t0 = performance.now();
      function frame(now) {
        if (sig && sig.cancelled) return;
        const p = Math.min(1, (now - t0) / d);
        onUpdate(ease(p), p);
        if (p < 1) requestAnimationFrame(frame); else res();
      }
      requestAnimationFrame(frame);
    });
  }

  /* numeric convenience */
  function tweenNum(from, to, dur, onUpdate, opts) {
    return tween(dur, t => onUpdate(from + (to - from) * t), opts);
  }

  /* run fns sequentially, honouring the signal */
  async function seq(sig, ...steps) {
    for (const st of steps) {
      if (sig && sig.cancelled) return NEVER();
      await (typeof st === 'number' ? wait(st, sig) : st());
    }
  }

  /* fire callbacks with a delay between them */
  function stagger(items, gap, fn, sig) {
    return Promise.all(items.map((it, i) => wait(i * gap, sig).then(() => fn(it, i))));
  }

  /* animate an SVG stroke being drawn */
  function draw(el, dur, opts) {
    const len = (el.getTotalLength ? el.getTotalLength() : 200) + 1;
    el.style.strokeDasharray = len + ' ' + len;
    el.style.strokeDashoffset = len;
    el.style.opacity = 1;
    return tween(dur, t => { el.style.strokeDashoffset = len * (1 - t); }, opts)
      .then(() => { el.style.strokeDasharray = (opts && opts.keepDash) || 'none'; el.style.strokeDashoffset = 0; });
  }

  /* add a class next frame so CSS transitions actually run */
  function on(el, cls) {
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add(cls || 'on')));
    return el;
  }

  function signal() {
    return { cancelled: false, cancel() { this.cancelled = true; } };
  }

  NL.Anim = { E, wait, tween, tweenNum, seq, stagger, draw, on, signal, reduced, NEVER };
})(window.NL);
