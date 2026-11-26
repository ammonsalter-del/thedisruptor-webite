/*
    The Disruptor - Vélox Dynamics: competitive play (disruptor-shim.js)
    Created by Ammon Salter, Warwick Business School, University of Warwick
    Software (source code): licensed under the PolyForm Noncommercial License 1.0.0
    https://polyformproject.org/licenses/noncommercial/1.0.0
    Educational content (the text shown to players): licensed under
    Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
    https://creativecommons.org/licenses/by-nc-sa/4.0/
    Required Notice: Copyright 2026 Ammon Salter (https://disruptorsim.org)
*/


























(function () {
  'use strict';
  if (window.__dzShim) return;                       // loaded twice: the second copy does nothing
  window.__dzShim = { version: '2026-11-17' };


  var CONFIG = {


    url: 'https://wwihfojqrrizmwelamvf.supabase.co',
    key: 'sb_publishable_8doMY-Me4JZ5OcBrjEgMgA_kHWEjXiu',                // publishable key: public by design, it can only call the functions

    nicknames: 'generated',

    page: 'https://disruptorsim.org/classroom.html',
    // The game's own assessment (being built in GAME ASSESSMENT BUILD 16-11): the key on G it is kept under. Read only if present.
    assessmentKey: 'gameAssessment',


    compareScore: true,

    sayPractice: true,


    cardPlace: 'beforeReport',
    wait: 8000,                                      // ms before any request is given up
    codeWait: 5000                                   // ms the question waits for a class code to be checked, then carries on
  };



  function secretKey(k) { try { if (/^sb_secret_/.test(k)) return true; var p = String(k).split('.'); return p.length === 3 && /service_role/.test(atob(p[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return false; } }
  var LIVE = !/PROJECTREF/.test(CONFIG.url) && !/REPLACE_ME/.test(CONFIG.key) && !secretKey(CONFIG.key);

  // ================================================================ small helpers
  function game() { try { return (typeof G !== 'undefined' && G) ? G : null; } catch (e) { return null; } }
  function isForgeRun(g) { return !!g && (g.gameMode || 'builder') === 'builder' && !g.incubatorMode && g.durationChoice !== 'probation'; }
  function taking(g) { return LIVE && isForgeRun(g) && !!g.competePlay && g.competePlay.v === 1; }
  function can() { try { return typeof fetch === 'function' && typeof AbortController === 'function' && !!(window.crypto && crypto.subtle) && typeof TextEncoder === 'function'; } catch (e) { return false; } }
  function num(x, d) { x = Number(x); var p = Math.pow(10, d || 0); return isFinite(x) ? Math.round(x * p) / p : 0; }
  function numOrNull(x, d) { return (typeof x === 'number' && isFinite(x)) ? num(x, d) : null; }
  function count(a) { return Array.isArray(a) ? a.length : 0; }
  function short(s) { return String(s == null ? '' : s).slice(0, 60); }
  function el(tag, css, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = String(text); return e; }   // text only: nothing from the database reaches innerHTML

  function rpc(name, body) {
    if (!LIVE || !can()) return Promise.resolve(null);
    try {
      var ctl = new AbortController(), t = setTimeout(function () { try { ctl.abort(); } catch (e) {} }, CONFIG.wait);
      return fetch(CONFIG.url + '/rest/v1/rpc/' + name, {
        method: 'POST', signal: ctl.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'apikey': CONFIG.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      }).then(function (r) { clearTimeout(t); return r.ok ? r.json().catch(function () { return null; }) : null; })
        .catch(function () { clearTimeout(t); return null; });                    // silent; not retried: the next send restates everything
    } catch (e) { return Promise.resolve(null); }
  }

  function runKey(g) {
    try {
      var s = 'dz-comp-v1:' + g.runStartTime + ':' + g.runNonce;
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
        return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function buildRef() {
    try { var m = document.querySelector('meta[name="build-ref"]'), v = m ? String(m.getAttribute('content') || '') : ''; return /^[a-z0-9-]{1,20}$/i.test(v) ? v.toLowerCase() : null; } catch (e) { return null; }
  }

  // Page errors seen during a compared run: a number only, never a message. Kept on G.competePlay so it travels with a save.
  function noteError() { try { var g = game(); if (taking(g)) g.competePlay.errors = Math.min(9999, (g.competePlay.errors || 0) + 1); } catch (e) {} }
  try { window.addEventListener('error', noteError); window.addEventListener('unhandledrejection', noteError); } catch (e) {}

  // ================================================================ the whitelist: what is sent for each year
  // Read from G.yearRecords[year], which the game's buildYearRecord writes (106366). Figures as columns; the record itself kept to
  // ids, counts, numbers, levels and the game's own short labels. No names of people, projects, partners, ideas or findings;
  // no event or log text; nothing the player typed.
  function byHorizon(list, h) { return (list || []).filter(function (p) { return p && p.horizon === h; }).length; }
  function yearFigures(rec, g) {
    var R = rec.results || {}, ob = rec.objectives || [], la = rec.launches || [], gr = rec.grants || [];
    var kept = (g.appraisalKept || {})[rec.year], score = kept && typeof kept.score === 'number' ? Math.round(kept.score) : null;
    var bud = (g.annualBudgets || []).filter(function (b) { return b && b.year === rec.year; })[0];
    var start = bud ? (typeof bud.opening === 'number' ? bud.opening : bud.allocated) : null;
    return {
      year: rec.year, goal: num(R.goal, 1), income: num(R.income, 1), income_incr: num(R.incremental, 1),
      income_ntf: num(R.newToFirm, 1), income_ntw: num(R.newToWorld, 1),
      objectives_total: ob.length, objectives_met: ob.filter(function (o) { return o.met; }).length,
      appraisal: (rec.appraisal && rec.appraisal.level) || null,
      board_score: (score >= 1 && score <= 3) ? score : null,                    // Katrien's 1 to 3 at the appraisal (G.appraisalKept, 106555 / 106685)
      ended_early: !!rec.endedEarly,
      budget_start: numOrNull(start, 1),                                         // the year's budget as it opened (G.annualBudgets)
      launches: la.length, launches_failed: la.filter(function (l) { return l.failed; }).length,
      rd_completed: count(rec.completed), rd_stopped: count(rec.stopped), rd_running: count(rec.running),
      rd_completed_h1: byHorizon(rec.completed, 1), rd_completed_h2: byHorizon(rec.completed, 2), rd_completed_h3: byHorizon(rec.completed, 3),
      rd_running_h1: byHorizon(rec.running, 1), rd_running_h2: byHorizon(rec.running, 2), rd_running_h3: byHorizon(rec.running, 3),
      partners: count(rec.partners), grants_submitted: gr.length,
      grants_funded: gr.filter(function (x) { return x.status === 'funded' || x.status === 'approved'; }).length,
      programmes: count(rec.programmes), missions: count(rec.missions), findings: count(rec.findings),
      hires: count(rec.hires), leavers: count(rec.left),
      unspent: numOrNull(rec.unspent, 1),
      purpose: (typeof rec.purpose === 'number') ? Math.round(rec.purpose) : null,
      minutes: Math.round((((g.playTime || {}).years || {})[rec.year] || 0) / 60),
      record: {
        mode: { mode: short((rec.mode || {}).mode || 'builder') },
        direction: short(rec.direction),                                         // the board's direction: the game's own label
        results: { goal: R.goal, income: R.income, incremental: R.incremental, newToFirm: R.newToFirm, newToWorld: R.newToWorld,
                   incrCap: R.incrCap, ntfFloor: R.ntfFloor, ntwFloor: R.ntwFloor },
        objectives: ob.map(function (o) { return { slot: short(o.slot), met: !!o.met, foundation: !!o.foundation }; }),
        appraisal: rec.appraisal ? { level: short(rec.appraisal.level), budgetMod: rec.appraisal.budgetMod } : null,
        caps: (rec.caps || []).map(function (c) { return { id: short(c.id), level: c.level, start: c.start }; }),
        hires: (rec.hires || []).map(function (h) { return { role: short(h.role), seniority: short(h.seniority) }; }),
        partners: (rec.partners || []).map(function (p) { return { type: short(p.type), ip: short(p.ip), q: p.q }; }),
        grants: gr.map(function (x) { return { status: short(x.status), q: x.q, decidedYear: x.decidedYear, decidedQ: x.decidedQ }; }),
        programmes: (rec.programmes || []).map(function (p) { return { type: short(p.type), q: p.q }; }),
        missions: count(rec.missions),
        findings: (rec.findings || []).map(function (f) { return { type: short(f.type), status: short(f.status), q: f.q }; }),
        completed: (rec.completed || []).map(function (p) { return { q: p.q, result: short(p.result), horizon: p.horizon, legacy: !!p.legacy, alliance: !!p.alliance }; }),
        stopped: (rec.stopped || []).map(function (p) { return { how: short(p.how), q: p.q, advised: !!p.advised }; }),
        running: (rec.running || []).map(function (p) { return { horizon: p.horizon, legacy: !!p.legacy, alliance: !!p.alliance, atRisk: !!p.atRisk }; }),
        launches: la.map(function (l) { return { novelty: short(l.novelty), category: short(l.category), origin: short(l.origin), q: l.q, process: !!l.process,
                                                 failed: !!l.failed, income: l.income, readiness: l.readiness, missing: (l.missing || []).map(short) }; }),
        waiting: count(rec.waiting), eventChoices: count(rec.eventChoices),
        unspent: rec.unspent, purpose: rec.purpose, endedEarly: !!rec.endedEarly, endedQuarter: rec.endedQuarter || null
      }
    };
  }

  var GA_LEVELS = ['Innovation Jedi Master', 'Innovation Jedi', 'Innovation Padawan', 'Innovation Youngling'];
  var GA_AREAS = ['market', 'direction', 'caps', 'rd', 'outside', 'legacy'], GA_STATES = ['well', 'begun', 'not', 'none'];
  function assessmentOf(g, early) {
    var out = {};
    try {


      var a = null;
      if (typeof window.gameAssessmentFor === 'function') a = window.gameAssessmentFor(early ? 'dismissed' : 'full');
      if (!a) a = g[CONFIG.assessmentKey];
      if (!a) return out;
      if (GA_LEVELS.indexOf(a.levelName) >= 0) out.assessment_level = a.levelName;
      (a.areas || []).forEach(function (x) { if (x && GA_AREAS.indexOf(x.id) >= 0 && GA_STATES.indexOf(x.state) >= 0) out['ga_' + x.id] = x.state; });




      if (typeof a.score === 'number' && isFinite(a.score)) { out.score = out.ds_score = Math.max(0, Math.min(100, Math.round(a.score))); out.ds_held = !!a.capped; }
    } catch (e) {}
    return out;
  }

  function runFigures(g, atEnd) {
    var cp = g.competePlay, early = !!g.gameOver && (g.gameOverReason === 'dismissed' || g.gameOverReason === 'negligent_launches');
    var cmp = cp.compared !== false;                                             // Skip: anonymous, no nickname, no level, no class code
    var out = { compared: cmp, level: cmp ? cp.level : null, nickname: cmp ? (cp.nickname || '') : '', class_code: cmp ? (cp.code || '') : '', build_ref: buildRef(),
                errors_seen: Math.max(0, Math.min(9999, cp.errors || 0)),
                minutes_total: Math.round((((g.playTime || {}).total) || 0) / 60) };
    if (atEnd && g.gameOver) {
      out.ended_how = early ? 'early' : 'full';
      try { out.outcome = early ? 'ended_early' : calculateVictoryTier().tier.id; } catch (e) {}   // the game's own read (107419)
      var a = assessmentOf(g, early); for (var k in a) out[k] = a[k];
    }
    return out;
  }

  // ================================================================ sending: the whole run, every time
  function sync(atEnd) {
    var g = game();
    if (!taking(g) || typeof g.runStartTime !== 'number' || typeof g.runNonce !== 'number') return Promise.resolve(null);
    return runKey(g).then(function (key) {
      if (!key) return null;
      var years = [];
      [1, 2, 3].forEach(function (y) { var r = (g.yearRecords || {})[y]; if (r) { try { years.push(yearFigures(r, g)); } catch (e) {} } });
      return rpc('dz_sync', { p_run_key: key, p_run: runFigures(g, atEnd), p_years: years }).then(function () { return key; });
    }).catch(function () { return null; });
  }

  // ================================================================ the question at the start (Forge only)
  var TOWNS = ['Vilvoorde', 'Mechelen', 'Leuven', 'Lier', 'Aalst', 'Halle', 'Zemst', 'Machelen', 'Grimbergen', 'Kortrijk', 'Hasselt',
               'Namur', 'Dinant', 'Tournai', 'Ostend', 'Bruges', 'Antwerp', 'Ghent', 'Genk', 'Diest', 'Tienen', 'Spa', 'Durbuy',
               'Turnhout', 'Lokeren', 'Ninove', 'Wavre', 'Eupen', 'Arlon', 'Nivelles'];
  var COLOURS = ['Teal', 'Amber', 'Slate', 'Copper', 'Indigo', 'Sage', 'Rust', 'Ochre', 'Cobalt', 'Moss', 'Coral', 'Pewter', 'Saffron', 'Jade', 'Cedar', 'Plum'];
  var NO_NUMBERS = { 14: 1, 18: 1, 28: 1, 69: 1, 88: 1 };   // numbers with a known hateful or crude second meaning are never drawn
  // The browser's own random numbers, not Math.random, so the game's own sequence of chance is left exactly as it was.
  function rnd(k) { try { var b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] % k; } catch (e) { return Math.floor(Math.random() * k); } }
  function drawNickname() {
    var r = function (a) { return a[rnd(a.length)]; }, n;
    do { n = 10 + rnd(90); } while (NO_NUMBERS[n]);
    return r(COLOURS) + ' ' + r(TOWNS) + ' ' + n;
  }
  function nicknameOk(s) { return /^[\p{L}\p{N} ._-]{2,24}$/u.test(s) && s.indexOf('@') < 0 && !/\d{5,}/.test(s); }   // typed nicknames only

  var asked = false;
  function showQuestion() {
    var g = game(); if (!g || document.getElementById('dz-compare-question')) return;
    var under = document.getElementById('character-creation'), underVis = under ? under.style.visibility : '';
    // The name screen is hidden while the question is up, and given back exactly as it was. The game's accessibility layer keeps
    // Tab inside the top window it knows (the name screen); hidden, the name screen is not open to it, so Tab stays in this dialog.
    if (under) under.style.visibility = 'hidden';
    var opener = document.activeElement;
    var nick = CONFIG.nicknames === 'generated' ? drawNickname() : '';
    var box = el('div', 'position:fixed;inset:0;z-index:9600;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;overflow-y:auto;');
    box.id = 'dz-compare-question';
    var card = el('div', 'background:#fff;color:#1c1917;border-radius:14px;max-width:460px;width:100%;padding:24px;box-sizing:border-box;max-height:calc(100vh - 32px);overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.12);');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'dz-q-title'); card.setAttribute('aria-describedby', 'dz-q-sub');
    var h = el('h2', 'margin:0 0 4px;font-size:22px;font-weight:800;', WORDS.title); h.id = 'dz-q-title'; h.tabIndex = -1;
    card.appendChild(h);
    var sub = el('p', 'margin:0 0 16px;color:#57534e;font-size:14px;', WORDS.sub); sub.id = 'dz-q-sub'; card.appendChild(sub);
    var field = 'display:block;font-size:13px;font-weight:700;margin-bottom:4px;';
    var input = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #a8a29e;border-radius:8px;font-size:15px;margin-bottom:4px;background:#fff;color:#1c1917;';
    var help = 'margin:0 0 12px;color:#57534e;font-size:12px;';

    var nickIn = null;
    if (CONFIG.nicknames !== 'none') {
      var nl = el('div', field, WORDS.nickLabel); nl.id = 'dz-q-nick-label'; card.appendChild(nl);
      if (CONFIG.nicknames === 'generated') {
        var row = el('div', 'display:flex;gap:8px;align-items:center;margin-bottom:4px;');
        var nickShow = el('output', 'flex:1;padding:9px 12px;border:1px solid #d6d3d1;border-radius:8px;font-weight:600;font-size:15px;', nick);
        nickShow.setAttribute('aria-labelledby', 'dz-q-nick-label'); nickShow.setAttribute('aria-live', 'polite');
        var again = el('button', 'padding:9px 12px;border:1px solid #a8a29e;border-radius:8px;background:#fafaf9;color:#1c1917;cursor:pointer;font-size:13px;', WORDS.nickAgain);
        again.type = 'button';
        again.onclick = function () { nick = drawNickname(); nickShow.textContent = nick; };
        row.appendChild(nickShow); row.appendChild(again); card.appendChild(row);
        card.appendChild(el('p', help, WORDS.nickHelpGenerated));
      } else {
        nickIn = el('input', input); nickIn.id = 'dz-q-nick'; nickIn.maxLength = 24; nickIn.autocomplete = 'off';
        nickIn.setAttribute('aria-labelledby', 'dz-q-nick-label'); card.appendChild(nickIn);
        card.appendChild(el('p', help, WORDS.nickHelpTyped));
      }
    }
    var ll = el('label', field, WORDS.levelLabel); ll.htmlFor = 'dz-q-level'; card.appendChild(ll);
    var lv = el('select', input); lv.id = 'dz-q-level';
    [['', WORDS.levelPick], ['ug', 'Undergraduate'], ['masters', 'Masters'], ['mba', 'MBA'], ['other', 'Other']].forEach(function (o) {
      var op = el('option', null, o[1]); op.value = o[0]; if (!o[0]) { op.disabled = true; op.selected = true; } lv.appendChild(op);
    });
    card.appendChild(lv);
    card.appendChild(el('p', help, WORDS.levelHelp));
    var cl = el('label', field, WORDS.codeLabel); cl.htmlFor = 'dz-q-code'; card.appendChild(cl);
    var code = el('input', input + 'letter-spacing:0.15em;text-transform:uppercase;'); code.id = 'dz-q-code';
    code.maxLength = 6; code.autocomplete = 'off'; code.spellcheck = false; code.setAttribute('autocapitalize', 'characters');
    card.appendChild(code);
    card.appendChild(el('p', help, WORDS.codeHelp));
    var err = el('div', 'min-height:0;color:#b91c1c;font-size:13px;margin-bottom:8px;'); err.setAttribute('role', 'status'); err.setAttribute('aria-live', 'polite');
    card.appendChild(err);

    var yes = el('button', 'width:100%;padding:12px;border:none;border-radius:10px;background:#1e293b;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:8px;', WORDS.yes);
    var no = el('button', 'width:100%;padding:11px;border:1px solid #a8a29e;border-radius:10px;background:#fff;color:#1c1917;font-size:14px;cursor:pointer;margin-bottom:10px;', WORDS.skip);
    yes.type = no.type = 'button'; yes.id = 'dz-q-yes'; no.id = 'dz-q-skip';
    card.appendChild(el('p', 'margin:0 0 12px;font-size:13px;line-height:1.5;color:#44403c;', WORDS.notice));
    card.appendChild(yes); card.appendChild(no);
    var moreBtn = el('button', 'padding:0;border:none;background:none;color:#1d4ed8;text-decoration:underline;font-size:12.5px;cursor:pointer;', WORDS.moreLink);
    moreBtn.type = 'button'; moreBtn.setAttribute('aria-expanded', 'false'); moreBtn.setAttribute('aria-controls', 'dz-q-more');
    var morePanel = el('div', 'display:none;margin-top:8px;padding:10px 12px;background:#f5f5f4;border-radius:8px;font-size:12px;line-height:1.5;color:#44403c;'); morePanel.id = 'dz-q-more';
    WORDS.more.forEach(function (s) { morePanel.appendChild(el('p', 'margin:0 0 4px;', s)); });
    var full = el('a', 'color:#1d4ed8;', WORDS.moreFull); full.href = CONFIG.page + '#what-is-kept'; full.target = '_blank'; full.rel = 'noopener noreferrer';
    morePanel.appendChild(full);
    moreBtn.onclick = function () { var open = morePanel.style.display === 'none'; morePanel.style.display = open ? 'block' : 'none'; moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    card.appendChild(moreBtn); card.appendChild(morePanel);
    box.appendChild(card);
    document.body.appendChild(box);
    try { (lv.focus ? lv : h).focus({ preventScroll: true }); } catch (e) {}

    // keyboard: Tab kept inside this dialog; Escape is Skip (recorded anonymously)
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); skip(); return; }   // Escape is Skip
      if (e.key !== 'Tab') return;
      var f = [].filter.call(card.querySelectorAll('button,select,input,a[href]'), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    });

    var closed = false;
    function close() {
      if (closed) return; closed = true;
      try { box.remove(); } catch (e) {}
      try { if (under) under.style.visibility = underVis; } catch (e) {}
      try { if (opener && opener.isConnected && opener.focus) opener.focus(); } catch (e) {}
    }
    function fail(msg) { err.textContent = msg; yes.disabled = false; yes.textContent = WORDS.yes; }

    function begin(cp) {
      if (closed) return;
      g.competePlay = cp;
      try { runFrankIdentity(); } catch (e) {}                                 // the game's own function (108789)
      close();
      sync(false);                                                             // the run's row; harmless if it does not arrive
    }
    // Skip: recorded anonymously, as on the Slingshot; no nickname, level or class code; no comparison at the end
    function skip() { begin({ v: 1, compared: false, errors: 0 }); }
    no.onclick = skip;
    yes.onclick = function () {
      var level = lv.value, c = String(code.value || '').trim().toUpperCase(), n = nick;
      if (CONFIG.nicknames === 'typed') { n = String(nickIn.value || '').trim(); if (!nicknameOk(n)) return fail(WORDS.errNick); }
      if (CONFIG.nicknames === 'none') n = '';
      if (!level) { try { lv.focus(); } catch (e) {} return fail(WORDS.errLevel); }
      if (c && !/^[A-HJ-NP-Z2-9]{6}$/.test(c)) { try { code.focus(); } catch (e) {} return fail(WORDS.errCode); }
      var go = function (classLevel) { begin({ v: 1, compared: true, nickname: n, level: classLevel || level, code: c, errors: 0 }); };
      if (!c) return go(null);
      yes.disabled = true; yes.textContent = WORDS.checking; err.textContent = '';
      var settled = false, t = setTimeout(function () { if (!settled) { settled = true; go(null); } }, CONFIG.codeWait);   // no answer: carry on
      rpc('dz_check_class', { p_code: c }).then(function (res) {
        if (settled) return; settled = true; clearTimeout(t);
        if (res && res.found === false && !res.busy) { try { code.focus(); } catch (e) {} return fail(WORDS.errCodeUnknown); }
        go(res && res.found ? res.level : null);                               // the class's level wins, as on the Slingshot
      });
    };
  }

  // ================================================================ the card on the end screen
  function band(rank) {
    if (rank == null) return null;
    rank = Number(rank);
    if (rank >= 0.75) return WORDS.bandTop;
    if (rank > 0.6) return WORDS.bandAbove;
    if (rank >= 0.4) return WORDS.bandMiddle;             // level with most others: no ranking claimed (as the Slingshot)
    if (rank >= 0.25) return WORDS.bandBelow;
    return WORDS.bandBottom;
  }
  var LEVEL_WORDS = { outstanding: 'Outstanding', strong: 'Strong', adequate: 'Adequate', concerning: 'Concerning', critical: 'Critical' };
  var ENDING_WORDS = { pinnacle: 'The Pinnacle', outstanding: 'Outstanding Tenure', mixed: 'Mixed Record', underperformance: 'Underperformance',
                       critical: 'A Difficult Tenure', ended_early: 'Ended early by the board' };
  var POOL_WORDS = { 'class': 'Your class', level: 'Players at your level', all: 'All Forge players' };
  function eur(x) { return '€' + (Math.round((Number(x) || 0) * 10) / 10) + 'M'; }

  function endScreenShell() {
    var overlay = document.getElementById('boardroom-overlay'), pdf = document.getElementById('download-pdf-btn');
    if (!overlay || !pdf || !overlay.contains(pdf)) return null;          // the end screen itself has been drawn
    var shell = overlay.firstElementChild, before = pdf;
    while (before && before.parentElement !== shell) before = before.parentElement;   // the "Your report" block

    var afterScore = null;
    // (the title picture carries the same logo, so the block taken is the one whose words name the score)
    try { [].forEach.call(shell ? shell.querySelectorAll('img[src="Logocropped.webp"]') : [], function (logo) {
        var p = logo; while (p && p.parentElement !== shell) p = p.parentElement;
        if (p && !afterScore && /Disruptor's score|Disruptor’s score/.test(p.textContent || '')) afterScore = p.nextElementSibling; }); } catch (e) {}
    return shell ? { shell: shell, before: before, afterScore: afterScore } : null;
  }

  function drawCard(data) {
    var at = endScreenShell();
    if (!at || document.getElementById('dz-compare-card')) return;
    var card = el('section', 'padding:22px 32px;background:white;border-top:1px solid #e7e5e4;font-family:Inter,sans-serif;color:#1c1917;');
    card.id = 'dz-compare-card'; card.setAttribute('aria-labelledby', 'dz-card-title');
    var t = el('h3', 'font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;color:#57534e;margin:0 0 10px;', WORDS.cardTitle); t.id = 'dz-card-title';
    card.appendChild(t);
    var line = 'font-size:13px;line-height:1.55;color:#44403c;';
    var years = (data && data.years) || [], practice = false;
    years.forEach(function (y) {
      card.appendChild(el('div', 'font-weight:700;font-size:15px;margin:10px 0 2px;', 'Year ' + y.year + ': ' + eur(y.income) + ' of ' + eur(y.goal) +
                    (y.appraisal ? ' · ' + (LEVEL_WORDS[y.appraisal] || '') : '')));
      var pools = y.pools || [];
      if (!pools.length) { card.appendChild(el('div', line, WORDS.tooFew)); return; }
      pools.forEach(function (p) {
        var bits = [WORDS.income + ' ' + band(p.income_rank), WORDS.objectives + ' ' + band(p.objectives_rank)];
        if (p.score_rank != null) bits.push(WORDS.boardScore + ' ' + band(p.score_rank));
        card.appendChild(el('div', line, (POOL_WORDS[p.pool] || '') + ' (' + p.n + '): ' + bits.join(', ') + '.'));
        if (p.models > 0) practice = true;
      });
    });
    if (!years.length) card.appendChild(el('div', line, WORDS.tooFew));
    if (data && data.game_view && data.game_view.rank != null && data.game_view.level) {
      card.appendChild(el('div', line + 'margin-top:10px;', WORDS.gameView + ' ' + data.game_view.level + ', ' + band(data.game_view.rank) + ' ' + WORDS.ofForge + ' (' + data.game_view.n + ').'));
    }

    if (CONFIG.compareScore && data && data.score_view && data.score_view.rank != null) {
      card.appendChild(el('div', line + 'margin-top:10px;', WORDS.scoreView + ' ' + data.score_view.score + ', ' + band(data.score_view.rank) + ' ' + WORDS.ofForge + ' (' + data.score_view.n + ').'));
      if (data.score_view.models > 0) practice = true;
    }
    if (data && data.endings_models > 0) practice = true;
    if (data && data.endings) {
      var order = ['pinnacle', 'outstanding', 'mixed', 'underperformance', 'critical', 'ended_early'];
      var e = order.filter(function (k) { return data.endings[k]; }).map(function (k) { return ENDING_WORDS[k] + ' ' + Math.round(data.endings[k] * 100) + '%'; });
      if (e.length) card.appendChild(el('div', line + 'margin-top:10px;', WORDS.endings + ' ' + e.join(', ') + '.'));
    }
    if (CONFIG.sayPractice && practice) card.appendChild(el('div', 'font-size:12px;color:#57534e;margin-top:10px;', WORDS.practice));
    card.appendChild(el('div', line + 'margin-top:10px;', WORDS.close));
    var cp = (game() || {}).competePlay || {};
    var foot = el('div', 'font-size:12px;color:#57534e;margin-top:12px;', cp.nickname ? WORDS.playingAs + ' ' + cp.nickname + '.' : '');
    card.appendChild(foot);
    if (CONFIG.cardPlace === 'afterScore' && at.afterScore) at.shell.insertBefore(card, at.afterScore);
    else if (at.before) at.shell.insertBefore(card, at.before); else at.shell.appendChild(card);
  }

  var endP = null;
  function atTheEnd() {
    var g = game();
    if (!taking(g) || !g.gameOver) return;
    var compared = g.competePlay.compared !== false;
    if (!endP) endP = sync(true).then(function (key) {
      if (!key || !compared) return null;                        // Skip: sent once more, no comparison asked for, no card
      return rpc('dz_compare', { p_run_key: key }).then(function (data) { return data ? { data: data } : null; });
    }).catch(function () { return null; });
    endP.then(function (r) { if (r && taking(game())) { try { drawCard(r.data); } catch (e) {} } });   // nothing back: no card, nothing said
  }

  // ================================================================ wrapping the game's three functions
  function wrap(name, after) {
    var orig = window[name];
    if (typeof orig !== 'function') return false;
    if (orig._dzWrapped) return true;                            // already wrapped (the file loaded twice): never twice
    var w = function () {
      var r = orig.apply(this, arguments);                       // the game's own function first, unchanged
      try { after.apply(this, arguments); } catch (e) {}
      return r;
    };
    w._dzWrapped = true;
    window[name] = w;
    return true;
  }

  function init(tries) {
    if (!LIVE || !can()) return;                                 // not set up, or an old browser: the shim does nothing
    var ok = typeof window.startGameFromArrival === 'function' && typeof window.saveYearRecord === 'function' &&
             typeof window.showEndOfGameScorecard === 'function' && typeof window.runFrankIdentity === 'function';
    if (!ok) { if ((tries || 0) < 20) setTimeout(function () { init((tries || 0) + 1); }, 500); return; }
    wrap('startGameFromArrival', function () {
      var g = game();
      // The game started only if it moved on to the name screen (a Pivot game without a sector returns early, 113052).
      if (!g || asked || !document.getElementById('character-creation')) return;
      if (!isForgeRun(g)) return;                                // Pivot, Jugaad, Gauntlet, Incubator, probation: nothing at all
      asked = true;
      showQuestion();
    });
    // After the caller has finished: the dismissal path marks the year ended early just after this call (33136).
    wrap('saveYearRecord', function () { if (taking(game())) setTimeout(function () { sync(false); }, 0); });
    // Every call: the first may be held by the end scene (endSceneHolds, 108239) and draws nothing; the card goes in only once
    // the end screen itself is on the page, and again (once) if the screen is ever drawn afresh.
    wrap('showEndOfGameScorecard', function () { if (taking(game())) setTimeout(atTheEnd, 0); });
  }

  // ================================================================ the words (all in WORDING-final.txt)
  var WORDS = {
    title: 'Compare your tenure',
    sub: 'See how your years compare with other Forge players.',
    nickLabel: 'Your nickname',
    nickAgain: 'Draw another',
    nickHelpGenerated: 'Made up by the game. Nothing about you is in it.',
    nickHelpTyped: 'Not your real name or student number.',
    levelLabel: 'Your level',
    levelPick: 'Choose your level',
    levelHelp: 'You are compared with players at the same level.',
    codeLabel: 'Class code (optional)',
    codeHelp: 'If your educator gave you one.',
    yes: 'Compare my game',
    skip: 'Skip, just play',
    checking: 'Checking the code…',
    errNick: 'Please choose a nickname of 2 to 24 letters or numbers.',
    errLevel: 'Please choose your level.',
    errCode: 'A class code has six letters and numbers.',
    errCodeUnknown: 'That code was not found. Check it, or leave it blank.',


    notice: 'The game records your results for each year and the time you played. No personal data is collected. It does not track you. All play is anonymous. The data is used to improve the game and monitor use. If you choose Compare, you get a made-up nickname and see how your run went.',
    moreLink: 'More about this',
    more: [
      'Recorded in a Forge game: each year’s results (income, objectives, the board’s appraisal, what you used) and the time played.',
      'Never recorded: your name or anything you type. The database keeps no IP address. Nothing is kept on your device.',
      'Compare adds a made-up nickname, your level and a class code if you have one. Skip adds nothing.',
      'Used for: your comparison and your educator’s class page; the data is used to improve the game (its benchmarks and difficulty) and monitor use.',
      'Kept in the EU. Nicknames and class codes are removed after 12 months.'
    ],
    moreFull: 'The full notice',
    cardTitle: 'How your years compare',
    tooFew: 'Recorded. Comparisons appear when more players have finished this year.',
    income: 'income', objectives: 'objectives met', boardScore: 'the board’s score',
    bandTop: 'in the top 25%', bandAbove: 'above the median', bandMiddle: 'around the median',
    bandBelow: 'below the median', bandBottom: 'in the bottom 25%',
    gameView: 'The game’s assessment:', ofForge: 'of Forge players',
    endings: 'How other Forge tenures ended:',
    playingAs: 'Playing as',

    scoreView: 'The Disruptor’s score:',
    practice: 'While few players have finished, the figures for all Forge players include practice games played by the game’s test players.',
    close: 'Wherever your years stand, your report shows what to try next time.'
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(0); });
  else setTimeout(function () { init(0); }, 0);
})();
