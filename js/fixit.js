/* TRUST Prep game 4 (PROTOTYPE): "Fix it". Each round has one thing wrong; the student fixes it, then presses Check.
   Facts come only from review/faa-facts.md (IDs in each round). All wording here is NEW TEXT listed in
   review/fixit-text-for-proof.md. Scenes reuse the slide diagram parts (original inline SVG). */
(function () {
  'use strict';
  var KEY = 'trustprep-fixit-v1';   // { best, of, plays } only
  var GROUND = 160, LINE_Y = 96, FT_PER_UNIT = 400 / (GROUND - LINE_Y);
  function ft(y) { return Math.round((GROUND - y) * FT_PER_UNIT); }
  function yFor(f) { return GROUND - f / FT_PER_UNIT; }

  // eye of the flyer and the tree block in the line-of-sight round
  var EYE = { x: 44, y: 102 }, TREES = { x0: 150, x1: 214, y0: 46, y1: 160 };
  function segHitsRect(a, b, r) {      // does segment a-b pass through rectangle r?
    for (var k = 0; k <= 40; k++) {
      var t = k / 40, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return true;
    }
    return false;
  }

  // ---------- rounds ----------
  // move rounds: what = the thing you move, axis, start, bounds, ok(p) = the one correct end state,
  // zone = the core target area in scene units (drawn invisibly; used for the 44px / bar checks)
  var ROUNDS = [
    { id: 'FX1', f: ['5.1', '5.2'], type: 'move', what: 'drone', axis: 'y', step: 1.6,
      prompt: 'You are flying for fun in Class G airspace. Look at the height. Fix it, then press Check.',
      alt: 'A drone flies above a dashed line marked 400 ft above ground level.',
      start: { x: 252, y: yFor(450) }, bounds: { x0: 252, x1: 252, y0: 8, y1: 156 },
      zone: { x0: 222, x1: 282, y0: LINE_Y, y1: 156 },
      ok: function (p) { return ft(p.y) <= 400; },
      where: function (p) { return 'Height: ' + ft(p.y) + ' ft'; },
      right: 'Fixed! In Class G airspace, fly at 400 feet above the ground or lower.',
      wrong: 'Still too high. In Class G airspace, fly at 400 feet above the ground or lower.' },
    { id: 'FX2', f: ['4.1'], type: 'move', what: 'drone', axis: 'xy', step: 12,
      prompt: 'Your drone flew behind the trees. Fix it, then press Check.',
      alt: 'A flyer stands on the left. A drone is on the far side of a row of tall trees, where the flyer cannot see it.',
      start: { x: 262, y: 104 }, bounds: { x0: 70, x1: 300, y0: 16, y1: 150 },
      zone: { x0: 74, x1: 140, y0: 40, y1: 140 },
      ok: function (p) { return !segHitsRect(EYE, p, TREES); },
      where: function (p) { return segHitsRect(EYE, p, TREES) ? 'The trees are between you and the drone.' : 'Nothing is between you and the drone.'; },
      right: 'Fixed! You must be able to see your drone with your own eyes the whole flight.',
      wrong: 'You still can\'t see it from where you stand. Bring it back where you can see it with your own eyes.' },
    { id: 'FX3', f: ['7.1'], type: 'move', what: 'drone', axis: 'xy', step: 12,
      prompt: 'Your drone is right above a crowd at a park event. Fix it, then press Check.',
      alt: 'A drone flies over a group of people at a park event. There is an empty field on the left.',
      start: { x: 228, y: 74 }, bounds: { x0: 20, x1: 300, y0: 16, y1: 130 },
      zone: { x0: 20, x1: 124, y0: 16, y1: 130 },
      ok: function (p) { return p.x <= 124; },
      where: function (p) { return p.x <= 124 ? 'The drone is over the empty field.' : (p.x < 168 ? 'The drone is close to the people.' : 'The drone is over the people.'); },
      right: 'Fixed! FAA safety guidance: never fly over groups of people or public events. Keep space between your drone and people.',
      wrong: 'That isn\'t safe yet. It is still over or too close to the people. Fly safely: move it over the empty field.' },
    { id: 'FX4', f: ['6.1'], type: 'move', what: 'drone', axis: 'xy', step: 8,
      prompt: 'A helicopter with people on board is flying toward your drone. Fix it, then press Check.',
      alt: 'A helicopter on the right flies toward a drone in the middle of the sky, at the same height.',
      start: { x: 150, y: 58 }, bounds: { x0: 20, x1: 230, y0: 16, y1: 156 },
      zone: { x0: 20, x1: 156, y0: 104, y1: 156 },
      ok: function (p) { return p.y >= 104 && p.x <= 156; },
      where: function (p) { return (p.y >= 104 ? 'The drone is well below the helicopter' : 'The drone is near the helicopter\'s height') + (p.x > 156 ? ', closer to it.' : '.'); },
      right: 'Fixed! Drones always give way to airplanes and helicopters with people on board. Staying away from them is your job.',
      wrong: 'Still in its way. Move your drone down and away from the helicopter.' },
    { id: 'FX5', f: ['4.2'], type: 'move', what: 'observer', axis: 'x', step: 16,
      prompt: 'You are flying with FPV goggles. Your friend will be your visual observer, but your friend is far away across the park. Fix it, then press Check.',
      alt: 'A flyer wearing FPV goggles stands in the middle of a park. Their friend stands far away on the right.',
      start: { x: 290, y: 0 }, bounds: { x0: 10, x1: 300, y0: 0, y1: 0 },
      zone: { x0: 124, x1: 176, y0: 96, y1: 160 },
      ok: function (p) { return Math.abs(p.x - 150) <= 26; },
      where: function (p) { return Math.abs(p.x - 150) <= 26 ? 'Your friend is right next to you.' : 'Your friend is far from you.'; },
      right: 'Fixed! You must have a visual observer if you fly with FPV goggles. The observer should be close enough to talk to you without a phone or radio.',
      wrong: 'Still too far. Your observer should be close enough to talk to you without a phone or radio.' },
    { id: 'FX6', f: ['8.1', '8.6', '8.7'], type: 'choice',
      prompt: 'You want to fly for fun inside the controlled airspace near this airport. What do you do first?',
      alt: 'A side view of the sky with plain stacked shapes over an airport. A drone waits outside the shapes.',
      opts: [
        { t: 'Get FAA permission through LAANC or DroneZone.', ok: true },
        { t: 'Call the airport tower.', why: 'Don\'t call the airport tower to ask for permission. You get it through LAANC or DroneZone.' },
        { t: 'Check B4UFLY, then fly.', why: 'B4UFLY is a map check, not permission. You need FAA permission first.' }
      ],
      right: 'Fixed! You need FAA permission before you fly there, and you get it through LAANC or DroneZone.' },
    { id: 'FX7', f: ['9.1', '9.4'], type: 'choice',
      prompt: 'Your new drone weighs 2 pounds. It is not registered, and you want to fly it for fun today. What do you do first?',
      alt: 'A drone sits on a scale that reads 2 lb. There is no registration number on it.',
      opts: [
        { t: 'Register it with the FAA on DroneZone, and put the number on the outside.', ok: true },
        { t: 'Just fly it. Only work drones need to be registered.', why: 'Drones flown for fun must be registered too if they weigh more than 0.55 pounds.' },
        { t: 'Fly it today and register it later.', why: 'Put your registration number on the outside of the drone before you fly.' }
      ],
      right: 'Fixed! If your drone weighs more than 0.55 pounds (about 250 grams), you have to register it with the FAA on DroneZone. Put the number on the outside before you fly.' },
    { id: 'FX8', f: ['11.4', '4.2'], type: 'choice',
      prompt: 'It is after dark, and your drone has no lights. The CBO guidelines you follow cover night flying, with lighting rules. What do you fix?',
      alt: 'A night sky with a moon. A dark drone with no lights is hard to see.',
      opts: [
        { t: 'Follow the CBO\'s night rules, like lights, and keep seeing the drone.', ok: true },
        { t: 'Nothing. You know where it is.', why: 'You can fly at night only if you follow CBO guidelines that cover night flying, like lighting rules. You still need to see the drone.' },
        { t: 'Watch it on the controller screen.', why: 'A screen doesn\'t count as seeing the drone.' }
      ],
      right: 'Fixed! You can fly at night only if the CBO guidelines you follow cover night flying, for example with lighting rules. You still need to see the drone.' }
  ];
  var NOTHING = 'Nothing changed yet. Fix the problem, then press Check.';
  var NOTHING_PICK = 'Pick a fix first, then press Check.';

  // ---------- scenes (original SVG; reuses slide parts) ----------
  function scene(r, P) {
    var s = P.s, out = [P.sky(), P.ground()];
    if (r.id === 'FX1') {
      out.push(s('line', { x1: 0, y1: LINE_Y, x2: 320, y2: LINE_Y, class: 'dg-ceiling' }), P.label(8, LINE_Y - 8, '400 ft above ground level', 'start', 'dg-strong'));
    } else if (r.id === 'FX2') {
      out.push(P.person(EYE.x - 4, 1, { controller: true, eye: true }));
      [[166, 62], [196, 52]].forEach(function (t) { out.push(s('rect', { x: t[0] - 4, y: 120, width: 8, height: 40, class: 'fx-trunk' }), s('ellipse', { cx: t[0], cy: t[1] + 36, rx: 22, ry: 46, class: 'fx-tree' })); });
    } else if (r.id === 'FX3') {
      out.push(s('rect', { x: 0, y: 150, width: 140, height: 10, class: 'fx-field' }));
      [184, 204, 224, 244, 264, 284].forEach(function (x, k) { out.push(P.person(x, k % 2 ? 0.72 : 0.8)); });
    } else if (r.id === 'FX4') {
      var id = 'fx-ah'; out.push(P.arrowDefs(id), P.helicopter(272, 54), s('line', { x1: 240, y1: 56, x2: 196, y2: 56, class: 'dg-path', 'marker-end': 'url(#' + id + ')' }));
    } else if (r.id === 'FX5') {
      out.push(P.person(150, 1, { controller: true }), s('rect', { x: 144, y: 99, width: 16, height: 7, rx: 2, class: 'fx-goggles' }), P.drone(70, 46, 1.1));
    } else if (r.id === 'FX6') {
      out.push(s('path', { d: 'M118 30 H282 V78 H246 V160 H154 V78 H118 Z', class: 'dg-zone' }), s('rect', { x: 168, y: 154, width: 64, height: 6, class: 'dg-runway' }), P.drone(70, 110, 1));
    } else if (r.id === 'FX7') {
      out = [s('rect', { x: 0, y: 0, width: 320, height: 180, class: 'dg-room' }),
        s('rect', { x: 100, y: 120, width: 120, height: 30, rx: 4, class: 'fx-scale' }), s('rect', { x: 136, y: 128, width: 48, height: 16, rx: 2, class: 'dg-screen' }),
        P.label(160, 141, '2 lb', 'middle', 'dg-strong'), P.drone(160, 112, 1.8)];
    } else if (r.id === 'FX8') {
      out = [s('rect', { x: 0, y: 0, width: 320, height: 160, class: 'fx-night' }), s('rect', { x: 0, y: 160, width: 320, height: 20, class: 'fx-night-ground' }),
        s('circle', { cx: 260, cy: 36, r: 14, class: 'fx-moon' }), s('g', { class: 'fx-dark' }, [P.drone(150, 80, 1.3)]), P.person(70, 1, { controller: true })];
    }
    return out;
  }

  // ---------- saved results ----------
  function readSave() {
    try { var o = JSON.parse(window.localStorage.getItem(KEY) || 'null'); if (o && o.best === +o.best && o.plays === +o.plays && o.best >= 0 && o.best <= ROUNDS.length) return { best: o.best, of: ROUNDS.length, plays: o.plays }; } catch (e) { /* ignore */ }
    return { best: 0, of: ROUNDS.length, plays: 0 };
  }
  function writeSave(v) { try { window.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } }

  // Chrome can drop the click of a tap that comes right after a touch-action:none drag (seen in testing),
  // so game buttons act on a touch pointerup that starts and ends on them. The tap's own late click is then
  // swallowed for a moment, so it cannot land on whatever the next screen puts under the finger.
  // Keyboard clicks (Enter/Space, detail 0) are never swallowed.
  var swallowUntil = 0;
  document.addEventListener('click', function (e) {
    if (e.detail > 0 && Date.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  function onTap(btn, fn) {
    var downOn = false;
    btn.addEventListener('pointerdown', function (e) { downOn = e.pointerType === 'touch'; if (downOn) e.preventDefault(); });
    btn.addEventListener('pointerleave', function () { downOn = false; });
    btn.addEventListener('pointercancel', function () { downOn = false; });
    btn.addEventListener('pointerup', function (e) {
      if (!downOn || e.pointerType !== 'touch' || btn.disabled || btn.hidden) { downOn = false; return; }
      downOn = false; swallowUntil = Date.now() + 700; fn();
    });
    btn.addEventListener('click', function () { fn(); });
  }

  var game = {
    title: 'Fix it',
    ROUNDS: ROUNDS, KEY: KEY, readSave: readSave,
    start: function (box, api) {
      var h = api.h, P = window.TP_SLIDES.parts, s = P.s;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var order = [], i = 0, firstRight = 0, tries = 0, done = false, pos = null, moved = false, pick = null, dragOn = false;
      var prog = h('p', { class: 'small', id: 'fx-prog' });
      var prompt = h('p', { class: 'fx-prompt', id: 'fx-prompt' });
      var stage = h('div', { class: 'fx-stage', id: 'fx-stage' });
      var where = h('p', { class: 'meter', id: 'fx-where', 'aria-live': 'polite' });
      var pad = h('div', { class: 'fx-pad', id: 'fx-pad', role: 'group', 'aria-label': 'Move' });
      var dirs = [['up', '▲', 'Move up', 0, -1], ['left', '◀', 'Move left', -1, 0], ['right', '▶', 'Move right', 1, 0], ['down', '▼', 'Move down', 0, 1]];
      var dirBtn = {};
      dirs.forEach(function (d) { dirBtn[d[0]] = h('button', { type: 'button', class: 'btn alt', id: 'fx-' + d[0], 'aria-label': d[2], text: d[1] }); onTap(dirBtn[d[0]], function () { nudge(d[3], d[4]); }); pad.appendChild(dirBtn[d[0]]); });
      var opts = h('div', { class: 'calls fx-opts', id: 'fx-opts', role: 'radiogroup', 'aria-labelledby': 'fx-prompt' });
      var checkBtn = h('button', { type: 'button', class: 'btn', id: 'fx-check', text: 'Check' }); onTap(checkBtn, checkIt);
      var nextBtn = h('button', { type: 'button', class: 'btn', id: 'fx-next', hidden: true }); onTap(nextBtn, nextRound);
      var fb = h('p', { class: 'status fx-fb', id: 'fx-msg', role: 'status', 'aria-live': 'polite' });
      var play = h('div', { class: 'card fx-card', id: 'fx-play' }, [prog, prompt, stage, where, pad, opts, h('div', { class: 'row fx-act' }, [checkBtn, nextBtn]), fb]);
      box.appendChild(h('p', { text: 'Each scene has one thing wrong. Fix it, then press Check. Drag the drone, use the arrow buttons or arrow keys, or pick a fix.' }));
      box.appendChild(play);
      var facts = []; ROUNDS.forEach(function (r) { facts = facts.concat(r.f); });
      box.appendChild(api.sourcesBox(facts));
      var svgEl = null, mover = null;

      function shuffle(a) { for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; } return a; }
      function begin() { order = shuffle(ROUNDS.slice()); i = 0; firstRight = 0; show(); }
      function cur() { return order[i]; }
      function place() {
        var r = cur();
        if (r.what === 'observer') mover.setAttribute('transform', 'translate(' + (pos.x - 0) + ' 0)');
        else mover.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ')');
        where.textContent = r.where(pos);
        if (r.id === 'FX2') {
          var blocked = segHitsRect(EYE, pos, TREES);
          sight.setAttribute('x2', pos.x); sight.setAttribute('y2', pos.y); sight.setAttribute('class', blocked ? 'fx-sight-blocked' : 'dg-sight');
        }
      }
      var sight = null;
      function show() {
        var r = cur(); done = false; tries = 0; moved = false; pick = null;
        prog.textContent = 'Round ' + (i + 1) + ' of ' + order.length + ' · First-try fixes: ' + firstRight;
        prompt.textContent = r.prompt; fb.textContent = ''; fb.className = 'status fx-fb';
        nextBtn.hidden = true; checkBtn.hidden = false; checkBtn.disabled = false;
        stage.textContent = '';
        var tid = 'fx-t-' + r.id;
        svgEl = s('svg', { viewBox: '0 0 320 180', role: 'img', 'aria-labelledby': tid, class: 'dg fx-scene', id: 'fx-scene', 'data-round': r.id, focusable: 'false' },
          [s('title', { id: tid }, [r.alt])].concat(scene(r, P)));
        stage.setAttribute('data-round', r.id);
        if (r.type === 'move') {
          pos = { x: r.start.x, y: r.start.y };
          svgEl.appendChild(s('rect', { x: r.zone.x0, y: r.zone.y0, width: r.zone.x1 - r.zone.x0, height: r.zone.y1 - r.zone.y0, class: 'fx-zone', id: 'fx-zone' }));
          if (r.id === 'FX2') { sight = s('line', { x1: EYE.x, y1: EYE.y, x2: pos.x, y2: pos.y, class: 'fx-sight-blocked' }); svgEl.insertBefore(sight, svgEl.querySelector('.fx-trunk')); }
          mover = r.what === 'observer'
            ? s('g', { class: 'fx-mover', id: 'fx-mover' }, [s('rect', { x: -16, y: 92, width: 32, height: 70, class: 'fx-grab' }), P.person(0, 1, { eye: true })])
            : s('g', { class: 'fx-mover', id: 'fx-mover' }, [s('rect', { x: -24, y: -16, width: 48, height: 24, class: 'fx-grab' }), P.drone(0, 0, 1.2)]);
          svgEl.appendChild(mover);
          pad.hidden = false; opts.hidden = true; where.hidden = false;
          dirBtn.up.hidden = dirBtn.down.hidden = r.axis === 'x';
          dirBtn.left.hidden = dirBtn.right.hidden = r.axis === 'y';
          svgEl.setAttribute('tabindex', '0');
          svgEl.setAttribute('aria-describedby', 'fx-where');
          place();
        } else {
          pad.hidden = true; where.hidden = true; opts.hidden = false; opts.textContent = '';
          shuffle(r.opts.slice()).forEach(function (o) {
            var b = h('button', { type: 'button', class: 'btn', role: 'radio', 'aria-checked': 'false', 'data-ok': o.ok ? '1' : '0', text: o.t });
            onTap(b, function () { choose(b, o); });
            opts.appendChild(b);
          });
        }
        stage.appendChild(svgEl);
        setLabelNext();
        fit();
      }
      function setLabelNext() { nextBtn.textContent = i < order.length - 1 ? 'Next round' : 'See results'; }
      function clamp(p) {
        var b = cur().bounds;
        return { x: Math.max(b.x0, Math.min(b.x1, p.x)), y: Math.max(b.y0, Math.min(b.y1, p.y)) };
      }
      function nudge(dx, dy) {
        var r = cur(); if (done || r.type !== 'move') return;
        if (r.axis === 'x') dy = 0; if (r.axis === 'y') dx = 0;
        if (!dx && !dy) return;
        var np = clamp({ x: pos.x + dx * r.step, y: pos.y + dy * r.step });
        if (np.x !== pos.x || np.y !== pos.y) { pos = np; moved = true; place(); }
      }
      function choose(b, o) {
        if (done) return;
        pick = o;
        Array.prototype.forEach.call(opts.children, function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.classList.toggle('is-picked', x === b); });
      }
      function checkIt() {
        var r = cur(); if (done) return;
        tries++;
        var right, msg;
        if (r.type === 'move') {
          if (!moved) { right = false; msg = NOTHING; }
          else { right = r.ok(pos); msg = right ? r.right : r.wrong; }
        } else {
          if (!pick) { right = false; msg = NOTHING_PICK; }
          else { right = !!pick.ok; msg = right ? r.right : pick.why; }
        }
        fb.textContent = msg; fb.className = 'status fx-fb ' + (right ? 'right' : 'wrong');
        if (right) {
          if (tries === 1) firstRight++;
          done = true; checkBtn.hidden = true; nextBtn.hidden = false;
          prog.textContent = 'Round ' + (i + 1) + ' of ' + order.length + ' · First-try fixes: ' + firstRight;
          if (r.type === 'choice') Array.prototype.forEach.call(opts.children, function (x) { x.disabled = true; if (x.getAttribute('data-ok') === '1') x.classList.add('is-right'); });
          nextBtn.focus();
        }
        keepVisible(fb);
      }
      function nextRound() {
        if (!done) return;
        if (i < order.length - 1) { i++; show(); focusFirst(); return; }
        var sv = readSave(); sv.best = Math.max(sv.best, firstRight); sv.plays++; writeSave(sv);
        prog.textContent = ''; prompt.textContent = ''; stage.textContent = ''; pad.hidden = true; opts.hidden = true; where.hidden = true; where.textContent = '';
        stage.removeAttribute('data-round');
        nextBtn.hidden = true; checkBtn.hidden = true;
        fb.className = 'status fx-fb';
        fb.textContent = '';
        var fin = h('p', { class: 'score', id: 'fx-final', text: 'You fixed ' + firstRight + ' of ' + order.length + ' on the first try.' });
        var again = h('button', { type: 'button', class: 'btn', id: 'fx-again', text: 'Play again' }); onTap(again, function () { begin(); focusFirst(); });
        stage.appendChild(fin); stage.appendChild(again); again.focus();
      }
      function focusFirst() { var r = cur(); if (r.type === 'move') svgEl.focus(); else { var b = opts.querySelector('button'); if (b) b.focus(); } }
      // keep the scene, controls and feedback above the pinned bar
      function keepVisible(el) {
        var bar = document.getElementById('disclaimer-foot');
        var limit = (bar ? bar.getBoundingClientRect().top : window.innerHeight) - 6;
        var r = el.getBoundingClientRect();
        if (r.bottom > limit) window.scrollBy(0, r.bottom - limit);
      }
      function fit() {
        var bar = document.getElementById('disclaimer-foot');
        var limit = (bar ? bar.getBoundingClientRect().top : window.innerHeight) - 6;
        var top = prompt.getBoundingClientRect().top, bottom = checkBtn.getBoundingClientRect().bottom;
        if (bottom > limit) window.scrollBy(0, Math.min(bottom - limit, top - 6));
        else if (top < 0) window.scrollBy(0, top - 6);
      }
      // drag (mouse, pen, touch). A drag only counts if it starts on the thing you move.
      function toScene(e) {
        var m = svgEl.getScreenCTM(); if (!m) return null;
        var pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        return pt.matrixTransform(m.inverse());
      }
      var grabOff = null;
      function onDown(e) {
        var r = cur(); if (done || !r || r.type !== 'move' || !mover || !mover.contains(e.target)) return;
        var p = toScene(e); if (!p) return;
        grabOff = { x: pos.x - p.x, y: pos.y - p.y }; dragOn = true;
        try { svgEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
      }
      function onMove(e) {
        if (!dragOn) return; var p = toScene(e); if (!p) return;
        var r = cur(); var np = clamp({ x: r.axis === 'y' ? pos.x : p.x + grabOff.x, y: r.axis === 'x' ? pos.y : p.y + grabOff.y });
        if (np.x !== pos.x || np.y !== pos.y) { pos = np; moved = true; place(); }
        e.preventDefault();
      }
      function onUp() { dragOn = false; }
      stage.addEventListener('pointerdown', onDown);
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerup', onUp);
      stage.addEventListener('pointercancel', onUp);
      function kd(e) {
        var t = e.target && e.target.tagName;
        if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA' || e.altKey || e.ctrlKey || e.metaKey) return;
        var inGame = play.contains(e.target);
        if (!inGame) return;
        var r = cur(); if (!r || done) return;
        var map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        if (r.type === 'move' && map[e.key] && (e.target === svgEl || pad.contains(e.target))) { e.preventDefault(); nudge(map[e.key][0], map[e.key][1]); }
      }
      document.addEventListener('keydown', kd);
      begin();
      return function stop() { document.removeEventListener('keydown', kd); };
    }
  };
  if (!window.TP_GAMES) window.TP_GAMES = {};
  window.TP_GAMES.fixit = game;
})();
