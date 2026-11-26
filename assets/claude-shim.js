// =============================================================
//  Jinas School — ponte entre as plataformas e o Supabase
//
//  As plataformas English e Español foram feitas para rodar dentro do
//  Claude e usam window.claude.use("db" | "user" | ...). Este arquivo
//  recria essa mesma interface usando o Supabase, para que o código
//  original funcione sem mudanças no GitHub Pages.
//
//  Uso: <script src="../assets/claude-shim.js" data-site="english"></script>
//  (depois de supabase-js, config.js e auth.js)
// =============================================================
(function () {
  const SITE = document.currentScript && document.currentScript.dataset.site;
  const S = window.School;
  if (!S || !S.sb || !SITE) return; // sem Supabase configurado: plataforma roda em modo de teste
  const sb = S.sb;
  const TABLE = "site_docs";

  const err = (code, message) => Object.assign(new Error(message), { code });
  const segs = p => String(p).split("/").filter(Boolean);
  function checkPath(p, wantEven) {
    const s = segs(p);
    if (!s.length || s.some(x => !/^[A-Za-z0-9_\-.~:@+]+$/.test(x) || x === "." || x === ".."))
      throw new TypeError("Invalid path: " + p);
    if ((s.length % 2 === 0) !== wantEven)
      throw new TypeError((wantEven ? "Document" : "Collection") + " path needs an " + (wantEven ? "even" : "odd") + " number of segments: " + p);
    return s.join("/");
  }
  const parentOf = p => segs(p).slice(0, -1).join("/");
  const lastOf = p => segs(p).slice(-1)[0];
  const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const meta = { fromCache: false, hasPendingWrites: false };

  function docSnap(path, data) {
    const d = data == null ? undefined : clone(data);
    return { id: lastOf(path), exists: d !== undefined, data: () => clone(d), metadata: meta };
  }

  function deepMerge(target, patch) {
    for (const [k, v] of Object.entries(patch)) {
      if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k]))
        deepMerge(target[k], v);
      else target[k] = clone(v);
    }
    return target;
  }

  // ---------- leitura/escrita no Supabase ----------
  async function readDoc(path) {
    const { data, error } = await sb.from(TABLE).select("data").eq("site", SITE).eq("path", path).maybeSingle();
    if (error) throw err("unavailable", error.message);
    return data ? data.data : undefined;
  }
  async function readColl(coll) {
    const { data, error } = await sb.from(TABLE).select("doc_id,data").eq("site", SITE).eq("coll", coll).order("doc_id").limit(5000);
    if (error) throw err("unavailable", error.message);
    return data || [];
  }
  async function writeDoc(path, body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw err("invalid_argument", "Document body must be an object");
    const { error } = await sb.from(TABLE).upsert(
      { site: SITE, path, coll: parentOf(path), doc_id: lastOf(path), data: body, updated_at: new Date().toISOString() },
      { onConflict: "site,path" }
    );
    // RLS recusou = sem permissão: o código original espera "invalid_argument"
    if (error) throw err(/row-level security|permission|42501/i.test(error.message + error.code) ? "invalid_argument" : "unavailable", error.message);
    notify(path);
    syncProfile(path, body);
  }
  // Español: nível mudado no painel da professora -> atualiza também a conta do aluno
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function syncProfile(path, body) {
    if (SITE !== "espanol") return;
    const [c, id] = segs(path);
    if (c !== "students" || !UUID.test(id || "")) return;
    sb.from("profiles").update({ es_level: body ? body.level || null : null }).eq("id", id).then(() => {}, () => {});
  }
  async function removeDoc(path) {
    const { error } = await sb.from(TABLE).delete().eq("site", SITE).eq("path", path);
    if (error) throw err("invalid_argument", error.message);
    notify(path);
    syncProfile(path, null);
  }

  // ---------- consultas (filtros e ordenação feitos no navegador) ----------
  const OPS = {
    "==": (a, b) => JSON.stringify(a) === JSON.stringify(b),
    "!=": (a, b) => JSON.stringify(a) !== JSON.stringify(b),
    "<": (a, b) => a < b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, ">=": (a, b) => a >= b,
    "in": (a, b) => Array.isArray(b) && b.some(x => JSON.stringify(x) === JSON.stringify(a)),
    "not-in": (a, b) => Array.isArray(b) && !b.some(x => JSON.stringify(x) === JSON.stringify(a)),
    "array-contains": (a, b) => Array.isArray(a) && a.some(x => JSON.stringify(x) === JSON.stringify(b))
  };
  function runQuery(rows, q) {
    let r = rows.filter(row => q.filters.every(([f, op, v]) => row.data && f in row.data && OPS[op](row.data[f], v)));
    if (q.order) {
      const [f, dir] = q.order, m = dir === "desc" ? -1 : 1;
      r = r.slice().sort((a, b) => {
        const x = a.data?.[f], y = b.data?.[f];
        if (x === undefined && y === undefined) return 0;
        if (x === undefined) return 1;
        if (y === undefined) return -1;
        return x < y ? -m : x > y ? m : 0;
      });
    }
    if (q.lim) r = r.slice(0, q.lim);
    return r;
  }
  function querySnap(rows, prev) {
    const docs = rows.map(r => docSnap(r.doc_id, r.data));
    const prevIds = prev ? prev.map(d => d.id) : [];
    return {
      docs, size: docs.length, empty: !docs.length, metadata: meta,
      docChanges: () => docs.map((d, i) => ({ type: prevIds.includes(d.id) ? "modified" : "added", doc: d, oldIndex: prevIds.indexOf(d.id), newIndex: i }))
    };
  }

  // ---------- assinaturas "ao vivo" ----------
  const listeners = new Set();
  function notify(path) {
    const coll = parentOf(path);
    listeners.forEach(l => { if (l.path === path || l.coll === coll) l.refresh(); });
  }
  function listen(l) {
    listeners.add(l);
    l.refresh();
    return () => listeners.delete(l);
  }
  // Mudanças feitas por outras pessoas: Realtime do Supabase + conferência a cada 30 s
  try {
    sb.channel("docs-" + SITE)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: "site=eq." + SITE }, p => {
        const row = p.new && p.new.path ? p.new : p.old;
        if (row && row.path) notify(row.path); else listeners.forEach(l => l.refresh());
      })
      .subscribe();
  } catch (e) { /* Realtime é opcional */ }
  setInterval(() => { if (!document.hidden) listeners.forEach(l => l.refresh()); }, 30000);

  // ---------- referências no formato do Claude/Firestore ----------
  function makeQuery(coll, q) {
    const self = {
      where: (f, op, v) => { if (!OPS[op]) throw new TypeError("Unknown operator " + op); return makeQuery(coll, { ...q, filters: [...q.filters, [f, op, v]] }); },
      orderBy: (f, dir = "asc") => makeQuery(coll, { ...q, order: [f, dir] }),
      limit: n => makeQuery(coll, { ...q, lim: n }),
      get: async () => querySnap(runQuery(await readColl(coll), q)),
      onSnapshot(next, onErr) {
        let prev = null, busy = false, again = false, dead = false;
        const l = {
          coll,
          async refresh() {
            if (dead) return; if (busy) { again = true; return; } busy = true;
            try { const snap = querySnap(runQuery(await readColl(coll), q), prev); prev = snap.docs; next(snap); }
            catch (e) { console.warn("[School] leitura falhou", e); }
            busy = false; if (again) { again = false; l.refresh(); }
          }
        };
        const off = listen(l);
        return () => { dead = true; off(); };
      }
    };
    return self;
  }
  function collection(path) {
    const coll = checkPath(path, false);
    return Object.assign(makeQuery(coll, { filters: [], order: null, lim: 0 }), {
      path: coll,
      doc: id => doc(coll + "/" + (id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)))),
      add: async data => { const r = collection(coll).doc(); await r.set(data); return r; }
    });
  }
  function doc(path) {
    const p = checkPath(path, true);
    return {
      id: lastOf(p), path: p,
      get: async () => docSnap(p, await readDoc(p)),
      set: data => writeDoc(p, clone(data)),
      async update(data) {
        const cur = await readDoc(p);
        if (cur === undefined) throw err("invalid_argument", "Document does not exist: " + p);
        await writeDoc(p, deepMerge(cur, data));
      },
      delete: () => removeDoc(p),
      async acquire(opts) { return { acquired: true, holder: opts && opts.holder, expiresAt: new Date(Date.now() + 30000).toISOString() }; },
      onSnapshot(next) {
        let dead = false, busy = false, again = false;
        const l = {
          path: p,
          async refresh() {
            if (dead) return; if (busy) { again = true; return; } busy = true;
            try { next(docSnap(p, await readDoc(p))); } catch (e) { console.warn("[School] leitura falhou", e); }
            busy = false; if (again) { again = false; l.refresh(); }
          }
        };
        const off = listen(l);
        return () => { dead = true; off(); };
      },
      collection: sub => collection(p + "/" + sub)
    };
  }

  // ---------- capacidades ----------
  let cache = {};
  async function makeUser() {
    const s = await S.session(); if (!s) return null;
    const p = await S.profile();
    const staff = p && (p.role === "teacher" || p.role === "admin");
    return Object.freeze({
      id: async () => s.user.id,
      me: async () => ({ id: s.user.id, name: p?.full_name || s.user.email, email: s.user.email }),
      isOwner: () => !!staff,           // professor(a) = dono(a) da plataforma
      canEdit: async () => !!staff,
      can: async () => true,
      profiles: async ids => {
        const { data } = await sb.from("profiles").select("id,full_name").in("id", ids || []);
        const out = {}; (data || []).forEach(r => out[r.id] = { id: r.id, name: r.full_name || "" }); return out;
      },
      search: async () => []
    });
  }
  async function makeDb() {
    const s = await S.session(); if (!s) return null;
    return Object.freeze({ doc, collection });
  }

  // English: tudo pela conta, como no Español.
  //  - Alunos: abrem TODAS as unidades da turma da conta (en_level). As chaves de cada
  //    turma ficam em levelkeys/<turma>, que só os alunos daquela turma conseguem ler.
  //  - Professor e administração: entram direto no Teacher Desk (sem código PROF).
  if (SITE === "english") {
    window.SchoolLevelKeys = async (keys) => {
      try {
        const by = {};
        Object.entries(keys || {}).forEach(([uid, k]) => { const lv = uid.replace(/-u\d+$/, ""); (by[lv] = by[lv] || {})[uid] = k; });
        for (const [lv, lk] of Object.entries(by)) {
          const cur = await readDoc("levelkeys/" + lv);
          if (JSON.stringify((cur && cur.keys) || {}) !== JSON.stringify(lk)) await writeDoc("levelkeys/" + lv, { keys: lk, at: Date.now() });
        }
      } catch (e) { console.warn("[School] não foi possível publicar as chaves das turmas", e); }
    };
    window.SchoolFamily = async () => {
      const p = await S.profile();
      if (!p || p.role !== "student" || !p.en_level) return null;
      const { done } = S.enPath(p.en_level); const keys = {};
      for (const lv of [...done, p.en_level]) { const d = await readDoc("levelkeys/" + lv); Object.assign(keys, (d && d.keys) || {}); }
      return { id: "acct-" + p.id, code: "", level: p.en_level, done, next: S.enPath(p.en_level).next, child: (p.full_name || "").split(" ")[0] || "Student", keys };
    };
    window.SchoolStaff = async () => {
      const p = await S.profile();
      if (!p || (p.role !== "teacher" && p.role !== "admin")) return null;
      const o = await readDoc("admin/owner");
      if (!o || !o.dk) return null;   // dados do English ainda não importados
      return { role: p.role === "admin" ? "mgmt" : "teacher", name: p.full_name || p.email, email: p.email || "", dk: o.dk };
    };
    try { localStorage.removeItem("jinasFamilyCode"); localStorage.removeItem("jinasStaff"); } catch (e) {}
  }

  window.claude = Object.freeze({
    use(name) {
      if (!cache[name]) {
        cache[name] = name === "db" ? makeDb()
          : name === "user" ? makeUser()
          : Promise.resolve(null); // tts, sample, assets...: as plataformas usam o modo alternativo delas
      }
      return cache[name];
    }
  });
})();
