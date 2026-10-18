/* TRUST Prep app shell: routing, saved progress (this device only), lessons, checks, quiz. */
(function () {
  'use strict';
  var C = window.TP_CONTENT;
  var KEY = 'trustprep-v1';
  var PREFIX = 'trustprep-';

  // ---------- storage ----------
  function blank() {
    return { v: 1, nick: '', mods: {}, quiz: false, games: { hover: { best: 0, wins: 0 }, path: { done: [] }, vo: { best: 0, plays: 0 } } };
  }
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      var b = blank();
      if (!s || typeof s !== 'object') return b;
      b.nick = typeof s.nick === 'string' ? s.nick.slice(0, 20) : '';
      b.mods = s.mods && typeof s.mods === 'object' ? s.mods : {};
      b.quiz = !!s.quiz;
      if (s.games) {
        if (s.games.hover) b.games.hover = { best: +s.games.hover.best || 0, wins: +s.games.hover.wins || 0 };
        if (s.games.path && Array.isArray(s.games.path.done)) b.games.path.done = s.games.path.done.slice(0, 10);
        if (s.games.vo) b.games.vo = { best: +s.games.vo.best || 0, plays: +s.games.vo.plays || 0 };
      }
      return b;
    } catch (e) { return blank(); }
  }
  var state = load();
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked: keep going */ }
  }
  function resetAll() {
    try {
      var ks = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) ks.push(k);
      }
      ks.forEach(function (k) { window.localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
    state = blank();
  }

  // ---------- tiny DOM helper ----------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function extLink(href, text) {
    return h('a', { href: href, target: '_blank', rel: 'noopener noreferrer', referrerpolicy: 'no-referrer', text: text });
  }
  function taLink() {
    return h('p', null, ['Ready for the real thing? See the ', extLink(C.TA_LIST_URL, 'FAA\'s list of TRUST test administrators'), '. (Opens the FAA website.)']);
  }
  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function sourcesFor(factIds) {
    var seen = {}, out = [];
    factIds.forEach(function (f) { (C.FACTS[f] || []).forEach(function (s) { if (!seen[s]) { seen[s] = 1; out.push(s); } }); });
    return out;
  }
  function sourcesBox(factIds) {
    var list = sourcesFor(factIds);
    return h('details', { class: 'srcs card' }, [
      h('summary', { text: 'Where these facts come from (checked ' + C.CHECKED + ')' }),
      h('ul', null, list.map(function (s) { return h('li', null, [C.SRC[s][0] + ': ', extLink(C.SRC[s][1], C.SRC[s][1])]); }))
    ]);
  }

  function modDone(n) { return !!(state.mods[n] && state.mods[n].done); }
  function doneCount() { return C.MODULES.filter(function (m) { return modDone(m.n); }).length; }
  function allDone() { return doneCount() === C.MODULES.length && state.quiz; }

  // ---------- check / quiz component ----------
  // Students answer, press Check, and fix wrong answers until every item is right (100%).
  function checkSet(items, opts) {
    var locked = {};
    var wrap = h('form', { class: 'check', novalidate: true, 'aria-describedby': opts.id + '-status' });
    var status = h('p', { class: 'status score', id: opts.id + '-status', role: 'status', 'aria-live': 'polite' });
    var tries = 0;
    var fields = items.map(function (it, idx) {
      var order = shuffle(it.o.map(function (_, i) { return i; }));
      var fb = h('p', { class: 'fb', 'aria-live': 'polite' });
      var fs = h('fieldset', { class: 'q', 'data-item': it.id }, [
        h('legend', { text: (idx + 1) + '. ' + it.q })
      ].concat(order.map(function (oi) {
        var id = opts.id + '-' + it.id + '-' + oi;
        return h('label', { class: 'opt', for: id }, [
          h('input', { type: 'radio', name: opts.id + '-' + it.id, id: id, value: String(oi), 'data-correct': oi === it.a ? '1' : null }),
          h('span', { text: it.o[oi] })
        ]);
      })).concat([fb]));
      return { it: it, fs: fs, fb: fb };
    });
    fields.forEach(function (f) { wrap.appendChild(f.fs); });
    var btn = h('button', { type: 'submit', class: 'btn', text: 'Check answers' });
    wrap.appendChild(h('div', { class: 'row' }, [btn]));
    wrap.appendChild(status);
    if (opts.alreadyDone) status.textContent = 'You already reached 100% here. You can practice again any time.';

    wrap.addEventListener('submit', function (ev) {
      ev.preventDefault();
      tries++;
      var right = 0, firstBad = null, missing = 0;
      fields.forEach(function (f) {
        if (locked[f.it.id]) { right++; return; }
        var pick = f.fs.querySelector('input:checked');
        if (!pick) { missing++; f.fs.className = 'q'; f.fb.className = 'fb wrong'; f.fb.textContent = 'Pick an answer.'; if (!firstBad) firstBad = f; return; }
        if (+pick.value === f.it.a) {
          locked[f.it.id] = true; right++;
          f.fs.className = 'q right';
          f.fb.className = 'fb right';
          f.fb.textContent = 'Correct. ' + f.it.e;
          f.fs.querySelectorAll('input').forEach(function (i) { i.disabled = true; });
        } else {
          f.fs.className = 'q wrong';
          f.fb.className = 'fb wrong';
          f.fb.textContent = 'Not quite. Read the question again and pick another answer.';
          pick.checked = false;
          if (!firstBad) firstBad = f;
        }
      });
      var pct = Math.round(100 * right / items.length);
      if (right === items.length) {
        status.textContent = '100%! All ' + items.length + ' right.' + (opts.doneMsg ? ' ' + opts.doneMsg : '');
        btn.disabled = true;
        opts.onDone(tries);
      } else {
        status.textContent = right + ' of ' + items.length + ' right (' + pct + '%). Fix the red ones and check again.' + (missing ? ' ' + missing + ' not answered yet.' : '');
        if (firstBad) { var inp = firstBad.fs.querySelector('input:not([disabled])'); if (inp) inp.focus(); }
      }
    });
    return wrap;
  }

  // ---------- views ----------
  var view = document.getElementById('view');
  var stopGame = null;

  function setTitle(t) { document.title = t + ' | TRUST Prep'; }
  function heading(t) { return h('h1', { tabindex: '-1', text: t }); }

  function homeView() {
    setTitle('Lessons');
    var hi = state.nick ? 'Hi, ' + state.nick + '!' : 'Drone safety practice';
    var list = h('ul', { class: 'grid' }, C.MODULES.map(function (m) {
      return h('li', null, [h('a', { class: 'tile', href: '#m/' + m.n, 'data-mod': String(m.n) }, [
        h('span', { class: 'num', text: 'Module ' + m.n }),
        h('span', { class: 'ttl', text: m.title }),
        h('span', { class: 'badge' + (modDone(m.n) ? ' done' : ''), text: modDone(m.n) ? 'Check: 100%' : 'Not done yet' })
      ])]);
    }));
    return [
      heading(hi),
      h('div', { class: 'card' }, [
        h('p', { text: 'TRUST is the free FAA safety test you must pass before you fly a drone for fun. This app helps you get ready. Read each short lesson, then do the check. You can fix answers until you get 100%, just like on TRUST.' }),
        h('p', { class: 'score', text: doneCount() + ' of ' + C.MODULES.length + ' modules done' + (state.quiz ? ' · Quiz: 100%' : '') }),
        allDone() ? h('p', null, [h('strong', { text: 'Practice complete. ' }), h('a', { href: '#progress', text: 'See your progress' })]) : null
      ]),
      h('h2', { text: 'Modules' }),
      list,
      h('h2', { text: 'More practice' }),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn', href: '#quiz', text: 'Mixed practice quiz' }),
        h('a', { class: 'btn alt', href: '#games', text: 'Games' })
      ]),
      taLink()
    ];
  }

  function moduleView(n) {
    var m = C.MODULES.filter(function (x) { return x.n === n; })[0];
    if (!m) return notFound();
    setTitle('Module ' + m.n + ': ' + m.title);
    var lesson = h('section', { class: 'card lesson', 'aria-labelledby': 'les-h' }, [
      h('h2', { id: 'les-h', text: 'Lesson' }),
      h('ul', null, m.lesson.map(function (l) { return h('li', { 'data-line': l[0], text: l[1] }); }))
    ]);
    var next = C.MODULES.filter(function (x) { return x.n === n + 1; })[0];
    var nextRow = h('div', { class: 'row' }, [
      n > 1 ? h('a', { class: 'btn alt', href: '#m/' + (n - 1), text: '← Module ' + (n - 1) }) : null,
      next ? h('a', { class: 'btn alt', href: '#m/' + next.n, text: 'Module ' + next.n + ' →' }) : h('a', { class: 'btn alt', href: '#quiz', text: 'Mixed quiz →' })
    ]);
    var facts = [];
    m.lesson.forEach(function (l) { facts = facts.concat(l[2]); });
    m.check.forEach(function (i) { facts = facts.concat(i.f); });
    return [
      h('p', { class: 'small', text: 'Module ' + m.n + ' of ' + C.MODULES.length }),
      heading(m.title),
      lesson,
      m.n === 11 ? taLink() : null,
      h('section', { class: 'card', 'aria-labelledby': 'chk-h' }, [
        h('h2', { id: 'chk-h', text: 'Check: get to 100%' }),
        checkSet(m.check, {
          id: 'm' + m.n, alreadyDone: modDone(m.n), doneMsg: 'Module ' + m.n + ' is done.',
          onDone: function (tries) {
            var prev = state.mods[m.n] || {};
            state.mods[m.n] = { done: true, tries: prev.tries ? Math.min(prev.tries, tries) : tries };
            save();
          }
        })
      ]),
      nextRow,
      sourcesBox(facts)
    ];
  }

  function quizView() {
    setTitle('Mixed practice quiz');
    var facts = [];
    C.QUIZ.forEach(function (i) { facts = facts.concat(i.f); });
    return [
      heading('Mixed practice quiz'),
      h('p', { text: C.QUIZ.length + ' questions from all modules, in a new order each time. Fix answers until you reach 100%.' }),
      h('section', { class: 'card' }, [checkSet(shuffle(C.QUIZ), {
        id: 'quiz', alreadyDone: state.quiz, doneMsg: 'Quiz done.',
        onDone: function () { state.quiz = true; save(); }
      })]),
      sourcesBox(facts)
    ];
  }

  function gamesView() {
    setTitle('Games');
    var g = state.games;
    return [
      heading('Games'),
      h('ul', { class: 'grid' }, [
        h('li', null, [h('a', { class: 'tile', href: '#game/hover' }, [h('span', { class: 'ttl', text: 'Hover hold' }), h('span', { text: 'Keep the drone steady inside the green band. Arrow keys or touch buttons.' }), h('span', { class: 'badge' + (g.hover.wins ? ' done' : ''), text: 'Best: ' + g.hover.best + '% in band' })])]),
        h('li', null, [h('a', { class: 'tile', href: '#game/path' }, [h('span', { class: 'ttl', text: 'Airspace path' }), h('span', { text: 'Plan a route around airports, TFRs, and stadiums at 400 feet or lower.' }), h('span', { class: 'badge' + (g.path.done.length ? ' done' : ''), text: g.path.done.length + ' of ' + C.PATH_LEVELS.length + ' maps solved' })])]),
        h('li', null, [h('a', { class: 'tile', href: '#game/vo' }, [h('span', { class: 'ttl', text: 'Visual observer calls' }), h('span', { text: 'You are the observer. Spot the hazard and make the right call.' }), h('span', { class: 'badge' + (g.vo.best === C.VO_SCENES.length ? ' done' : ''), text: 'Best: ' + g.vo.best + ' of ' + C.VO_SCENES.length })])])
      ])
    ];
  }

  function gameView(name) {
    var G = window.TP_GAMES && window.TP_GAMES[name];
    if (!G) return notFound();
    setTitle(G.title);
    var box = h('div', { class: 'game', id: 'game-' + name });
    var api = {
      h: h, C: C, state: function () { return state; }, save: save, sourcesBox: sourcesBox
    };
    setTimeout(function () { stopGame = G.start(box, api); }, 0);
    return [heading(G.title), h('p', null, [h('a', { href: '#games', text: '← All games' })]), box];
  }

  function progressView() {
    setTitle('Progress');
    var confirmRow = h('div', { class: 'row', hidden: true, id: 'reset-confirm' }, [
      h('span', { text: 'Erase all progress on this device?' }),
      h('button', { type: 'button', class: 'btn danger', id: 'reset-yes', text: 'Yes, erase it', onclick: function () { resetAll(); render(); var s = document.getElementById('reset-msg'); if (s) s.textContent = 'Progress erased.'; } }),
      h('button', { type: 'button', class: 'btn alt', text: 'Cancel', onclick: function () { confirmRow.hidden = true; document.getElementById('reset-btn').focus(); } })
    ]);
    var nickIn = h('input', { type: 'text', id: 'nick', maxlength: '20', autocomplete: 'off', spellcheck: 'false', value: state.nick, 'aria-describedby': 'nick-help' });
    var nickMsg = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
    return [
      heading('Your progress'),
      allDone() ? h('section', { class: 'card complete', id: 'practice-complete' }, [
        h('h2', { text: 'Practice complete' }),
        h('p', { text: 'You reached 100% on all ' + C.MODULES.length + ' module checks and the mixed quiz. This is practice only. Your next step is to take TRUST itself with a test administrator.' }),
        taLink()
      ]) : null,
      h('section', { class: 'card' }, [
        h('p', { class: 'score', text: doneCount() + ' of ' + C.MODULES.length + ' module checks at 100%' }),
        h('p', { text: 'Mixed quiz: ' + (state.quiz ? '100%' : 'not done yet') }),
        h('p', { text: 'Hover hold best: ' + state.games.hover.best + '% · Airspace maps solved: ' + state.games.path.done.length + ' of ' + C.PATH_LEVELS.length + ' · Observer calls best: ' + state.games.vo.best + ' of ' + C.VO_SCENES.length })
      ]),
      h('section', { class: 'card' }, [
        h('h2', { text: 'Nickname (optional)' }),
        h('label', { class: 'field', for: 'nick', text: 'Nickname' }),
        nickIn,
        h('p', { class: 'small', id: 'nick-help', text: 'Use a fun nickname, not your real name. It stays on this device only. You can leave it blank.' }),
        h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn alt', id: 'nick-save', text: 'Save nickname', onclick: function () {
          state.nick = nickIn.value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20); save(); nickMsg.textContent = state.nick ? 'Saved.' : 'Nickname cleared.';
        } })]),
        nickMsg
      ]),
      h('section', { class: 'card' }, [
        h('h2', { text: 'Sharing a device?' }),
        h('p', { text: 'Progress is saved only in this browser on this device. Nothing is sent anywhere. Press Reset when you are done so the next student starts fresh.' }),
        h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn danger', id: 'reset-btn', text: 'Reset progress', onclick: function () { confirmRow.hidden = false; document.getElementById('reset-yes').focus(); } })]),
        confirmRow,
        h('p', { class: 'status', id: 'reset-msg', role: 'status', 'aria-live': 'polite' })
      ]),
      h('section', { class: 'card' }, [
        h('h2', { text: 'About this app' }),
        h('p', { text: 'TRUST Prep is a classroom practice tool for 7th grade STEM at Riverdale K-8. It is not TRUST, it is not made by the FAA, and it does not give out certificates. Practice questions are original. Facts were checked against FAA pages on ' + C.CHECKED + '.' })
      ])
    ];
  }

  function notFound() {
    setTitle('Not found');
    return [heading('Page not found'), h('p', null, [h('a', { href: '#home', text: 'Go to lessons' })])];
  }

  function render() {
    if (stopGame) { try { stopGame(); } catch (e) { /* ignore */ } stopGame = null; }
    var hash = (location.hash || '#home').slice(1);
    var parts = hash.split('/');
    var nodes;
    if (parts[0] === 'home' || parts[0] === '') nodes = homeView();
    else if (parts[0] === 'm') nodes = moduleView(parseInt(parts[1], 10));
    else if (parts[0] === 'quiz') nodes = quizView();
    else if (parts[0] === 'games') nodes = gamesView();
    else if (parts[0] === 'game') nodes = gameView(parts[1]);
    else if (parts[0] === 'progress') nodes = progressView();
    else nodes = notFound();
    view.textContent = '';
    nodes.forEach(function (n) { if (n) view.appendChild(n); });
    var navKey = parts[0] === 'm' || parts[0] === '' ? 'home' : (parts[0] === 'game' ? 'games' : parts[0]);
    document.querySelectorAll('nav a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var h1 = view.querySelector('h1');
    if (h1 && render.moved) h1.focus();
    render.moved = true;
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  window.TP_APP = { render: render, h: h };
  document.addEventListener('DOMContentLoaded', render);
})();
