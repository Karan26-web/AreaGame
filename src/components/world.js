/* ============================================================
   NL.World — the Mars environment.
   One flat vector plate, drawn as three clipped bands so the sky,
   the distant relief and the terrain can settle in sequence and
   drift at slightly different rates. Everything here is quiet by
   design: the world gives depth, the lesson gives the content.
   ============================================================ */
(function (NL) {
  const { h, clamp } = NL;
  const { wait, tween } = NL.Anim;

  const rand = (a, b) => a + Math.random() * (b - a);

  const World = {
    ready: false,

    build() {
      this.el = document.getElementById('world');
      this.sky = document.getElementById('w-sky');
      this.mid = document.getElementById('w-mid');
      this.ground = document.getElementById('w-ground');
      this.haze = document.getElementById('w-haze');
      this.sweep = document.getElementById('w-sweep');

      /* stars, kept to the upper sky and away from the middle where
         the lesson heading sits */
      const stars = document.getElementById('w-stars');
      for (let i = 0; i < 26; i++) {
        const x = rand(2, 98), y = rand(3, 34);
        if (x > 34 && x < 66 && y > 12) continue;          /* keep the heading clean */
        const s = rand(2, 4.4);
        stars.appendChild(h('div.star', {
          style: {
            left: x + '%', top: y + '%', width: s + 'px', height: s + 'px',
            '--dur': rand(3.4, 7.5) + 's', '--delay': rand(0, 6) + 's'
          }
        }));
      }

      /* slow dust rising off the terrain, only near the edges */
      const dust = document.getElementById('w-dust');
      for (let i = 0; i < 16; i++) {
        const left = Math.random() < .5 ? rand(0, 22) : rand(78, 100);
        const s = rand(2.5, 5.5);
        dust.appendChild(h('div.mote', {
          style: {
            left: left + '%', top: rand(58, 96) + '%', width: s + 'px', height: s + 'px',
            '--dx': rand(-60, 140) + 'px', '--dy': rand(-150, -50) + 'px',
            '--dur': rand(18, 34) + 's', '--delay': rand(0, 20) + 's'
          }
        }));
      }
      this.stars = stars; this.dust = dust;
      this.parallax();
      return this;
    },

    /* ---------- the opening: the world arrives before the lesson ---------- */
    async reveal(sig) {
      const step = (el, dy, dur) => {
        el.style.transition = `opacity ${dur}ms var(--ease-out), transform ${dur + 160}ms var(--ease-out)`;
        el.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          el.style.opacity = 1;
          el.style.transform = 'translateY(0)';
        });
      };
      step(this.sky, -14, 900);
      NL.Sound.playTransition('rise');
      await wait(560, sig);
      step(this.mid, 12, 780);
      await wait(340, sig);
      step(this.ground, 20, 760);
      await wait(300, sig);
      this.haze.style.opacity = 1;
      [...this.stars.children].forEach((s, i) => s.style.animationPlayState = 'running');
      this.stars.style.transition = this.dust.style.transition = 'opacity 900ms var(--ease)';
      this.stars.style.opacity = this.dust.style.opacity = 1;
      this.ready = true;
      await wait(260, sig);
    },

    /* ---------- a dust sweep used between concepts ---------- */
    dustSweep() {
      this.sweep.classList.remove('go');
      void this.sweep.offsetWidth;
      this.sweep.classList.add('go');
      NL.Sound.playTransition('sweep');
    },

    /* ---------- pointer parallax, deliberately tiny ---------- */
    parallax() {
      const layers = [[this.sky, 5], [this.mid, 11], [this.ground, 18], [this.dust, 26]];
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      const loop = () => {
        cx += (tx - cx) * .06; cy += (ty - cy) * .06;
        layers.forEach(([el, k]) => {
          if (!el) return;
          const base = el === this.dust ? '' : '';
          el.style.transform = `translate3d(${(-cx * k).toFixed(2)}px, ${(-cy * k * .5).toFixed(2)}px, 0)`;
        });
        if (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) raf = requestAnimationFrame(loop);
        else raf = null;
      };
      window.addEventListener('pointermove', e => {
        if (!this.ready) return;
        tx = (e.clientX / window.innerWidth - .5) * 2;
        ty = (e.clientY / window.innerHeight - .5) * 2;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    }
  };

  NL.World = World;
})(window.NL);
