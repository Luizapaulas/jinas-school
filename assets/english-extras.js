// =============================================================
//  English w/ School — Verbs, Grammar, Videos & music, Calendar, Contact
//  e notas automáticas dos exercícios das unidades.
//  Roda depois de english-hub.js e usa as funções do English (ACC, LV, LEVELS,
//  SUMMARY, openUnit, esc, $, setNav, crumbs, UNSUB) e do hub (EnglishHub._).
//  Dados (site "english"): progress/<uid>, events, info/contact
// =============================================================
(function () {
  const X = EnglishHub._;               // estado e utilidades do hub
  const H = X.H;
  const staff = () => !!ACC.role;
  const when = X.when;
  Object.assign(H, { progress: {}, allProgress: [], events: [], contact: null, gramLv: null, mediaLv: null, calYear: new Date().getFullYear(),
    verbs: { set: 30, mode: "past", q: null, right: 0, done: 0, wrong: [] } });

  // ---------------- Verbos irregulares (os mais usados primeiro) ----------------
  const IRREG = [
    ["be", "was / were", "been", "ser, estar"], ["have", "had", "had", "ter"], ["do", "did", "done", "fazer"], ["say", "said", "said", "dizer"],
    ["go", "went", "gone", "ir"], ["get", "got", "got / gotten", "conseguir, pegar"], ["make", "made", "made", "fazer, fabricar"], ["know", "knew", "known", "saber, conhecer"],
    ["think", "thought", "thought", "pensar"], ["take", "took", "taken", "pegar, levar"], ["see", "saw", "seen", "ver"], ["come", "came", "come", "vir"],
    ["give", "gave", "given", "dar"], ["find", "found", "found", "encontrar"], ["tell", "told", "told", "contar, dizer"], ["become", "became", "become", "tornar-se"],
    ["leave", "left", "left", "sair, deixar"], ["feel", "felt", "felt", "sentir"], ["bring", "brought", "brought", "trazer"], ["begin", "began", "begun", "começar"],
    ["keep", "kept", "kept", "manter, guardar"], ["hold", "held", "held", "segurar"], ["write", "wrote", "written", "escrever"], ["stand", "stood", "stood", "ficar de pé"],
    ["hear", "heard", "heard", "ouvir"], ["let", "let", "let", "deixar, permitir"], ["mean", "meant", "meant", "significar"], ["set", "set", "set", "colocar, definir"],
    ["meet", "met", "met", "encontrar, conhecer"], ["run", "ran", "run", "correr"], ["pay", "paid", "paid", "pagar"], ["sit", "sat", "sat", "sentar"],
    ["speak", "spoke", "spoken", "falar"], ["lead", "led", "led", "liderar"], ["read", "read", "read", "ler"], ["grow", "grew", "grown", "crescer"],
    ["lose", "lost", "lost", "perder"], ["fall", "fell", "fallen", "cair"], ["send", "sent", "sent", "enviar"], ["build", "built", "built", "construir"],
    ["understand", "understood", "understood", "entender"], ["draw", "drew", "drawn", "desenhar"], ["break", "broke", "broken", "quebrar"], ["spend", "spent", "spent", "gastar, passar (tempo)"],
    ["cut", "cut", "cut", "cortar"], ["rise", "rose", "risen", "subir, levantar-se"], ["drive", "drove", "driven", "dirigir"], ["buy", "bought", "bought", "comprar"],
    ["wear", "wore", "worn", "vestir, usar"], ["choose", "chose", "chosen", "escolher"], ["eat", "ate", "eaten", "comer"], ["drink", "drank", "drunk", "beber"],
    ["sleep", "slept", "slept", "dormir"], ["swim", "swam", "swum", "nadar"], ["sing", "sang", "sung", "cantar"], ["teach", "taught", "taught", "ensinar"],
    ["catch", "caught", "caught", "pegar, apanhar"], ["fly", "flew", "flown", "voar"], ["forget", "forgot", "forgotten", "esquecer"], ["forgive", "forgave", "forgiven", "perdoar"],
    ["sell", "sold", "sold", "vender"], ["win", "won", "won", "ganhar"], ["throw", "threw", "thrown", "jogar, atirar"], ["ride", "rode", "ridden", "andar (de bicicleta, cavalo)"],
    ["wake", "woke", "woken", "acordar"], ["steal", "stole", "stolen", "roubar"], ["hide", "hid", "hidden", "esconder"], ["shake", "shook", "shaken", "sacudir"],
    ["lend", "lent", "lent", "emprestar"], ["light", "lit", "lit", "acender"], ["shoot", "shot", "shot", "atirar, filmar"], ["show", "showed", "shown", "mostrar"],
    ["shut", "shut", "shut", "fechar"], ["put", "put", "put", "colocar"], ["hit", "hit", "hit", "bater"], ["hurt", "hurt", "hurt", "machucar"],
    ["cost", "cost", "cost", "custar"], ["bite", "bit", "bitten", "morder"], ["blow", "blew", "blown", "soprar"], ["dig", "dug", "dug", "cavar"],
    ["feed", "fed", "fed", "alimentar"], ["fight", "fought", "fought", "lutar"], ["freeze", "froze", "frozen", "congelar"], ["hang", "hung", "hung", "pendurar"],
    ["lay", "laid", "laid", "pôr, deitar (algo)"], ["lie", "lay", "lain", "deitar-se"], ["ring", "rang", "rung", "tocar (campainha)"], ["seek", "sought", "sought", "procurar"],
    ["shine", "shone", "shone", "brilhar"], ["sink", "sank", "sunk", "afundar"], ["slide", "slid", "slid", "deslizar"], ["spin", "spun", "spun", "girar"],
    ["spread", "spread", "spread", "espalhar"], ["stick", "stuck", "stuck", "colar, grudar"], ["sting", "stung", "stung", "picar"], ["strike", "struck", "struck", "golpear"],
    ["swear", "swore", "sworn", "jurar"], ["sweep", "swept", "swept", "varrer"], ["swing", "swung", "swung", "balançar"], ["tear", "tore", "torn", "rasgar"],
    ["bend", "bent", "bent", "dobrar, curvar"], ["bet", "bet", "bet", "apostar"], ["bleed", "bled", "bled", "sangrar"], ["breed", "bred", "bred", "criar (animais)"],
    ["burst", "burst", "burst", "estourar"], ["deal", "dealt", "dealt", "lidar"], ["flee", "fled", "fled", "fugir"], ["forbid", "forbade", "forbidden", "proibir"],
    ["quit", "quit", "quit", "desistir, largar"], ["upset", "upset", "upset", "chatear"], ["withdraw", "withdrew", "withdrawn", "retirar"], ["overcome", "overcame", "overcome", "superar"]
  ];
  const SETS = [[30, "30 most common"], [60, "60 verbs"], [IRREG.length, "All " + IRREG.length + " verbs"]];
  const norm = s => String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
  const accepts = (answer, typed) => answer.split("/").map(norm).includes(norm(typed));

  // ---------------- Datas do mundo de língua inglesa e da fé cristã ----------------
  const DATES = [
    [1, 1, "New Year's Day", "culture", "In Scotland it is called Hogmanay; people sing “Auld Lang Syne” at midnight."],
    [1, 25, "Burns Night", "culture", "Scotland celebrates the poet Robert Burns with poems, music and haggis."],
    [1, 26, "Australia Day", "culture", "National day of Australia."],
    [2, 6, "Waitangi Day", "culture", "National day of New Zealand: the Treaty of Waitangi was signed in 1840."],
    [2, 14, "Valentine's Day", "culture", "Cards and kind words for the people we love. Remember 1 Corinthians 13: “Love is patient, love is kind.”"],
    [3, 1, "St David's Day", "culture", "National day of Wales: people wear daffodils and leeks."],
    [3, 17, "St Patrick's Day", "faith", "Patrick shared the Gospel in Ireland in the 5th century. Today there are parades and a lot of green!"],
    [4, 23, "English Language Day", "language", "The UN celebrates English on the traditional date of Shakespeare's birth and death. It is also St George's Day in England."],

    [7, 1, "Canada Day", "culture", "National day of Canada."],
    [7, 4, "Independence Day (USA)", "culture", "Fireworks and family barbecues all over the United States."],
    [9, 30, "International Translation Day", "language", "A day for translators and interpreters, who build bridges between languages and peoples."],
    [10, 6, "William Tyndale Day", "faith", "Tyndale translated the New Testament into English so that everyone could read it. He died for this on 6 October 1536."],
    [10, 31, "Reformation Day", "faith", "On 31 October 1517 Martin Luther published his 95 Theses. Many countries also have Halloween on this day."],
    [11, 11, "Remembrance Day", "culture", "The UK and the Commonwealth remember those who died in wars. People wear red poppies."],
    [12, 24, "Christmas Eve", "faith", "Carols and candles: “Silent Night” is sung in English all over the world."],
    [12, 25, "Christmas Day", "faith", "We celebrate the birth of Jesus (Luke 2)."],
    [12, 26, "Boxing Day", "culture", "A public holiday in the UK, Canada, Australia and New Zealand."]
  ];
  const MOVABLE = [  // dias contados a partir da Páscoa
    [-46, "Ash Wednesday", "faith", "The beginning of Lent, forty days before Easter."],
    [-7, "Palm Sunday", "faith", "Jesus enters Jerusalem (Matthew 21)."],
    [-2, "Good Friday", "faith", "Christians remember the death of Jesus on the cross."],
    [0, "Easter Sunday", "faith", "“He is not here; he has risen!” (Luke 24:6)."],
    [49, "Pentecost", "faith", "The Holy Spirit comes and the disciples speak in many languages (Acts 2)."]
  ];
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
  const nthWeekday = (y, m, wd, n) => { const d = new Date(y, m, 1); const off = (wd - d.getDay() + 7) % 7; return new Date(y, m, 1 + off + (n - 1) * 7); };
  function datesFor(y) {
    const out = DATES.map(([m, d, t, ty, ds]) => ({ date: new Date(y, m - 1, d), title: t, type: ty, desc: ds }));
    const e = easter(y); MOVABLE.forEach(([o, t, ty, ds]) => out.push({ date: new Date(y, e.getMonth(), e.getDate() + o), title: t, type: ty, desc: ds }));
    out.push({ date: nthWeekday(y, 10, 4, 4), title: "Thanksgiving (USA)", type: "culture", desc: "Families give thanks together on the fourth Thursday of November." });
    out.push({ date: nthWeekday(y, 4, 1, 5) > new Date(y, 4, 31) ? nthWeekday(y, 4, 1, 4) : nthWeekday(y, 4, 1, 5), title: "Memorial Day (USA)", type: "culture", desc: "The last Monday of May." });
    const pp = H.events.filter(ev => ev.date && (staff() || ev.level === "all" || ev.level === (ACC.family && ACC.family.level)))
      .map(ev => ({ date: new Date(ev.date + "T12:00:00"), title: ev.title, type: "class", desc: (ev.text || "") + (ev.level && ev.level !== "all" ? " · " + X.lvName(ev.level) : ""), id: ev.id }))
      .filter(ev => ev.date.getFullYear() === y);
    return out.concat(pp).sort((a, b) => a.date - b.date);
  }

  const css = document.createElement("style");
  css.textContent = `
  .xv-card{max-width:640px}
  .xv-q{font:700 30px var(--display);margin:8px 0 2px}
  .xv-pt{color:var(--mut);font-size:14px;margin-bottom:14px}
  .xv-in{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .xv-in input{max-width:260px;font-size:18px}
  .xv-fb{margin-top:12px;font-weight:700;min-height:24px}
  .xv-fb.ok{color:var(--ok)}.xv-fb.bad{color:var(--bad)}
  .xv-bar{height:10px;border-radius:99px;background:#eef1f6;overflow:hidden;margin:10px 0}
  .xv-bar i{display:block;height:100%;background:var(--ok)}
  .xv-list{columns:3 220px;font-size:14.5px}
  .xv-list p{margin:0 0 4px;break-inside:avoid}
  .xg h3{margin:16px 0 6px}.xg table{margin:6px 0 10px}.xg ul{margin:6px 0 10px 18px;padding:0}
  .xm{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .xm a{display:block;border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:#fff;text-decoration:none;color:var(--ink)}
  .xm a:hover{border-color:var(--ink)}
  .xm small{display:block;color:var(--mut);font-size:12.5px;font-weight:700;margin-bottom:2px}
  .xm b{display:block;font-family:var(--display)}
  .xm span{font-size:13.5px;color:var(--mut)}
  .xc{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
  .xc .mon h3{text-transform:capitalize;margin:0 0 8px}
  .xc .ev{display:grid;grid-template-columns:30px 1fr;gap:8px;padding:6px 0;border-top:1px solid var(--line)}
  .xc .ev b{font:800 18px var(--display)}
  .xc .ev small{display:block;color:var(--mut);font-size:12.5px}
  .xc .ev.faith b{color:#7b2cbf}.xc .ev.culture b{color:var(--red)}.xc .ev.language b{color:#0b6e99}.xc .ev.class b{color:var(--ok)}
  .xleg{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:8px 0 14px;font-size:13.5px;font-weight:700}
  .xleg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}
  .xcontact{max-width:560px;text-align:center}
  .xcontact .big{font:700 20px var(--display);word-break:break-all;margin:6px 0}
  @media (max-width:600px){.xv-q{font-size:24px}}`;
  document.head.appendChild(css);

  // ---------------- Notas automáticas dos exercícios ----------------
  async function score(info) {
    const m = H.me || await X.me(); if (!m || staff() || !ACC.db) return;
    const key = info.uid + (info.lesson ? "-l" + info.lesson : "") + ":" + info.tag;
    const prev = H.progress[key];
    const item = { s: info.right, m: info.total, best: Math.max(info.right, prev ? prev.best || 0 : 0), at: Date.now(), t: info.title || "", uid: info.uid, lv: info.level || "" };
    H.progress[key] = item;
    try {
      const ref = ACC.db.doc("progress/" + m.id); const snap = await ref.get();
      const base = { name: m.full_name || "", level: m.en_level || "" };
      if (snap.exists) await ref.update({ ...base, scores: { [key]: item } }); else await ref.set({ ...base, scores: { [key]: item } });
    } catch (e) { console.warn("[School] nota não salva", e); }
  }
  const avg10 = list => list.length ? (list.reduce((a, x) => a + (x.m ? x.s / x.m : 0), 0) / list.length * 10).toFixed(1).replace(".", ",") : "—";
  function exerciseTable() {
    const sc = Object.entries(H.progress || {}).map(([k, v]) => ({ k, ...v }));
    if (!sc.length) return `<div class="card"><h2>Exercises</h2><p class="note">When you finish a set of exercises in a unit, your score appears here and your teacher can see it.</p></div>`;
    const by = {}; sc.forEach(x => (by[x.uid] = by[x.uid] || []).push(x));
    const unitName = uid => { const m = uid.match(/^(.*)-u(\d+)$/); const s = m && (SUMMARY[m[1]] || []).find(u => u.n === +m[2]); return s ? `Unit ${s.n} · ${s.title}` : uid; };
    return `<div class="card"><h2>Exercises · ${sc.length} set(s) done · average ${avg10(sc)}</h2><div style="overflow-x:auto"><table><thead><tr><th>Unit</th><th>Sets done</th><th>Last score</th><th>Average (0–10)</th></tr></thead><tbody>
      ${Object.entries(by).map(([uid, list]) => { const last = list.sort((a, b) => b.at - a.at)[0];
        return `<tr><td><a href="#${esc(uid)}">${esc(unitName(uid))}</a></td><td>${list.length}</td><td>${last.s} / ${last.m}</td><td><b>${avg10(list)}</b></td></tr>`; }).join("")}</tbody></table></div></div>`;
  }

  // ---------------- Vistas ----------------
  function verbsView() {
    setNav("verbs"); crumbs([["Verb Practice"]]);
    return `<h1>Verb Practice</h1><p class="note">Irregular verbs: write the past simple or the past participle. Your best score is saved.</p>
      <div class="card xv-card"><div class="row" style="gap:8px;flex-wrap:wrap">
        ${[["past", "Past simple"], ["pp", "Past participle"], ["both", "Both"]].map(([k, t]) => `<button class="opt" data-xvmode="${k}" aria-pressed="${H.verbs.mode === k}">${t}</button>`).join("")}
        <select id="xvSet" style="width:auto">${SETS.map(([n, t]) => `<option value="${n}" ${n === H.verbs.set ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div id="xvBox"></div></div>
      <details class="card"><summary><b>See the list of irregular verbs</b></summary><div class="xv-list" style="margin-top:10px">${IRREG.map(v => `<p><b>${v[0]}</b> – ${v[1]} – ${v[2]} <span class="note">(${esc(v[3])})</span></p>`).join("")}</div></details>`;
  }
  function newVerbQ() {
    const pool = IRREG.slice(0, H.verbs.set);
    const v = pool[Math.floor(Math.random() * pool.length)];
    const mode = H.verbs.mode === "both" ? (Math.random() < .5 ? "past" : "pp") : H.verbs.mode;
    H.verbs.q = { v, mode };
  }
  function drawVerbs(fb) {
    const box = $("#xvBox"); if (!box) return;
    if (!H.verbs.q) newVerbQ();
    const { v, mode } = H.verbs.q; const V = H.verbs;
    const best = (H.progress["verbs:" + V.mode + V.set] || {}).best;
    box.innerHTML = `<div class="xv-pt">${mode === "past" ? "Past simple of…" : "Past participle of…"} <span>(${esc(v[3])})</span></div>
      <div class="xv-q">${esc(v[0])}</div>
      <form class="xv-in" id="xvForm" autocomplete="off"><input id="xvAns" aria-label="Your answer" autocapitalize="off" spellcheck="false" placeholder="${mode === "past" ? "e.g. went" : "e.g. gone"}"><button class="btn">Check</button><button type="button" class="btn alt" data-xvskip="1">Show answer</button></form>
      <div class="xv-fb ${fb ? fb.cls : ""}" role="status">${fb ? fb.html : ""}</div>
      <div class="xv-bar"><i style="width:${V.done ? V.right / V.done * 100 : 0}%"></i></div>
      <p class="note">This round: <b>${V.right} / ${V.done}</b>${V.done >= 10 ? ` · <button class="linkbtn" style="display:inline" data-xvsave="1">Finish round and save</button>` : " · answer 10 to save your score"}${best != null ? ` · Best: ${best} / 10` : ""}</p>
      ${V.wrong.length ? `<p class="note">Review: ${V.wrong.slice(-6).map(w => `<b>${esc(w[0])}</b> – ${esc(w[1])} – ${esc(w[2])}`).join(" · ")}</p>` : ""}`;
    const inp = $("#xvAns"); if (inp && !fb) inp.focus();
  }
  async function grammarView() {
    setNav("grammar"); crumbs([["Grammar"]]);
    const open = staff() ? LEVELS.map(l => l.id) : (ACC.family ? [ACC.family.level, ...(ACC.family.done || []).slice().reverse()] : []);
    const lv = open.includes(H.gramLv) ? H.gramLv : staff() ? "basic-one" : open[0];
    if (!lv) return `<h1>Grammar</h1><div class="card">Your account is not in an English class yet.</div>`;
    H.gramLv = lv;
    return `<h1>Grammar · ${esc(X.lvName(lv))}</h1><p class="note">All the grammar of the class in one place, unit by unit.</p>
      ${open.length > 1 ? `<div class="row" style="margin-bottom:12px"><label class="note" for="xgLv">Class</label><select id="xgLv" style="width:auto">${open.map(id => `<option value="${id}" ${id === lv ? "selected" : ""}>${esc(X.lvName(id))}</option>`).join("")}</select></div>` : ""}
      <div id="xgBox"><p class="note">Loading…</p></div>`;
  }
  async function drawGrammar() {
    const box = $("#xgBox"); if (!box) return; const lv = H.gramLv;
    const units = SUMMARY[lv] || []; const parts = [];
    const tbl = rows => rows && rows.length ? `<div style="overflow-x:auto"><table><tbody>${rows.map(r => `<tr>${[].concat(r).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "";
    for (const s of units) {
      const uid = lv + "-u" + s.n; let u = null; try { u = await openUnit(uid); } catch (e) {}
      if (!u) continue;
      const blocks = [];
      [u.g1, u.g2].filter(Boolean).forEach(g => blocks.push(`<h3>${esc(g.title)}</h3>${(g.explain || []).length ? `<ul>${g.explain.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${tbl(g.table)}${g.note ? `<div class="tip">${esc(g.note)}</div>` : ""}${tbl(g.forms)}`));
      if (u.grammar) blocks.push(`<h3>${esc(u.grammar.title)}</h3>${tbl(u.grammar.rows)}${u.grammar.tip ? `<div class="tip">${esc(u.grammar.tip)}</div>` : ""}`);
      (u.lessons || []).filter(l => l && l.gram).forEach(l => blocks.push(`<h3>${esc(l.gram.title)}</h3><ul>${(l.gram.rules || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`));
      if (!blocks.length && u.kind === "kids" && u.vocab) blocks.push(`<p class="note">This class learns through songs and pictures. Words of the unit:</p><p>${[].concat(u.vocab).map(w => esc(Array.isArray(w) ? w[w.length - 1] : (w.word || w.w || w))).join(" · ")}</p>`);
      if (!blocks.length) continue;
      parts.push(`<details class="card xg" ${parts.length === 0 ? "open" : ""}><summary><b>${s.n ? "Unit " + s.n : "Starter"} · ${esc(s.title)}</b></summary>${blocks.join("")}</details>`);
    }
    if ($("#xgBox")) $("#xgBox").innerHTML = parts.join("") || `<div class="card">The units of this class are not loaded yet. The school management imports them on the Jinas School home page.</div>`;
  }
  async function mediaView() {
    setNav("media"); crumbs([["Videos & Music"]]);
    const open = staff() ? LEVELS.map(l => l.id) : (ACC.family ? [ACC.family.level, ...(ACC.family.done || []).slice().reverse()] : []);
    const lv = open.includes(H.mediaLv) ? H.mediaLv : staff() ? "basic-one" : open[0];
    if (!lv) return `<h1>Videos & Music</h1><div class="card">Your account is not in an English class yet.</div>`;
    H.mediaLv = lv;
    return `<h1>Videos, music & films · ${esc(X.lvName(lv))}</h1><p class="note">Films, series, songs and YouTube videos for each unit. Links open YouTube or a search in a new tab.</p>
      ${open.length > 1 ? `<div class="row" style="margin-bottom:12px"><label class="note" for="xmLv">Class</label><select id="xmLv" style="width:auto">${open.map(id => `<option value="${id}" ${id === lv ? "selected" : ""}>${esc(X.lvName(id))}</option>`).join("")}</select></div>` : ""}
      <div id="xmBox"><p class="note">Loading…</p></div>`;
  }
  const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  async function drawMedia() {
    const box = $("#xmBox"); if (!box) return; const lv = H.mediaLv; const parts = [];
    for (const s of (SUMMARY[lv] || [])) {
      let u = null; try { u = await openUnit(lv + "-u" + s.n); } catch (e) {}
      if (!u) continue;
      const items = [].concat(u.watch || [], (u.videos || []).map(v => ["YouTube", v[1] || v[0], v[2] || "", v[0]]));
      if (u.song && typeof u.song === "string") items.push(["Song", u.song + " song for kids", "Sing along!"]);
      if (!items.length) continue;
      parts.push(`<div class="card"><h2>${s.n ? "Unit " + s.n : "Starter"} · ${esc(s.title)}</h2><div class="xm">${items.map(it => {
        const [kind, title, desc, label] = it; const q = kind === "YouTube" ? title : title + " " + (kind === "Song" ? "" : "trailer");
        return `<a href="${yt(q.trim())}" target="_blank" rel="noopener"><small>${esc(kind)}</small><b>${esc(label || title)}</b><span>${esc(desc || "")}</span></a>`; }).join("")}</div></div>`);
    }
    if ($("#xmBox")) $("#xmBox").innerHTML = parts.join("") || `<div class="card">The units of this class are not loaded yet.</div>`;
  }
  function calendarView() {
    setNav("calendar"); crumbs([["Calendar"]]);
    return `<h1>Calendar</h1><div class="card tint" id="xcNext"></div>
      <div class="xleg"><span><i style="background:#7b2cbf"></i>Christian faith</span><span><i style="background:var(--red)"></i>English-speaking world</span><span><i style="background:#0b6e99"></i>Language</span><span><i style="background:var(--ok)"></i>Our class</span>
        <span style="margin-left:auto"><button class="btn sm alt" data-xcyear="-1" aria-label="Previous year">←</button> <b id="xcY">${H.calYear}</b> <button class="btn sm alt" data-xcyear="1" aria-label="Next year">→</button></span></div>
      <div class="xc" id="xcBox"></div><p class="note">Easter, Pentecost and Thanksgiving are calculated for each year.${staff() ? " Add class events in the Teacher Desk → Calendar." : ""}</p>`;
  }
  function drawCalendar() {
    const box = $("#xcBox"); if (!box) return; const y = H.calYear; const ds = datesFor(y);
    $("#xcY").textContent = y;
    box.innerHTML = [...Array(12).keys()].map(m => `<div class="card mon"><h3>${new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long" })}</h3>${ds.filter(d => d.date.getMonth() === m).map(d => `<div class="ev ${d.type}"><b>${d.date.getDate()}</b><div>${esc(d.title)}<small>${esc(d.desc)}</small></div></div>`).join("") || '<p class="note">—</p>'}</div>`).join("");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const next = datesFor(today.getFullYear()).concat(datesFor(today.getFullYear() + 1)).filter(d => d.date >= today).slice(0, 4);
    $("#xcNext").innerHTML = `<b>Coming up:</b> ${next.map(d => `${d.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${esc(d.title)}`).join(" — ")}`;
  }
  const DEFAULT_CONTACT = { name: "Teacher Fatinha", email: "maaria.160@gmail.com", whatsapp: "", hours: "", note: "Write your name, your class and the unit." };
  function contactView() {
    setNav("contact"); crumbs([["Contact"]]);
    return `<h1>Contact</h1><div id="xctBox"></div>`;
  }
  function drawContact() {
    const box = $("#xctBox"); if (!box) return; const c = { ...DEFAULT_CONTACT, ...(H.contact || {}) };
    const wa = (c.whatsapp || "").replace(/\D/g, "");
    box.innerHTML = `<div class="card xcontact" style="margin:0 auto"><img src="../assets/logo-jinas.png" alt="" style="width:70px"><h2>Any questions?</h2><p>Write to ${esc(c.name)}:</p>
      ${c.email ? `<p class="big"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p><p class="note">If the link does not open your e-mail, copy the address.</p>` : ""}
      ${wa ? `<p class="big"><a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp ${esc(c.whatsapp)}</a></p>` : ""}
      ${c.hours ? `<p><b>When:</b> ${esc(c.hours)}</p>` : ""}${c.note ? `<p class="note">${esc(c.note)}</p>` : ""}</div>`;
  }

  // ---------------- Teacher Desk: Calendário e Contato ----------------
  X.deskTabs.push(["calendar", "📅 Calendar"], ["contact", "✉️ Contact"]);
  X.deskDraw.calendar = box => {
    const ev = H.events.slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    box.innerHTML = `<div class="card"><h2>Add a class event</h2><form class="form" data-xform="event"><div class="hub-row"><label>Date<input type="date" name="date" required></label><label>Class<select name="level">${X.levelOpts("", true)}</select></label></div>
        <input name="title" required maxlength="120" placeholder="Title (e.g. Speaking test, Christmas play)"><input name="text" maxlength="300" placeholder="Details (optional)"><div class="row"><button class="btn">Add to calendar</button></div></form></div>
      <div class="card"><h2>Class events</h2>${ev.map(x => `<p><b>${esc(x.date)}</b> · ${esc(x.title)} <span class="badge">${esc(X.lvName(x.level))}</span> <button class="hub-x" data-hubdel="events/${x.id}">Delete</button></p>`).join("") || '<p class="note">No events yet.</p>'}</div>`;
  };
  X.deskDraw.contact = box => {
    const c = { ...DEFAULT_CONTACT, ...(H.contact || {}) };
    box.innerHTML = `<div class="card"><h2>Contact page</h2><p class="note">What students see in Contact.</p><form class="form" data-xform="contact">
      <label>Name<input name="name" maxlength="80" value="${esc(c.name)}"></label><label>E-mail<input name="email" type="email" maxlength="120" value="${esc(c.email)}"></label>
      <label>WhatsApp (with country code, e.g. +55 13 99999-9999)<input name="whatsapp" maxlength="30" value="${esc(c.whatsapp)}"></label>
      <label>When to contact (optional)<input name="hours" maxlength="120" value="${esc(c.hours)}"></label><label>Note<input name="note" maxlength="200" value="${esc(c.note)}"></label>
      <div class="row"><button class="btn">Save contact</button></div></form></div>`;
  };
  X.deskStudentCols = s => {
    const p = H.allProgress.find(x => x.pid === s.id); const sc = p ? Object.values(p.scores || {}) : [];
    return [sc.length, avg10(sc)];
  };
  X.gradesExtra = () => exerciseTable();

  // ---------------- Dados e eventos ----------------
  X.afterHooks.push(async h => {
    const d = ACC.db;
    if (d && ["grades", "desk", "verbs"].includes(h)) {
      const m = H.me || await X.me();
      if (staff()) X.sub(d.collection("progress"), s => { H.allProgress = s.docs.map(x => ({ pid: x.id, ...x.data() })); X.redraw(); });
      else if (m) X.sub(d.doc("progress/" + m.id), s => { H.progress = s.exists ? { ...(s.data().scores || {}) } : {}; X.redraw(); if (h === "verbs") drawVerbs(); });
    }
    if (d && ["calendar", "desk"].includes(h)) X.sub(d.collection("events"), s => { H.events = s.docs.map(x => ({ id: x.id, ...x.data() })); drawCalendar(); X.redraw(); });
    if (d && ["contact", "desk"].includes(h)) X.sub(d.doc("info/contact"), s => { H.contact = s.exists ? s.data() : null; drawContact(); X.redraw(); });
    if (h === "verbs") drawVerbs();
    if (h === "grammar") drawGrammar();
    if (h === "media") drawMedia();
    if (h === "calendar") drawCalendar();
    if (h === "contact") drawContact();
  });
  Object.assign(EnglishHub.views, { verbs: verbsView, grammar: grammarView, media: mediaView, calendar: calendarView, contact: contactView });
  EnglishHub.score = score;

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-xvmode],[data-xvskip],[data-xvsave],[data-xcyear]"); if (!t) return;
    const V = H.verbs;
    if (t.dataset.xvmode) { V.mode = t.dataset.xvmode; V.q = null; V.right = 0; V.done = 0; document.querySelectorAll("[data-xvmode]").forEach(b => b.setAttribute("aria-pressed", b === t)); drawVerbs(); }
    if (t.dataset.xvskip) { const { v } = V.q; V.done++; V.wrong.push(v); newVerbQ(); drawVerbs({ cls: "bad", html: `${esc(v[0])} – <b>${esc(v[1])}</b> – <b>${esc(v[2])}</b>` }); }
    if (t.dataset.xvsave) { const r = Math.round(V.right / V.done * 10); score({ uid: "verbs", tag: V.mode + V.set, right: r, total: 10, title: "Verb practice" }); const msg = `Saved: ${V.right} / ${V.done} correct.`; V.right = 0; V.done = 0; V.wrong = []; newVerbQ(); drawVerbs({ cls: "ok", html: msg }); }
    if (t.dataset.xcyear) { H.calYear += +t.dataset.xcyear; drawCalendar(); }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "xvSet") { H.verbs.set = +e.target.value; H.verbs.q = null; H.verbs.right = 0; H.verbs.done = 0; drawVerbs(); }
    if (e.target.id === "xgLv") { H.gramLv = e.target.value; route(); }
    if (e.target.id === "xmLv") { H.mediaLv = e.target.value; route(); }
  });
  document.addEventListener("submit", async e => {
    const f = e.target;
    if (f.id === "xvForm") {
      e.preventDefault(); const V = H.verbs; const { v, mode } = V.q; const typed = $("#xvAns").value; if (!typed.trim()) return;
      const ans = mode === "past" ? v[1] : v[2]; const ok = accepts(ans, typed); V.done++;
      if (ok) V.right++; else V.wrong.push(v);
      newVerbQ();
      drawVerbs(ok ? { cls: "ok", html: `Correct! ${esc(v[0])} – ${esc(v[1])} – ${esc(v[2])}` } : { cls: "bad", html: `Not quite. ${esc(v[0])} – <b>${esc(v[1])}</b> – <b>${esc(v[2])}</b>` });
      return;
    }
    if (!f.dataset.xform) return; e.preventDefault();
    const val = n => (f.elements[n] ? f.elements[n].value.trim() : "");
    try {
      if (f.dataset.xform === "event") { await ACC.db.collection("events").add({ date: val("date"), title: val("title"), text: val("text"), level: val("level"), at: Date.now() }); f.reset(); X.toast("hubMsg", true, "Event added."); }
      if (f.dataset.xform === "contact") { await ACC.db.doc("info/contact").set({ name: val("name"), email: val("email"), whatsapp: val("whatsapp"), hours: val("hours"), note: val("note"), at: Date.now() }); X.toast("hubMsg", true, "Contact saved."); }
    } catch (er) { X.toast("hubMsg", false, "This could not be saved. Please try again."); }
  });
})();
