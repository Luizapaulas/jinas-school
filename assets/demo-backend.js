// Modo de demonstração: usado só enquanto o Supabase não está configurado em assets/config.js.
// Imita o login e o banco dentro do navegador; nada sai deste computador.
// In-browser mock of supabase-js (localStorage) emulating auth + the SQL triggers
(function () {
  const load = () => JSON.parse(localStorage.getItem("MOCKDB") || '{"profiles":[],"site_docs":[],"invites":[],"users":[]}');
  const save = db => localStorage.setItem("MOCKDB", JSON.stringify(db));
  const me = () => JSON.parse(localStorage.getItem("MOCKME") || "null");
  function syncEs(db, id, name, email, level) {
    if (!level) return;
    const up = (path, coll, data) => { const i = db.site_docs.findIndex(r => r.site === "espanol" && r.path === path); const row = { site: "espanol", path, coll, doc_id: id, data }; if (i >= 0) { if (coll === "students") db.site_docs[i].data = { ...db.site_docs[i].data, name, level }; } else db.site_docs.push(row); };
    up("students/" + id, "students", { name, user: email, level, created: Date.now() });
    up("links/" + id, "links", { key: id, at: Date.now() });
  }
  class Q {
    constructor(t, persist) { this.t = t; this.f = []; this.op = "select"; this.ord = null; this.lim = 0; this.single = false; }
    select() { return this; }
    eq(c, v) { this.f.push(r => r[c] === v); return this; }
    in(c, vs) { this.f.push(r => vs.includes(r[c])); return this; }
    order(c, o) { this.ord = [c, o && o.ascending === false ? -1 : 1]; return this; }
    limit(n) { this.lim = n; return this; }
    maybeSingle() { this.single = true; return this; }
    insert(row) { this.op = "insert"; this.row = row; return this; }
    upsert(row, opt) { this.op = "upsert"; this.row = row; this.keys = (opt && opt.onConflict || "id").split(","); return this; }
    update(row) { this.op = "update"; this.row = row; return this; }
    delete() { this.op = "delete"; return this; }
    then(res, rej) {
      try {
        const db = load(); const tab = db[this.t] = db[this.t] || [];
        if (this.op === "insert") { [].concat(this.row).forEach(r => tab.push(r)); save(db); return res({ error: null }); }
        if (this.op === "upsert") {
          [].concat(this.row).forEach(row => { const i = tab.findIndex(r => this.keys.every(k => r[k] === row[k])); if (i >= 0) tab[i] = row; else tab.push(row); });
          save(db); return res({ error: null });
        }
        let rows = tab.filter(r => this.f.every(f => f(r)));
        if (this.op === "delete") { db[this.t] = tab.filter(r => !rows.includes(r)); save(db); return res({ error: null }); }
        if (this.op === "update") {
          rows.forEach(r => { const old = r.es_level; Object.assign(r, this.row); if (this.t === "profiles" && "es_level" in this.row && r.es_level !== old) { if (r.es_level) syncEs(db, r.id, r.full_name, r.email, r.es_level); else db.site_docs = db.site_docs.filter(d => !(d.site === "espanol" && (d.path === "students/" + r.id || d.path === "links/" + r.id))); } });
          save(db); return res({ error: null });
        }
        if (this.ord) rows.sort((a, b) => (a[this.ord[0]] > b[this.ord[0]] ? 1 : -1) * this.ord[1]);
        if (this.lim) rows = rows.slice(0, this.lim);
        rows = JSON.parse(JSON.stringify(rows));
        res({ data: this.single ? rows[0] || null : rows, error: null });
      } catch (e) { rej(e); }
    }
  }
  const sess = u => u ? { user: { id: u.id, email: u.email, user_metadata: {} } } : null;
  window.SupabaseDemo = {
    createClient: (url, key, opts) => {
      if (window.SupabaseDemoSeed) window.SupabaseDemoSeed();
      const persist = !(opts && opts.auth && opts.auth.persistSession === false);
      return {
        auth: {
          getSession: async () => ({ data: { session: persist ? sess(me()) : null } }),
          signInWithPassword: async ({ email, password }) => {
            const u = load().users.find(x => x.email === email.toLowerCase() && x.password === password);
            if (!u) return { error: { message: "Invalid login credentials" } };
            localStorage.setItem("MOCKME", JSON.stringify({ id: u.id, email: u.email })); return { data: {}, error: null };
          },
          signUp: async ({ email, password, options }) => {
            const db = load(); email = email.toLowerCase();
            if (db.users.some(u => u.email === email)) return { data: { user: {} }, error: null }; // obfuscated
            const inv = db.invites.find(i => i.email === email);
            if (!inv && db.profiles.length) return { error: { message: "Database error saving new user" } };
            const id = crypto.randomUUID();
            db.users.push({ id, email, password });
            if (inv) {
              db.profiles.push({ id, full_name: inv.full_name, email, role: inv.role, es_level: inv.es_level, en_level: inv.en_level, en_code: inv.en_code, must_change_password: true, created_at: new Date().toISOString() });
              db.invites = db.invites.filter(i => i.email !== email); syncEs(db, id, inv.full_name, email, inv.es_level);
            } else db.profiles.push({ id, full_name: options?.data?.full_name || "", email, role: "admin", must_change_password: false, created_at: new Date().toISOString() });
            save(db); return { data: { user: { id } }, error: null };
          },
          updateUser: async ({ password }) => { const db = load(); const u = db.users.find(x => x.id === me().id); u.password = password; save(db); return { error: null }; },
          resetPasswordForEmail: async () => ({ error: null }),
          signOut: async () => localStorage.removeItem("MOCKME"),
          onAuthStateChange: () => ({ data: {} })
        },
        from: t => new Q(t),
        channel: () => ({ on() { return this; }, subscribe() { return this; } })
      };
    }
  };
})();

// ---- dados de exemplo da demonstração (criados só quando o modo demo é usado) ----
window.SupabaseDemoSeed = (function () {
  try { if (localStorage.getItem("MOCKDB")) return; } catch (e) { return; }
  const A = "aaaaaaaa-0000-4000-8000-000000000001", T = "cccccccc-0000-4000-8000-000000000003", S = "bbbbbbbb-0000-4000-8000-000000000002", N = "dddddddd-0000-4000-8000-000000000004";
  const now = Date.now(), d = n => now - n * 86400000;
  const db = {
    users: [{ id: A, email: "diretora@jinas.demo", password: "demo1234" }, { id: T, email: "professora@jinas.demo", password: "demo1234" },
            { id: S, email: "aluna@jinas.demo", password: "demo1234" }, { id: N, email: "novo@jinas.demo", password: "provisoria1" }],
    profiles: [
      { id: A, full_name: "Lia Campos", email: "diretora@jinas.demo", role: "admin", must_change_password: false, created_at: "2026-11-01" },
      { id: T, full_name: "Fatinha Vieira", email: "professora@jinas.demo", role: "teacher", must_change_password: false, created_at: "2026-11-02" },
      { id: S, full_name: "Ana Silva", email: "aluna@jinas.demo", role: "student", en_level: "basic-one", es_level: "A1", must_change_password: false, created_at: "2026-11-03" },
      { id: N, full_name: "Pedro Rocha", email: "novo@jinas.demo", role: "student", en_level: "juniors-two", must_change_password: true, created_at: "2026-11-20" }],
    invites: [],
    site_docs: [
      { site: "espanol", path: "students/" + S, coll: "students", doc_id: S, data: { name: "Ana Silva", user: "aluna@jinas.demo", level: "A1", created: d(20) } },
      { site: "espanol", path: "links/" + S, coll: "links", doc_id: S, data: { key: S, at: d(20) } },
      { site: "espanol", path: "themes/t1", coll: "themes", doc_id: "t1", data: { title: "Mi comida favorita", text: "¿Cuál es tu comida favorita? ¿Quién la prepara en tu casa?", level: "todos", at: d(2) } },
      { site: "espanol", path: "tasks/k1", coll: "tasks", doc_id: "k1", data: { title: "Preséntate", text: "Escribe 5 frases sobre ti: nombre, edad, ciudad, familia y gustos.", level: "A1", at: d(3) } },
      { site: "english", path: "themes/t1", coll: "themes", doc_id: "t1", data: { title: "My weekend", text: "What did you do last weekend? Tell us in 2 or 3 sentences.", level: "basic-one", at: d(1) } },
      { site: "english", path: "comments/" + T, coll: "comments", doc_id: T, data: { items: { c1: { theme: "t1", text: "I visited my family and we made a big lunch!", at: d(1), name: "Fatinha Vieira" } } } },
      { site: "english", path: "tasks/k1", coll: "tasks", doc_id: "k1", data: { title: "My family", text: "Write 50 words about your family.", level: "basic-one", due: "30 Nov", at: d(2) } },
      { site: "english", path: "subs/" + S, coll: "subs", doc_id: S, data: { name: "Ana Silva", level: "basic-one", items: { k0: { title: "Hello, I'm Ana", text: "Hello! My name is Ana. I am from Guarujá.", at: d(9), grade: "9,0", fb: "Very good, Ana!" } } } },
      { site: "english", path: "announcements/a1", coll: "announcements", doc_id: "a1", data: { title: "Welcome to English w/ School!", text: "Classes start on Monday. See you there!", level: "all", at: d(4) } }
    ]
  };
  try { localStorage.setItem("MOCKDB", JSON.stringify(db)); } catch (e) {}
});
