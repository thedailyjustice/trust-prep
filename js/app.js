/* TRUST Prep app shell: routing, saved progress (this device only), lessons, checks, quiz. */
(function () {
  'use strict';
  var C = window.TP_CONTENT;
  var KEY = 'trustprep-v1';
  var PREFIX = 'trustprep-';

  // ---------- storage ----------
  function blank() {
    return { v: 1, nick: '', mods: {}, quiz: false, quizFirst: null, games: { hover: { best: 0, wins: 0 }, path: { done: [] }, vo: { best: 0, plays: 0 } } };
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
      b.quizFirst = firstOk(s.quizFirst) ? { r: s.quizFirst.r, of: s.quizFirst.of } : null;
      Object.keys(b.mods).forEach(function (k) { var m = b.mods[k]; if (!m || typeof m !== 'object') { delete b.mods[k]; return; } if (m.first !== undefined && !firstOk(m.first)) delete m.first; });
      if (s.games) {
        if (s.games.hover) b.games.hover = { best: +s.games.hover.best || 0, wins: +s.games.hover.wins || 0 };
        if (s.games.path && Array.isArray(s.games.path.done)) b.games.path.done = s.games.path.done.slice(0, 10);
        if (s.games.vo) b.games.vo = { best: +s.games.vo.best || 0, plays: +s.games.vo.plays || 0 };
      }
      return b;
    } catch (e) { return blank(); }
  }
  function firstOk(f) { return !!(f && typeof f === 'object' && f.r === +f.r && f.of === +f.of && f.r >= 0 && f.r <= f.of && f.of > 0 && f.of <= 50); }
  function firstText(f) { return 'First try: ' + f.r + ' of ' + f.of; }
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

  // Lesson line with tap-to-see word help. The reviewed line text is shown unchanged; a term
  // becomes a button, and its plain-English note appears in parentheses right after it.
  var glossN = 0;
  function hasGloss(m) { return m.lesson.some(function (l) { return C.GLOSS.some(function (g) { return g.line === l[0]; }); }); }
  var openGloss = []; // [btn, note, def] most recent last, so Esc anywhere closes the latest one
  function setGloss(btn, note, def, open) {
    note.textContent = open ? def : '';
    note.setAttribute('data-open', open ? '1' : '0');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { btn.setAttribute('aria-describedby', note.id); openGloss.push([btn, note, def]); keepClearOfBar(note); }
    else { btn.removeAttribute('aria-describedby'); openGloss = openGloss.filter(function (x) { return x[0] !== btn; }); }
  }
  // If an opened note lands under the pinned bar (or off the top), scroll just enough to show it.
  function keepClearOfBar(el) {
    var bar = document.getElementById('disclaimer-foot');
    var limit = bar ? bar.getBoundingClientRect().top : window.innerHeight;
    var rs = el.getClientRects(); if (!rs.length) return;
    var top = rs[0].top, bot = rs[rs.length - 1].bottom;
    if (bot > limit - 4) window.scrollBy(0, Math.min(top - 8, bot - limit + 8));
    else if (top < 0) window.scrollBy(0, top - 8);
  }
  document.addEventListener('keydown', function (e) {
    if ((e.key !== 'Escape' && e.key !== 'Esc') || !openGloss.length) return;
    var x = openGloss[openGloss.length - 1];
    if (!document.body.contains(x[0])) { openGloss = []; return; }
    setGloss(x[0], x[1], x[2], false); x[0].focus();
  });

  function lessonLine(l) {
    var li = h('li', { 'data-line': l[0] });
    var text = l[1], pos = 0;
    var gs = C.GLOSS.filter(function (g) { return g.line === l[0]; })
      .map(function (g) { return { g: g, at: text.indexOf(g.w) }; })
      .filter(function (x) { return x.at >= 0; })
      .sort(function (a, b) { return a.at - b.at; });
    gs.forEach(function (x) {
      if (x.at < pos) return;
      li.appendChild(document.createTextNode(text.slice(pos, x.at)));
      var id = 'gl-' + (++glossN);
      // The note is a polite live region that is empty while closed, so opening it is announced and
      // the reviewed line reads exactly as written until a student taps the word.
      var note = h('span', { class: 'gloss', id: id, 'data-gloss': x.g.id, 'aria-live': 'polite', 'data-open': '0' });
      var btn = h('button', { type: 'button', class: 'term', 'aria-expanded': 'false', 'aria-controls': id, 'data-term': x.g.id, text: x.g.w });
      var def = ' (' + x.g.d + ')';
      btn.addEventListener('click', function () { setGloss(btn, note, def, note.getAttribute('data-open') !== '1'); });
      btn.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === 'Esc') && note.getAttribute('data-open') === '1') { e.preventDefault(); e.stopPropagation(); setGloss(btn, note, def, false); btn.focus(); } });
      li.appendChild(btn); li.appendChild(note);
      pos = x.at + x.g.w.length;
    });
    li.appendChild(document.createTextNode(text.slice(pos)));
    return li;
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
    var first = {}; // item id -> was the first answer picked for it right?
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
    if (opts.alreadyDone) status.textContent = 'You already reached 100% here' + (opts.savedFirst ? ' (' + firstText(opts.savedFirst).toLowerCase() + ', your first time through)' : '') + '. You can practice again any time.';

    wrap.addEventListener('submit', function (ev) {
      ev.preventDefault();
      tries++;
      var right = 0, firstBad = null, missing = 0;
      fields.forEach(function (f) {
        if (locked[f.it.id]) { right++; return; }
        var pick = f.fs.querySelector('input:checked');
        if (!pick) { missing++; f.fs.className = 'q'; f.fb.className = 'fb wrong'; f.fb.textContent = 'Pick an answer.'; if (!firstBad) firstBad = f; return; }
        if (!(f.it.id in first)) first[f.it.id] = +pick.value === f.it.a;
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
        var fr = { r: items.filter(function (it) { return first[it.id]; }).length, of: items.length };
        status.textContent = '100%! All ' + items.length + ' right. ' + firstText(fr) + '.' + (opts.doneMsg ? ' ' + opts.doneMsg : '');
        status.setAttribute('data-first', fr.r + '/' + fr.of);
        btn.disabled = true;
        opts.onDone(tries, fr);
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
      hasGloss(m) ? h('p', { class: 'small', id: 'gloss-hint', text: C.GLOSS_HINT }) : null,
      h('ul', null, m.lesson.map(function (l) { return lessonLine(l); }))
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
          id: 'm' + m.n, alreadyDone: modDone(m.n), savedFirst: state.mods[m.n] && state.mods[m.n].first, doneMsg: 'Module ' + m.n + ' is done.',
          onDone: function (tries, fr) {
            var prev = state.mods[m.n] || {};
            // The saved first-try score is from the first time through; practicing again does not change it.
            state.mods[m.n] = { done: true, tries: prev.tries ? Math.min(prev.tries, tries) : tries, first: firstOk(prev.first) ? prev.first : fr };
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
        id: 'quiz', alreadyDone: state.quiz, savedFirst: state.quizFirst, doneMsg: 'Quiz done.',
        onDone: function (tries, fr) { state.quiz = true; if (!state.quizFirst) state.quizFirst = fr; save(); }
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
      h('button', { type: 'button', class: 'btn alt', id: 'reset-cancel', text: 'Cancel', onclick: function () { confirmRow.hidden = true; document.getElementById('reset-btn').focus(); } })
    ]);
    var nickIn = h('input', { type: 'text', id: 'nick', maxlength: '20', autocomplete: 'off', spellcheck: 'false', value: state.nick, 'aria-describedby': 'nick-help nick-warn' });
    var nickMsg = h('p', { class: 'status', role: 'status', 'aria-live': 'polite', id: 'nick-msg' });
    var nickWarn = h('p', { class: 'warn', id: 'nick-warn', 'aria-live': 'polite', hidden: true, text: 'That looks like a real name. Please use a nickname.' });
    function cleanNick(v) { return v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20); }
    function checkNick() {
      nickWarn.hidden = !looksLikeName(nickIn.value);
      if (cleanNick(nickIn.value) !== state.nick) nickMsg.textContent = 'Not saved yet. Press Enter or Save nickname.';
      else if (/^Not saved/.test(nickMsg.textContent)) nickMsg.textContent = '';
    }
    function saveNick() {
      var v = cleanNick(nickIn.value);
      if (v === state.nick && !/^Not saved/.test(nickMsg.textContent)) return;
      state.nick = v; save(); nickMsg.textContent = state.nick ? 'Saved.' : 'Nickname cleared.';
      nickWarn.hidden = !looksLikeName(nickIn.value);
    }
    nickIn.addEventListener('input', checkNick);
    nickIn.addEventListener('blur', saveNick);
    nickIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveNick(); } });
    if (state.nick) nickWarn.hidden = !looksLikeName(state.nick);
    return [
      heading('Your progress'),
      allDone() ? h('section', { class: 'card complete', id: 'practice-complete' }, [
        h('h2', { text: 'Practice complete' }),
        h('p', { text: 'You reached 100% on all ' + C.MODULES.length + ' module checks and the mixed quiz. This is practice only. Your next step is to take TRUST itself with a test administrator.' }),
        taLink()
      ]) : null,
      h('section', { class: 'card' }, [
        h('p', { class: 'score', text: doneCount() + ' of ' + C.MODULES.length + ' module checks at 100%' }),
        h('p', { text: 'Mixed quiz: ' + (state.quiz ? '100%' + (state.quizFirst ? ' · ' + firstText(state.quizFirst) : '') : 'not done yet'), id: 'quiz-first' }),
        h('details', { class: 'firsts', id: 'first-tries' }, [
          h('summary', { text: 'First-try scores by module' }),
          h('p', { class: 'small', text: 'How many questions you got right on your first pick, the first time you finished each check.' }),
          h('ul', null, C.MODULES.map(function (m) { var s = state.mods[m.n]; return h('li', { 'data-first-mod': String(m.n), text: 'Module ' + m.n + ': ' + (s && s.done ? (s.first ? firstText(s.first) : '100% (first try not recorded)') : 'not done yet') }); }))
        ]),
        h('p', { text: 'Hover hold best: ' + state.games.hover.best + '% · Airspace maps solved: ' + state.games.path.done.length + ' of ' + C.PATH_LEVELS.length + ' · Observer calls best: ' + state.games.vo.best + ' of ' + C.VO_SCENES.length })
      ]),
      h('section', { class: 'card' }, [
        h('h2', { text: 'Nickname (optional)' }),
        h('label', { class: 'field', for: 'nick', text: 'Nickname' }),
        nickIn,
        h('p', { class: 'small', id: 'nick-help', text: 'Use a nickname, not your real name. It stays on this device only. You can leave it blank.' }),
        nickWarn,
        h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn alt', id: 'nick-save', text: 'Save nickname', onclick: function () { nickMsg.textContent = 'Not saved yet.'; saveNick(); } })]),
        nickMsg
      ]),
      h('section', { class: 'card' }, [
        h('h2', { text: 'Sharing a device?' }),
        h('p', { text: 'Progress is saved only in this browser on this device. Nothing is sent anywhere. Press Reset when you are done so the next student starts fresh.' }),
        h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn danger', id: 'reset-btn', text: 'Reset progress', onclick: function () { confirmRow.hidden = false; document.getElementById('reset-cancel').focus(); } })]),
        confirmRow,
        h('p', { class: 'status', id: 'reset-msg', role: 'status', 'aria-live': 'polite' })
      ]),
      h('section', { class: 'card' }, [
        h('h2', { text: 'About this app' }),
        h('p', { text: 'TRUST Prep is a classroom practice tool for a 7th grade STEM class. It is not TRUST, it is not made by the FAA, and it does not give out certificates. Practice questions are original. Facts were checked against FAA pages on ' + C.CHECKED + '.' })
      ])
    ];
  }

  // Two or more capitalized words in a row ("Ava Johnson") look like a real first and last name.
  function looksLikeName(v) { return /(^|\s)[A-Z][a-z'\-]+\s+[A-Z][a-z'\-]+/.test(String(v || '')); }

  // The disclaimer bar is pinned to the bottom. Pad the page by its real height so it never covers
  // the last line or a button, and keep focused controls clear of it.
  function padForBar() {
    var bar = document.getElementById('disclaimer-foot');
    if (!bar) return;
    var ht = Math.ceil(bar.getBoundingClientRect().height);
    document.body.style.paddingBottom = ht + 'px';
    document.documentElement.style.scrollPaddingBottom = (ht + 8) + 'px';
    document.body.setAttribute('data-bar-h', String(ht));
  }
  window.addEventListener('resize', padForBar);
  if (window.ResizeObserver) document.addEventListener('DOMContentLoaded', function () { var b = document.getElementById('disclaimer-foot'); if (b) new ResizeObserver(padForBar).observe(b); });

  function notFound() {
    setTitle('Not found');
    return [heading('Page not found'), h('p', null, [h('a', { href: '#home', text: 'Go to lessons' })])];
  }

  function render() {
    openGloss = [];
    // Let a focused field finish (e.g. the nickname saves on blur) before the old view is replaced.
    var ae = document.activeElement; if (ae && ae !== document.body && view.contains(ae) && ae.blur) ae.blur();
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
  document.addEventListener('DOMContentLoaded', function () { padForBar(); render(); });
  window.TP_APP.looksLikeName = looksLikeName;
})();
