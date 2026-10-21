/* TRUST Prep slide decks (PROTOTYPE): engine + original inline-SVG diagram components.
   Captions are the existing Proof-reviewed lesson lines, pulled from content.js at run time (never retyped here).
   Every diagram label / legend / alt text below is NEW TEXT listed in review/slides-text-for-proof.md. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var KEY = 'trustprep-slides-v1';           // { "<module>": <slide index> } only; no names, no answers
  var uid = 0;

  // ---------- SVG helpers ----------
  function s(tag, attrs, kids) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function label(x, y, text, anchor, cls) {
    return s('text', { x: x, y: y, 'text-anchor': anchor || 'start', class: 'dg-label' + (cls ? ' ' + cls : '') }, [text]);
  }
  function arrowDefs(id) {
    return s('defs', null, [s('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, [
      s('path', { d: 'M0 0 L10 5 L0 10 z', class: 'dg-head' })
    ])]);
  }
  function sky() { return s('rect', { x: 0, y: 0, width: 320, height: 160, class: 'dg-sky' }); }
  function ground() { return s('rect', { x: 0, y: 160, width: 320, height: 20, class: 'dg-ground' }); }
  function drone(x, y, k) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')', class: 'dg-drone' }, [
      s('line', { x1: -18, y1: -6, x2: 18, y2: -6, class: 'dg-arm' }),
      s('ellipse', { cx: -18, cy: -9, rx: 9, ry: 2.5, class: 'dg-rotor' }),
      s('ellipse', { cx: 18, cy: -9, rx: 9, ry: 2.5, class: 'dg-rotor' }),
      s('rect', { x: -8, y: -7, width: 16, height: 9, rx: 3, class: 'dg-body' })
    ]);
  }
  // a stick person standing on the ground line (feet at y=160); k scales the height
  function person(x, k, opts) {
    k = k || 1; opts = opts || {};
    return s('g', { transform: 'translate(' + x + ' 160) scale(' + k + ')', class: 'dg-who' }, [
      s('circle', { cx: 0, cy: -56, r: 10, class: 'dg-person' }),
      s('path', { d: 'M0 -46 L0 -20 M0 -38 L-13 -28 M0 -38 L13 -30 M0 -20 L-10 0 M0 -20 L10 0', class: 'dg-person-line' }),
      opts.controller ? s('rect', { x: 9, y: -36, width: 12, height: 8, rx: 2, class: 'dg-ctl' }) : null,
      opts.eye ? s('circle', { cx: 4, cy: -58, r: 2, class: 'dg-eye' }) : null
    ]);
  }
  function plane(x, y) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ')', class: 'dg-plane' }, [
      s('path', { d: 'M-34 0 Q-30 -6 -20 -6 L26 -6 Q34 -6 36 0 Q34 6 26 6 L-20 6 Q-30 6 -34 0 z', class: 'dg-fuse' }),
      s('path', { d: 'M-4 -5 L10 -28 L18 -28 L12 -5 z M-4 5 L10 28 L18 28 L12 5 z M26 -5 L32 -18 L37 -18 L35 -3 z', class: 'dg-wing' })
    ]);
  }
  function helicopter(x, y) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ')', class: 'dg-heli' }, [
      s('line', { x1: -30, y1: -16, x2: 30, y2: -16, class: 'dg-arm' }), s('line', { x1: 0, y1: -16, x2: 0, y2: -9, class: 'dg-arm' }),
      s('ellipse', { cx: 0, cy: 0, rx: 18, ry: 10, class: 'dg-fuse' }),
      s('path', { d: 'M16 -2 L46 -4 L46 2 L16 4 z', class: 'dg-wing' }), s('line', { x1: 46, y1: -10, x2: 46, y2: 6, class: 'dg-arm' }),
      s('path', { d: 'M-12 10 L-14 15 M10 10 L12 15 M-18 15 L18 15', class: 'dg-skid' })
    ]);
  }
  function check(x, y, k) { return s('path', { d: 'M0 0 L6 6 L16 -6', transform: 'translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')', class: 'dg-check' }); }
  function phone(x, y, kids) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ')' }, [
      s('rect', { x: -22, y: -40, width: 44, height: 80, rx: 7, class: 'dg-device' }),
      s('rect', { x: -17, y: -32, width: 34, height: 62, rx: 2, class: 'dg-screen' })
    ].concat(kids || []));
  }
  function laptop(x, y, kids) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ')' }, [
      s('rect', { x: -70, y: -50, width: 140, height: 88, rx: 6, class: 'dg-device' }),
      s('rect', { x: -62, y: -43, width: 124, height: 74, rx: 2, class: 'dg-screen' }),
      s('path', { d: 'M-86 38 L86 38 L78 48 L-78 48 z', class: 'dg-device' })
    ].concat(kids || []));
  }

  // ---------- diagram components ----------
  // Each: { alt, draw() -> svg children, legend: [[swatchClass, text], ...] (optional HTML legend under the SVG) }
  var DIAGRAMS = {
    // ---- shared components (Proof's rules: 5.1/5.2, section 4, 6.1, 8.1) ----
    ceiling: {   // 5.1, 5.2: the line is measured up from the actual ground
      alt: 'Diagram: a drone flying below a dashed line. An arrow measures the height of the line straight up from the ground.',
      draw: function () {
        var id = 'dg-ah-' + (++uid);
        return [arrowDefs(id), sky(), ground(),
          s('line', { x1: 0, y1: 40, x2: 320, y2: 40, class: 'dg-ceiling' }),
          s('line', { x1: 34, y1: 158, x2: 34, y2: 43, class: 'dg-dim', 'marker-start': 'url(#' + id + ')', 'marker-end': 'url(#' + id + ')' }),
          label(46, 32, '400 ft above ground level', 'start', 'dg-strong'),
          drone(196, 104, 1.3)];
      }
    },
    sight: {     // 4.1: the flyer sees the drone with their own eyes
      alt: 'Diagram: a person on the ground holding a controller and looking at their drone. A dashed line goes from the person\'s eyes to the drone.',
      draw: function () {
        return [sky(), ground(), person(64, 1, { controller: true, eye: true }),
          s('line', { x1: 70, y1: 102, x2: 246, y2: 54, class: 'dg-sight' }), drone(254, 52, 1.2)];
      }
    },
    observer: {  // 4.1, 4.2: a visual observer right next to the flyer, talking with them
      alt: 'Diagram: two people stand side by side on the ground. One holds the controller. The other, the visual observer, watches the drone and talks with the flyer.',
      draw: function () {
        return [sky(), ground(), person(56, 1, { controller: true }), person(96, 1, { eye: true }),
          s('path', { d: 'M66 90 Q76 80 86 90', class: 'dg-talk' }), s('path', { d: 'M62 84 Q76 70 90 84', class: 'dg-talk' }),
          s('line', { x1: 102, y1: 102, x2: 246, y2: 54, class: 'dg-sight' }), drone(254, 52, 1.2),
          label(96, 176, 'visual observer', 'middle', 'dg-on-ground')];
      }
    },
    giveway: {   // 6.1: the drone moves away from the airplane, never the other way around
      alt: 'Diagram: an airplane flies toward a drone. A curved arrow shows the drone moving down and away from the airplane.',
      draw: function () {
        var id = 'dg-ah-' + (++uid);
        return [arrowDefs(id), sky(), ground(), plane(250, 46),
          s('line', { x1: 206, y1: 46, x2: 156, y2: 46, class: 'dg-path', 'marker-end': 'url(#' + id + ')' }),
          drone(124, 58, 1.2),
          s('path', { d: 'M114 72 Q98 104 64 124', class: 'dg-move', 'marker-end': 'url(#' + id + ')' }),
          label(20, 150, 'Drones always give way', 'start', 'dg-strong')];
      }
    },
    giveway_heli: { // 6.1 with a helicopter
      alt: 'Diagram: a helicopter flies toward a drone. A curved arrow shows the drone moving down and away from the helicopter.',
      draw: function () {
        var id = 'dg-ah-' + (++uid);
        return [arrowDefs(id), sky(), ground(), helicopter(244, 50),
          s('line', { x1: 214, y1: 52, x2: 160, y2: 52, class: 'dg-path', 'marker-end': 'url(#' + id + ')' }),
          drone(124, 58, 1.2),
          s('path', { d: 'M114 72 Q98 104 64 124', class: 'dg-move', 'marker-end': 'url(#' + id + ')' }),
          label(20, 150, 'Drones always give way', 'start', 'dg-strong')];
      }
    },
    airspace: {  // 8.1 + 5.1: plain unlabeled shapes; no classes, ceilings, distances or real airports drawn
      alt: 'Diagram: a side view of the sky. Over an airport, plain stacked shapes show controlled airspace. All the other sky is uncontrolled. A drone flies low, away from the shapes.',
      draw: function () {
        return [sky(), ground(),
          s('path', { d: 'M78 30 H242 V78 H206 V160 H114 V78 H78 Z', class: 'dg-zone' }),
          s('rect', { x: 128, y: 154, width: 64, height: 6, class: 'dg-runway' }),
          drone(38, 132, 1)];
      },
      legend: [['sw-sky', 'Uncontrolled (Class G) airspace: You don\'t need permission to fly there.'],
               ['sw-zone', 'Controlled airspace: You need FAA permission before you fly there, and you get it through LAANC or DroneZone.']]
    },
    // ---- Module 1 pictures (no words on them) ----
    flyer: {
      alt: 'Picture: a kid on the ground flies a drone for fun with a controller.',
      draw: function () { return [sky(), ground(), person(110, 1, { controller: true, eye: true }), drone(214, 66, 1.4)]; }
    },
    online: {
      alt: 'Picture: a laptop screen showing a drone and a list of lessons, each with a check mark.',
      draw: function () {
        return [s('rect', { x: 0, y: 0, width: 320, height: 180, class: 'dg-room' }),
          laptop(160, 96, [drone(-30, -4, 0.9),
            s('line', { x1: 2, y1: -24, x2: 46, y2: -24, class: 'dg-row' }), s('line', { x1: 2, y1: -4, x2: 46, y2: -4, class: 'dg-row' }), s('line', { x1: 2, y1: 16, x2: 46, y2: 16, class: 'dg-row' }),
            check(50, -26, 0.7), check(50, -6, 0.7), check(50, 14, 0.7)])];
      }
    },
    ages: {
      alt: 'Picture: three kids of different heights, each holding a drone controller.',
      draw: function () { return [sky(), ground(), person(90, 0.7, { controller: true }), person(160, 0.9, { controller: true }), person(232, 1.15, { controller: true }), drone(160, 36, 1)]; }
    },
    checks: {
      alt: 'Picture: three practice questions. Each has a check mark, and a bar below is filled all the way.',
      draw: function () {
        var rows = [0, 1, 2].map(function (i) {
          var y = 34 + i * 38;
          return s('g', null, [s('rect', { x: 60, y: y - 14, width: 200, height: 28, rx: 5, class: 'dg-card' }),
            s('line', { x1: 74, y1: y, x2: 210, y2: y, class: 'dg-row' }), check(224, y - 2, 0.9)]);
        });
        return [s('rect', { x: 0, y: 0, width: 320, height: 180, class: 'dg-room' })].concat(rows).concat([
          s('rect', { x: 60, y: 146, width: 200, height: 14, rx: 7, class: 'dg-bar-full' })]);
      }
    },
    work: {
      alt: 'Picture: a drone with a camera flies over the roof of a house.',
      draw: function () {
        return [sky(), ground(),
          s('path', { d: 'M150 160 V108 L205 70 L260 108 V160 Z', class: 'dg-house' }), s('rect', { x: 196, y: 126, width: 18, height: 34, class: 'dg-door' }),
          drone(120, 52, 1.3), s('circle', { cx: 120, cy: 60, r: 4, class: 'dg-cam' }),
          s('path', { d: 'M120 62 L176 96 L150 112 Z', class: 'dg-view' })];
      }
    },
    // ---- Module 7 pictures ----
    permission: {
      alt: 'Diagram: a drone waits outside the controlled airspace shapes near an airport. A phone with a check mark shows permission comes first.',
      draw: function () {
        var id = 'dg-ah-' + (++uid);
        return [arrowDefs(id), sky(), ground(),
          s('path', { d: 'M118 30 H282 V78 H246 V160 H154 V78 H118 Z', class: 'dg-zone' }),
          s('rect', { x: 168, y: 154, width: 64, height: 6, class: 'dg-runway' }),
          drone(40, 104, 1), s('line', { x1: 64, y1: 98, x2: 112, y2: 98, class: 'dg-path', 'marker-end': 'url(#' + id + ')' }),
          phone(60, 52, [check(-8, 0, 1)]), label(60, 150, 'LAANC or DroneZone', 'start', 'dg-strong')];
      }
    },
    laanc: {
      alt: 'Picture: a phone app gives a quick answer with a check mark.',
      draw: function () {
        return [s('rect', { x: 0, y: 0, width: 320, height: 180, class: 'dg-room' }), phone(160, 90, [check(-8, 0, 1.1)]),
          s('path', { d: 'M222 52 L206 86 L220 86 L208 118 L236 78 L222 78 L232 52 Z', class: 'dg-bolt' }), label(160, 172, 'LAANC', 'middle', 'dg-strong')];
      }
    },
    dronezone: {
      alt: 'Picture: a laptop shows a website request form. An hourglass shows the answer takes a while because a person reviews it.',
      draw: function () {
        return [s('rect', { x: 0, y: 0, width: 320, height: 180, class: 'dg-room' }),
          laptop(140, 92, [s('line', { x1: -48, y1: -26, x2: 40, y2: -26, class: 'dg-row' }), s('line', { x1: -48, y1: -8, x2: 40, y2: -8, class: 'dg-row' }), s('line', { x1: -48, y1: 10, x2: 10, y2: 10, class: 'dg-row' })]),
          s('path', { d: 'M248 60 H280 L264 86 L280 112 H248 L264 86 Z', class: 'dg-glass' }), label(140, 172, 'DroneZone', 'middle', 'dg-strong')];
      }
    },
    tower: {
      alt: 'Picture: an airport tower with a crossed-out phone next to it, and a map with a magnifying glass.',
      draw: function () {
        return [sky(), ground(),
          s('path', { d: 'M62 160 L68 78 H88 L94 160 Z', class: 'dg-tower' }), s('path', { d: 'M56 62 H100 L94 78 H62 Z', class: 'dg-cab' }),
          s('g', { transform: 'translate(124 80)' }, [s('path', { d: 'M-10 -12 Q-14 0 -10 12 L-4 10 Q-6 0 -4 -10 Z', class: 'dg-handset' }), s('line', { x1: -18, y1: -18, x2: 14, y2: 18, class: 'dg-x' }), s('line', { x1: 14, y1: -18, x2: -18, y2: 18, class: 'dg-x' })]),
          s('rect', { x: 180, y: 46, width: 110, height: 80, rx: 4, class: 'dg-map' }),
          s('path', { d: 'M180 86 Q220 70 240 96 T290 90', class: 'dg-road' }),
          s('circle', { cx: 252, cy: 78, r: 15, class: 'dg-lens' }), s('line', { x1: 263, y1: 89, x2: 280, y2: 106, class: 'dg-handle' }),
          label(235, 40, 'B4UFLY', 'middle', 'dg-strong'), label(235, 131, 'map check,', 'middle'), label(235, 157, 'not permission', 'middle')];
      }
    }
  };

  function legendFor(d) {
    if (!d.legend) return null;
    var ul = document.createElement('ul'); ul.className = 'dg-legend';
    d.legend.forEach(function (x) {
      var li = document.createElement('li'); var sw = document.createElement('span');
      sw.className = 'sw ' + x[0]; sw.setAttribute('aria-hidden', 'true');
      li.appendChild(sw); li.appendChild(document.createTextNode(x[1])); ul.appendChild(li);
    });
    return ul;
  }
  function diagram(kind) {
    var d = DIAGRAMS[kind]; var tid = 'dg-t-' + (++uid);
    return s('svg', { viewBox: '0 0 320 180', role: 'img', 'aria-labelledby': tid, class: 'dg dg-k-' + kind, focusable: 'false' },
      [s('title', { id: tid }, [d.alt])].concat(d.draw()));
  }

  // ---------- decks: lesson line IDs (text comes from content.js) + one diagram per slide ----------
  var DECKS = {
    1: [
      { lines: ['L1.1'], dg: 'flyer' },
      { lines: ['L1.2', 'L1.3'], dg: 'online' },
      { lines: ['L1.4'], dg: 'ages' },
      { lines: ['L1.5', 'L1.6'], dg: 'checks' },
      { lines: ['L1.7'], dg: 'work' }
    ],
    7: [
      { lines: ['L7.1'], dg: 'airspace' },
      { lines: ['L7.2'], dg: 'permission' },
      { lines: ['L7.3', 'L7.4'], dg: 'laanc' },
      { lines: ['L7.5', 'L7.6'], dg: 'dronezone' },
      { lines: ['L7.7', 'L7.8'], dg: 'tower' }
    ]
  };

  // ---------- saved place ----------
  function readAll() {
    try { var o = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
  }
  function okIndex(v, len) { return v === +v && v % 1 === 0 && v >= 0 && v < len; }
  function savedIndex(n, len) { var v = readAll()[n]; return okIndex(v, len) ? v : 0; }
  function saveIndex(n, i) {
    var o = readAll(), clean = {};
    Object.keys(o).forEach(function (k) { if (DECKS[k] && okIndex(o[k], DECKS[k].length)) clean[k] = o[k]; });
    clean[n] = i;
    try { window.localStorage.setItem(KEY, JSON.stringify(clean)); } catch (e) { /* ignore */ }
  }

  // ---------- engine ----------
  // opts: { h, line(id) -> <li>, hint (node or null), keepClear(el), checkSel }
  function mount(n, opts) {
    var deck = DECKS[n]; if (!deck) return null;
    var h = opts.h, len = deck.length, i = savedIndex(n, len), shownOnce = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var figs = deck.map(function (sl, k) {
      var d = DIAGRAMS[sl.dg];
      return h('figure', { class: 'slide', 'aria-roledescription': 'slide', 'aria-label': 'Slide ' + (k + 1) + ' of ' + len, 'data-slide': String(k + 1), hidden: true }, [
        diagram(sl.dg), legendFor(d),
        h('figcaption', { class: 'cap' }, [h('ul', null, sl.lines.map(opts.line))])
      ]);
    });
    var stage = h('div', { class: 'stage', id: 'deck-stage' }, figs);
    var counter = h('p', { class: 'counter', id: 'deck-count', role: 'status', 'aria-live': 'polite' });
    var dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, deck.map(function () { return h('span', { class: 'dot' }); }));
    var back = h('button', { type: 'button', class: 'btn alt', id: 'deck-back', text: 'Back' });
    var next = h('button', { type: 'button', class: 'btn', id: 'deck-next', text: 'Next' });
    var nav = h('div', { class: 'deck-nav', id: 'deck-nav' }, [back, h('div', { class: 'deck-pos' }, [counter, dots]), next]);
    var sec = h('section', { class: 'card deck lesson', id: 'deck', 'aria-roledescription': 'slide deck', 'aria-labelledby': 'les-h', 'data-module': String(n) }, [
      h('h2', { id: 'les-h', text: 'Lesson' }), opts.hint || null, nav, stage
    ]);

    function show(dir) {
      figs.forEach(function (f, k) {
        f.hidden = k !== i;
        f.classList.remove('in-next', 'in-prev');
        if (k === i && dir && !reduce) { void f.offsetWidth; f.classList.add(dir > 0 ? 'in-next' : 'in-prev'); }
      });
      counter.textContent = 'Slide ' + (i + 1) + ' of ' + len;
      Array.prototype.forEach.call(dots.children, function (d, k) { d.className = 'dot' + (k === i ? ' on' : ''); });
      // aria-disabled (not disabled) so focus never drops to <body> at either end
      back.setAttribute('aria-disabled', i === 0 ? 'true' : 'false');
      next.setAttribute('data-last', i === len - 1 ? '1' : '0');
      if (shownOnce) saveIndex(n, i);
      shownOnce = true;
    }
    var lastGo = 0;
    function go(d) {
      var now = Date.now(); if (now - lastGo < 400) return; lastGo = now;
      var j = i + d;
      if (j < 0) return;
      if (j >= len) { toCheck(); return; }
      // a focused word-help button on the old slide is about to be hidden; keep focus on a control
      var ae = document.activeElement; var moveFocus = ae && stage.contains(ae);
      i = j; show(d);
      if (moveFocus) (d > 0 ? next : back).focus();
      if (opts.keepClear) opts.keepClear(nav);
    }
    function toCheck() {
      var c = document.querySelector(opts.checkSel || '#chk-h'); if (!c) return;
      if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '-1');
      c.focus(); c.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
    back.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    sec.addEventListener('keydown', function (e) {
      var t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    var t0 = null;
    stage.addEventListener('touchstart', function (e) { var p = e.changedTouches[0]; t0 = { x: p.clientX, y: p.clientY }; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (!t0) return; var p = e.changedTouches[0], dx = p.clientX - t0.x, dy = p.clientY - t0.y; t0 = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0 && i < len - 1) go(1); else if (dx > 0) go(-1); }
    }, { passive: true });
    show(0);
    return sec;
  }

  window.TP_SLIDES = { mount: mount, DECKS: DECKS, DIAGRAMS: DIAGRAMS, KEY: KEY, diagram: diagram, legendFor: legendFor,
    parts: { s: s, label: label, arrowDefs: arrowDefs, sky: sky, ground: ground, drone: drone, person: person, plane: plane, helicopter: helicopter, check: check } };
})();
