/* TRUST Prep games: hover hold, airspace path, visual observer calls.
   All play with keyboard, mouse, or touch. No outside requests. */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, kids) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { el.appendChild(c); });
    return el;
  }
  function droneSvg() {
    return svg('svg', { viewBox: '0 0 56 24', class: 'drone', 'aria-hidden': 'true', focusable: 'false' }, [
      svg('rect', { x: '20', y: '9', width: '16', height: '8', rx: '3', fill: '#10284a' }),
      svg('line', { x1: '6', y1: '8', x2: '20', y2: '12', stroke: '#10284a', 'stroke-width': '2' }),
      svg('line', { x1: '50', y1: '8', x2: '36', y2: '12', stroke: '#10284a', 'stroke-width': '2' }),
      svg('ellipse', { cx: '6', cy: '6', rx: '6', ry: '2', fill: '#4a5468' }),
      svg('ellipse', { cx: '50', cy: '6', rx: '6', ry: '2', fill: '#4a5468' }),
      svg('circle', { cx: '28', cy: '19', r: '2', fill: '#a3231b' })
    ]);
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function factList(api, facts) {
    return api.h('ul', { class: 'small' }, facts.map(function (f) { return api.h('li', { 'data-line': f.id, text: f.t }); }));
  }
  // Button label with an optional key hint, e.g. "Start" + " (Space)". The hint is a separate span so
  // touch devices can hide it with CSS (see .keyhint); the label itself never changes.
  function setLabel(btn, text, key) {
    btn.textContent = text;
    if (key) { var k = document.createElement('span'); k.className = 'keyhint'; k.textContent = ' (' + key + ')'; btn.appendChild(k); }
  }
  function allFacts(list) { var o = []; list.forEach(function (x) { o = o.concat(x.f); }); return o; }

  // ---------------- Hover hold ----------------
  // Physics lives here as pure functions so testing/hover-sim.js runs the exact same formula.
  // Wind has a steady push (random direction each round, growing over the round, and it may
  // switch direction once) plus random gusts. Doing nothing drifts out of the band; a player who
  // keeps correcting with Climb/Descend can stay in it.
  var HOVER = {
    MAXFT: 450, BAND_LO: 170, BAND_HI: 230, ROUND: 30, GOAL: 60, START: 200,
    THRUST: 80, DAMP: 2, BASE: 16, RAMP: 10, GUST: 10, FLIP_P: 0.5, FLIP_MIN: 10, FLIP_MAX: 20,
    init: function (st, rnd) {
      rnd = rnd || Math.random;
      st.alt = HOVER.START; st.vel = 0; st.t = 0; st.inBand = 0; st.over = 0; st.gust = 0;
      st.dir = rnd() < 0.5 ? -1 : 1;
      st.flipAt = rnd() < HOVER.FLIP_P ? HOVER.FLIP_MIN + rnd() * (HOVER.FLIP_MAX - HOVER.FLIP_MIN) : Infinity;
      st.wind = 0;
      return st;
    },
    step: function (st, dt, rnd, reducedMotion) {
      rnd = rnd || Math.random;
      var H = HOVER, g = reducedMotion ? H.GUST * 0.6 : H.GUST;
      if (st.t >= st.flipAt) { st.dir = -st.dir; st.flipAt = Infinity; }
      st.gust += (rnd() - 0.5) * g * 8 * dt;
      st.gust = Math.max(-g, Math.min(g, st.gust * 0.99));
      st.wind = st.dir * (H.BASE + H.RAMP * Math.min(1, st.t / H.ROUND)) + st.gust;
      var acc = st.wind + (st.up ? H.THRUST : 0) - (st.down ? H.THRUST : 0) - st.vel * H.DAMP;
      st.vel += acc * dt; st.alt += st.vel * dt;
      if (st.alt < 0) { st.alt = 0; st.vel = 0; }
      if (st.alt > H.MAXFT) { st.alt = H.MAXFT; st.vel = 0; }
      if (st.alt > 400) st.over += dt;
      if (st.alt >= H.BAND_LO && st.alt <= H.BAND_HI) st.inBand += dt;
      st.t += dt;
      return st;
    }
  };
  var hover = {
    title: 'Hover hold',
    start: function (box, api) {
      var h = api.h, C = api.C;
      var MAXFT = HOVER.MAXFT, BAND_LO = HOVER.BAND_LO, BAND_HI = HOVER.BAND_HI, ROUND = HOVER.ROUND, GOAL = HOVER.GOAL;
      var st = HOVER.init({ run: false, paused: false, up: false, down: false });
      var sky = h('div', { class: 'sky', role: 'img', 'aria-label': 'Sky with the drone, a green target band from ' + BAND_LO + ' to ' + BAND_HI + ' feet, and a dashed 400-foot line' });
      function yFor(ft) { return (1 - ft / MAXFT) * 100; }
      var band = h('div', { class: 'band' }); band.style.top = yFor(BAND_HI) + '%'; band.style.height = (yFor(BAND_LO) - yFor(BAND_HI)) + '%';
      var ceil = h('div', { class: 'ceil' }, [h('span', { text: '400 ft' })]); ceil.style.top = yFor(400) + '%';
      var drone = droneSvg();
      sky.appendChild(band); sky.appendChild(ceil); sky.appendChild(h('div', { class: 'ground' })); sky.appendChild(drone);
      var altOut = h('p', { class: 'meter score', id: 'hover-alt' });
      var timeOut = h('p', { class: 'meter', id: 'hover-time' });
      var msg = h('p', { class: 'status', role: 'status', 'aria-live': 'polite', id: 'hover-msg' });
      var startBtn = h('button', { type: 'button', class: 'btn', id: 'hover-start' }); setLabel(startBtn, 'Start', 'Space');
      var pauseBtn = h('button', { type: 'button', class: 'btn alt', id: 'hover-pause', disabled: true }); setLabel(pauseBtn, 'Pause', 'P');
      var upBtn = h('button', { type: 'button', class: 'btn', id: 'hover-up', 'aria-label': 'Climb (hold)', text: '▲' });
      var dnBtn = h('button', { type: 'button', class: 'btn', id: 'hover-down', 'aria-label': 'Descend (hold)', text: '▼' });
      box.appendChild(h('p', { text: 'Keep the drone inside the green band (' + BAND_LO + ' to ' + BAND_HI + ' feet) while the wind pushes it. Hold ▲ or ▼, or use the Up and Down arrow keys (or W and S). Stay in the band for ' + GOAL + '% of ' + ROUND + ' seconds to win.' }));
      box.appendChild(h('div', { class: 'hover-wrap' }, [sky, h('div', { class: 'hud' }, [altOut, timeOut, h('div', { class: 'row hover-ctl' }, [startBtn, pauseBtn]), h('div', { class: 'pad' }, [upBtn, dnBtn]), msg])]));
      box.appendChild(factList(api, C.HOVER_FACTS));
      box.appendChild(api.sourcesBox(allFacts(C.HOVER_FACTS)));

      function draw() {
        drone.style.top = yFor(st.alt) + '%';
        var inB = st.alt >= BAND_LO && st.alt <= BAND_HI;
        altOut.textContent = 'Height: ' + Math.round(st.alt) + ' ft' + (inB ? ' (in band)' : '');
        timeOut.textContent = 'Time: ' + Math.max(0, ROUND - st.t).toFixed(1) + ' s · In band: ' + Math.round(100 * st.inBand / ROUND) + '%';
        box.setAttribute('data-alt', String(Math.round(st.alt)));
        box.setAttribute('data-state', st.run ? (st.paused ? 'paused' : 'running') : 'idle');
      }
      var last = 0, raf = 0, warned = false;
      function step(ts) {
        raf = window.requestAnimationFrame(step);
        if (!last) { last = ts; return; }
        var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
        if (!st.run || st.paused) return;
        HOVER.step(st, dt, Math.random, reduced);
        if (st.alt > 400) { if (!warned) { msg.textContent = 'Above 400 feet! Come back down. That is over the Class G limit.'; warned = true; } } else warned = false;
        if (st.t >= ROUND) finish();
        draw();
      }
      function begin() {
        HOVER.init(st); st.run = true; st.paused = false;
        msg.textContent = 'Go! Keep it in the green band.';
        fitGame();
        setLabel(startBtn, 'Restart'); pauseBtn.disabled = false; setLabel(pauseBtn, 'Pause', 'P');
        draw();
      }
      // On short screens, bring the whole game (Start row, readouts, sky, climb/descend pad, message)
      // into view above the pinned bar when a round starts, so every control can be tapped without scrolling.
      function fitGame() {
        var wrap = box.querySelector('.hover-wrap'); if (!wrap) return;
        var bar = document.getElementById('disclaimer-foot');
        var limit = (bar ? bar.getBoundingClientRect().top : window.innerHeight) - 6;
        var top = wrap.getBoundingClientRect().top, bottom = 0;
        [upBtn, dnBtn, msg, altOut, timeOut, sky].forEach(function (el) { bottom = Math.max(bottom, el.getBoundingClientRect().bottom); });
        if (bottom > limit) window.scrollBy(0, Math.min(bottom - limit, top - 6));
        else if (top < 0) window.scrollBy(0, top - 6);
      }
      function finish() {
        st.run = false; pauseBtn.disabled = true;
        var pct = Math.round(100 * st.inBand / ROUND);
        var s = api.state();
        s.games.hover.best = Math.max(s.games.hover.best, pct);
        if (pct >= GOAL) s.games.hover.wins += 1;
        api.save();
        msg.textContent = (pct >= GOAL ? 'Steady flying! ' : 'Keep practicing. ') + 'You stayed in the band ' + pct + '% of the time' + (st.over > 0 ? ', and went above 400 feet for ' + st.over.toFixed(1) + ' seconds.' : '.') + ' Press Start to try again.';
        setLabel(startBtn, 'Start', 'Space');
        draw();
      }
      function togglePause() {
        if (!st.run) return;
        st.paused = !st.paused; setLabel(pauseBtn, st.paused ? 'Resume' : 'Pause', 'P');
        msg.textContent = st.paused ? 'Paused.' : 'Back to it!';
        if (!st.paused) fitGame();
        draw();
      }
      var refitT = 0;
      function refitSoon(ms) { window.clearTimeout(refitT); refitT = window.setTimeout(function () { if (st.run && !st.paused && document.body.contains(box)) fitGame(); }, ms); }
      window.addEventListener('resize', function () { refitSoon(250); });
      window.addEventListener('orientationchange', function () { refitSoon(400); });
      window.addEventListener('scroll', function () { if (!st.up && !st.down) refitSoon(600); }, { passive: true });
      startBtn.addEventListener('click', begin);
      pauseBtn.addEventListener('click', togglePause);
      function hold(btn, key) {
        function on(e) { e.preventDefault(); st[key] = true; if (btn.setPointerCapture && e.pointerId !== undefined) { try { btn.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } } }
        function off() { st[key] = false; }
        btn.addEventListener('pointerdown', on);
        btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('lostpointercapture', off);
        btn.addEventListener('touchstart', function (e) { e.preventDefault(); st[key] = true; }, { passive: false });
        btn.addEventListener('touchend', off); btn.addEventListener('touchcancel', off);
        btn.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); st[key] = true; } });
        btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') st[key] = false; });
        btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      }
      hold(upBtn, 'up'); hold(dnBtn, 'down');
      function kd(e) {
        var t = e.target && e.target.tagName;
        if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
        var k = e.key;
        if (k === 'ArrowUp' || k === 'w' || k === 'W') { st.up = true; e.preventDefault(); }
        else if (k === 'ArrowDown' || k === 's' || k === 'S') { st.down = true; e.preventDefault(); }
        else if ((k === ' ' || k === 'Spacebar') && (e.target === document.body || e.target === startBtn || e.target === sky || !e.target.closest || !e.target.closest('button,a,summary'))) {
          e.preventDefault();
          if (!st.run) begin(); // during a round Space does nothing, so a rushed tap can't wipe the run
        }
        else if (k === 'p' || k === 'P') togglePause();
      }
      function ku(e) {
        var k = e.key;
        if (k === 'ArrowUp' || k === 'w' || k === 'W') st.up = false;
        if (k === 'ArrowDown' || k === 's' || k === 'S') st.down = false;
      }
      function blur() { st.up = st.down = false; if (st.run && !st.paused) togglePause(); }
      document.addEventListener('keydown', kd);
      document.addEventListener('keyup', ku);
      window.addEventListener('blur', blur);
      draw();
      raf = window.requestAnimationFrame(step);
      return function stop() {
        window.cancelAnimationFrame(raf);
        document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      };
    }
  };

  // ---------------- Airspace path ----------------
  var ZONE = { '.': 'Class G (open)', S: 'Start', F: 'Flying field (finish)', D: 'Class D airport area', T: 'TFR: wildfire', X: 'Stadium during an NFL game' };
  var path = {
    title: 'Airspace path',
    start: function (box, api) {
      var h = api.h, C = api.C;
      var lvl = 0, route = [], grid = [], cells = [], rows = 0, cols = 0;
      var msg = h('p', { class: 'status score', role: 'status', 'aria-live': 'polite', id: 'path-msg' });
      var map = h('div', { class: 'map', id: 'path-map', role: 'group', 'aria-label': 'Map. Use arrow keys to move, Enter to add a square.' });
      var altSel = h('select', { id: 'path-alt' }, [h('option', { value: '', text: 'Pick a height' })].concat([100, 200, 300, 400, 500, 600].map(function (v) { return h('option', { value: String(v), text: v + ' ft' }); })));
      var lvlRow = h('div', { class: 'row', role: 'group', 'aria-label': 'Maps' });
      var routeOut = h('p', { class: 'small', id: 'path-route' });
      box.appendChild(h('p', { text: 'Plan a route from S (start) to F (the flying field). Tap or click squares next to the end of your route, or use the arrow keys and Enter. Tap the last square again to undo it. Then pick a height and press Check route.' }));
      box.appendChild(lvlRow);
      box.appendChild(h('ul', { class: 'legend' }, [
        h('li', null, [h('span', { class: 'sw g' }), 'Class G (open)']),
        h('li', null, [h('span', { class: 'sw d' }), 'D = Class D airport area']),
        h('li', null, [h('span', { class: 'sw t' }), 'T = TFR (wildfire)']),
        h('li', null, [h('span', { class: 'sw x' }), 'X = stadium game'])
      ]));
      var nextBtn = h('button', { type: 'button', class: 'btn', id: 'path-next', text: 'Next map →', hidden: true, onclick: function () { if (lvl < C.PATH_LEVELS.length - 1) { lvl++; build(); var f = map.querySelector('.cell[tabindex="0"]'); if (f) f.focus(); } } });
      var side = h('div', { class: 'path-side' });
      box.appendChild(h('div', { class: 'path-wrap' }, [map, side]));
      side.appendChild(routeOut);
      side.appendChild(h('div', { class: 'row' }, [
        h('label', { for: 'path-alt', text: 'Route height:' }), altSel,
        h('button', { type: 'button', class: 'btn', id: 'path-check', text: 'Check route', onclick: check }),
        h('button', { type: 'button', class: 'btn alt', id: 'path-undo', text: 'Undo', onclick: function () { if (route.length > 1) { route.pop(); paint(); msg.textContent = 'Removed the last square.'; } } }),
        h('button', { type: 'button', class: 'btn alt', id: 'path-clear', text: 'Clear', onclick: function () { route = route.slice(0, 1); paint(); msg.textContent = 'Route cleared.'; } })
      ]));
      side.appendChild(msg);
      side.appendChild(h('div', { class: 'row path-next-row' }, [nextBtn]));
      box.appendChild(factList(api, C.PATH_FACTS));
      box.appendChild(api.sourcesBox(allFacts(C.PATH_FACTS)));

      function idx(r, c) { return r * cols + c; }
      function inRoute(r, c) { for (var i = 0; i < route.length; i++) if (route[i][0] === r && route[i][1] === c) return i; return -1; }
      function label(r, c) {
        var z = grid[r][c];
        var on = inRoute(r, c) >= 0 ? ', on your route' : '';
        return 'Row ' + (r + 1) + ', column ' + (c + 1) + ': ' + ZONE[z] + on;
      }
      function paint(bad) {
        cells.forEach(function (b) {
          var r = +b.getAttribute('data-r'), c = +b.getAttribute('data-c');
          var z = grid[r][c];
          var i = inRoute(r, c);
          b.className = 'cell ' + (z === '.' ? 'G' : z) + (i >= 0 ? ' on' : '') + (i === route.length - 1 ? ' end' : '') + (bad && bad[idx(r, c)] ? ' bad' : '');
          b.setAttribute('aria-pressed', i >= 0 ? 'true' : 'false');
          b.setAttribute('aria-label', label(r, c));
        });
        routeOut.textContent = 'Route: ' + route.length + ' squares' + (route.length && grid[route[route.length - 1][0]][route[route.length - 1][1]] === 'F' ? ' (reaches the field)' : '');
      }
      function tap(r, c) {
        var i = inRoute(r, c);
        var end = route[route.length - 1];
        if (i === route.length - 1 && route.length > 1) { route.pop(); paint(); msg.textContent = 'Removed that square.'; return; }
        if (i >= 0) { msg.textContent = 'That square is already on your route.'; return; }
        if (Math.abs(end[0] - r) + Math.abs(end[1] - c) !== 1) { msg.textContent = 'Pick a square right next to the end of your route (up, down, left, or right).'; showMsg(); return; }
        route.push([r, c]); paint(); msg.textContent = '';
        // Route reaches the field: bring the height picker and Check route into view (clear of the pinned bar).
        if (grid[r][c] === 'F') { var ck = document.getElementById('path-check'); if (ck && ck.scrollIntoView) ck.scrollIntoView({ block: 'nearest' }); }
      }
      function focusCell(r, c) {
        cells.forEach(function (b) { b.tabIndex = -1; });
        var b = cells[idx(r, c)]; b.tabIndex = 0; b.focus();
      }
      // On narrow phones the 6x9 map is shown turned (9 rows x 6 columns) so every square can be 44px+.
      var narrowMQ = window.matchMedia ? window.matchMedia('(max-width: 480px)') : null;
      function narrow() { return !!(narrowMQ && narrowMQ.matches); }
      function gridFor(L) {
        var g = L.rows.map(function (row) { return row.split(''); });
        if (!narrow()) return g;
        return g[0].map(function (_, c) { return g.map(function (row) { return row[c]; }); });
      }
      function build(keepRoute) {
        var L = C.PATH_LEVELS[lvl];
        grid = gridFor(L);
        map.setAttribute('data-turned', narrow() ? '1' : '0');
        nextBtn.hidden = true;
        rows = grid.length; cols = grid[0].length;
        route = [];
        map.textContent = ''; cells = [];
        map.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var z = grid[r][c];
          if (z === 'S') route = [[r, c]];
          var b = h('button', { type: 'button', class: 'cell', 'data-r': String(r), 'data-c': String(c), 'data-z': z, tabindex: '-1', text: z === '.' ? '' : z });
          (function (rr, cc) {
            b.addEventListener('click', function () { tap(rr, cc); });
            b.addEventListener('keydown', function (e) {
              var nr = rr, nc = cc;
              if (e.key === 'ArrowUp') nr--; else if (e.key === 'ArrowDown') nr++; else if (e.key === 'ArrowLeft') nc--; else if (e.key === 'ArrowRight') nc++; else return;
              e.preventDefault();
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) focusCell(nr, nc);
            });
          })(r, c);
          cells.push(b); map.appendChild(b);
        }
        if (keepRoute) route = keepRoute;
        cells[idx(route[0][0], route[0][1])].tabIndex = 0;
        if (!keepRoute) { altSel.value = ''; msg.textContent = 'Map ' + (lvl + 1) + ': ' + L.name + '.'; }
        lvlRow.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-pressed', i === lvl ? 'true' : 'false'); });
        paint();
      }
      C.PATH_LEVELS.forEach(function (L, i) {
        var done = api.state().games.path.done.indexOf(L.id) >= 0;
        lvlRow.appendChild(h('button', { type: 'button', class: 'btn alt', 'data-level': String(i), text: 'Map ' + (i + 1) + (done ? ' ✓' : ''), onclick: function () { lvl = i; build(); } }));
      });
      function check() {
        var bad = {}, nBad = 0, kinds = {};
        route.forEach(function (p) { var z = grid[p[0]][p[1]]; if (z === 'D' || z === 'T' || z === 'X') { bad[idx(p[0], p[1])] = 1; nBad++; kinds[z] = 1; } });
        var end = route[route.length - 1];
        var alt = altSel.value ? +altSel.value : 0;
        var probs = [];
        if (nBad) {
          if (kinds.D) probs.push('Your route enters Class D airport airspace. You would need FAA permission through LAANC or DroneZone first.');
          if (kinds.T) probs.push('Your route goes into a wildfire TFR. Stay out.');
          if (kinds.X) probs.push('Your route crosses the stadium during a game. No drones there.');
        }
        if (grid[end[0]][end[1]] !== 'F') probs.push('Your route does not reach F yet.');
        if (!alt) probs.push('Pick a route height.');
        else if (alt > 400) probs.push(alt + ' feet is too high. In Class G, fly at 400 feet or lower.');
        paint(bad);
        if (probs.length) { msg.textContent = 'Not yet. ' + probs.join(' '); showMsg(); return; }
        var s = api.state(), id = C.PATH_LEVELS[lvl].id;
        if (s.games.path.done.indexOf(id) < 0) s.games.path.done.push(id);
        api.save();
        var lb = lvlRow.querySelector('[data-level="' + lvl + '"]'); if (lb) lb.textContent = 'Map ' + (lvl + 1) + ' ✓';
        msg.textContent = 'Safe route! You stayed in Class G, out of restricted areas, at ' + alt + ' feet.' + (lvl < C.PATH_LEVELS.length - 1 ? ' Try the next map.' : ' You solved every map.');
        nextBtn.hidden = lvl >= C.PATH_LEVELS.length - 1;
        showMsg();
      }
      // Make sure the feedback line (and Next map) is on screen after Check, above the pinned bar.
      function showMsg() {
        var r1 = msg.getBoundingClientRect(), r2 = nextBtn.hidden ? r1 : nextBtn.getBoundingClientRect();
        var top = Math.min(r1.top, r2.top), bot = Math.max(r1.bottom, r2.bottom);
        var bar = document.getElementById('disclaimer-foot');
        var limit = bar ? bar.getBoundingClientRect().top : window.innerHeight;
        if (top < 0) window.scrollBy(0, top - 8);
        else if (bot > limit) window.scrollBy(0, Math.min(top - 8, bot - limit + 8));
      }
      function onMQ() { var keep = route.map(function (p) { return [p[1], p[0]]; }); build(keep); }
      if (narrowMQ) { if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', onMQ); else if (narrowMQ.addListener) narrowMQ.addListener(onMQ); }
      build();
      return function stop() { if (narrowMQ) { if (narrowMQ.removeEventListener) narrowMQ.removeEventListener('change', onMQ); else if (narrowMQ.removeListener) narrowMQ.removeListener(onMQ); } };
    }
  };

  // ---------------- Visual observer calls ----------------
  function sceneIcon(kind) {
    var col = { heli: '#10284a', plane: '#10284a', crowd: '#a3231b', trees: '#17663a', clear: '#0b5cad', fire: '#d9480f', signal: '#4a5468', wind: '#4a5468', sun: '#c99700', stadium: '#a3231b' }[kind] || '#4a5468';
    var shapes = {
      heli: [svg('rect', { x: '18', y: '30', width: '30', height: '14', rx: '7', fill: col }), svg('line', { x1: '8', y1: '24', x2: '58', y2: '24', stroke: col, 'stroke-width': '3' }), svg('line', { x1: '48', y1: '37', x2: '66', y2: '33', stroke: col, 'stroke-width': '3' })],
      plane: [svg('path', { d: 'M8 38 L62 34 L66 38 L62 42 Z', fill: col }), svg('path', { d: 'M30 36 L40 20 L44 20 L40 36 Z', fill: col }), svg('path', { d: 'M30 40 L40 56 L44 56 L40 40 Z', fill: col })],
      crowd: [10, 26, 42, 58].map(function (x) { return svg('circle', { cx: String(x), cy: '40', r: '6', fill: col }); }),
      trees: [svg('rect', { x: '8', y: '20', width: '34', height: '40', fill: '#8a5a2b' }), svg('circle', { cx: '54', cy: '34', r: '12', fill: col })],
      clear: [svg('circle', { cx: '36', cy: '36', r: '22', fill: 'none', stroke: col, 'stroke-width': '4' }), svg('path', { d: 'M24 36 L33 45 L49 27', fill: 'none', stroke: col, 'stroke-width': '5' })],
      fire: [svg('path', { d: 'M36 10 C46 26 54 34 50 50 C46 62 26 62 22 50 C18 38 30 30 36 10 Z', fill: col })],
      signal: [8, 20, 32, 44].map(function (x, i) { return svg('rect', { x: String(x + 6), y: String(54 - i * 10), width: '8', height: String(10 + i * 10), fill: i < 1 ? col : '#c9d0dc' }); }),
      wind: [20, 34, 48].map(function (y) { return svg('path', { d: 'M8 ' + y + ' C30 ' + (y - 8) + ' 44 ' + (y + 8) + ' 64 ' + y, fill: 'none', stroke: col, 'stroke-width': '4' }); }),
      sun: [svg('circle', { cx: '36', cy: '36', r: '14', fill: col })],
      stadium: [svg('ellipse', { cx: '36', cy: '44', rx: '28', ry: '12', fill: 'none', stroke: col, 'stroke-width': '5' }), svg('line', { x1: '12', y1: '16', x2: '12', y2: '40', stroke: col, 'stroke-width': '3' }), svg('line', { x1: '60', y1: '16', x2: '60', y2: '40', stroke: col, 'stroke-width': '3' })]
    };
    return svg('svg', { viewBox: '0 0 72 72', 'aria-hidden': 'true', focusable: 'false' }, shapes[kind] || []);
  }
  var vo = {
    title: 'Visual observer calls',
    start: function (box, api) {
      var h = api.h, C = api.C;
      var order = [], i = 0, score = 0, answered = false;
      var sceneBox = h('div', { class: 'card', id: 'vo-scene', 'aria-live': 'polite' });
      var calls = h('div', { class: 'calls', role: 'group', 'aria-label': 'Your call' });
      var fb = h('p', { class: 'status score', role: 'status', 'aria-live': 'polite', id: 'vo-msg' });
      var nextBtn = h('button', { type: 'button', class: 'btn', id: 'vo-next', hidden: true }); setLabel(nextBtn, 'Next scene', 'Enter');
      var prog = h('p', { class: 'small', id: 'vo-prog' });
      box.appendChild(h('p', { text: 'You are the visual observer, standing right next to the pilot. Read each scene and make the call. Press a button, or press keys 1 to 5.' }));
      box.appendChild(prog); box.appendChild(sceneBox); box.appendChild(calls); box.appendChild(fb); box.appendChild(h('div', { class: 'row' }, [nextBtn]));
      box.appendChild(api.sourcesBox(allFacts(C.VO_SCENES)));
      C.VO_CALLS.forEach(function (c, n) {
        calls.appendChild(h('button', { type: 'button', class: 'btn', 'data-call': c.k, onclick: function () { answer(c.k); } }, [h('kbd', { text: String(n + 1) }), ' ' + c.label]));
      });
      function begin() {
        order = C.VO_SCENES.slice().sort(function () { return Math.random() - 0.5; });
        i = 0; score = 0; show();
      }
      function show() {
        answered = false; fb.textContent = ''; nextBtn.hidden = true;
        calls.querySelectorAll('button').forEach(function (b) { b.disabled = false; b.classList.remove('is-right', 'is-wrong'); b.removeAttribute('aria-label'); });
        var sc = order[i];
        sceneBox.textContent = '';
        sceneBox.setAttribute('data-scene', sc.id);
        sceneBox.appendChild(h('div', { class: 'scene' }, [sceneIcon(sc.icon), h('span', { text: sc.t })]));
        prog.textContent = 'Scene ' + (i + 1) + ' of ' + order.length + ' · Score: ' + score;
      }
      function answer(k) {
        if (answered) return;
        answered = true;
        var sc = order[i];
        var right = k === sc.a;
        if (right) score++;
        var good = C.VO_CALLS.filter(function (c) { return c.k === sc.a; })[0].label;
        fb.textContent = (right ? 'Good call! ' : 'Not the best call. The right call: "' + good + '". ') + sc.e;
        calls.querySelectorAll('button').forEach(function (b) {
          b.disabled = true;
          if (b.getAttribute('data-call') === sc.a) { b.classList.add('is-right'); b.setAttribute('aria-label', b.textContent + ' (right call)'); }
          else if (b.getAttribute('data-call') === k) { b.classList.add('is-wrong'); b.setAttribute('aria-label', b.textContent + ' (your call)'); }
        });
        prog.textContent = 'Scene ' + (i + 1) + ' of ' + order.length + ' · Score: ' + score;
        setLabel(nextBtn, i < order.length - 1 ? 'Next scene' : 'See results', 'Enter');
        nextBtn.hidden = false; nextBtn.focus();
      }
      function next() {
        if (!answered) return;
        if (i < order.length - 1) { i++; show(); var b = calls.querySelector('button'); if (b) b.focus(); return; }
        var s = api.state(); s.games.vo.best = Math.max(s.games.vo.best, score); s.games.vo.plays++; api.save();
        sceneBox.textContent = '';
        sceneBox.removeAttribute('data-scene');
        sceneBox.appendChild(h('p', { class: 'score', id: 'vo-final', text: 'You made ' + score + ' of ' + order.length + ' right calls.' }));
        sceneBox.appendChild(h('button', { type: 'button', class: 'btn', id: 'vo-again', text: 'Play again', onclick: begin }));
        calls.querySelectorAll('button').forEach(function (b) { b.disabled = true; b.classList.remove('is-right', 'is-wrong'); b.removeAttribute('aria-label'); });
        nextBtn.hidden = true; fb.textContent = score === order.length ? 'Perfect observer!' : 'Play again to improve.';
        var again = document.getElementById('vo-again'); if (again) again.focus();
      }
      nextBtn.addEventListener('click', next);
      function kd(e) {
        var t = e.target && e.target.tagName;
        if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
        if (/^[1-5]$/.test(e.key) && !answered && order[i] && document.getElementById('vo-scene').hasAttribute('data-scene')) { e.preventDefault(); answer(C.VO_CALLS[+e.key - 1].k); }
        else if (e.key === 'Enter' && answered && e.target !== nextBtn && !(e.target.closest && e.target.closest('a,button'))) { e.preventDefault(); next(); }
      }
      document.addEventListener('keydown', kd);
      begin();
      return function stop() { document.removeEventListener('keydown', kd); };
    }
  };

  window.TP_GAMES = { hover: hover, path: path, vo: vo };
  window.TP_HOVER = HOVER;
})();
