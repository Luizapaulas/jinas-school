// =============================================================
//  Jinas School — login compartilhado (Supabase Auth)
//  Usado pelo portal (index.html) e pelas plataformas /english e /espanol.
//  Requer: supabase-js (CDN) e assets/config.js carregados antes.
// =============================================================
(function () {
  const cfg = window.SCHOOL_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("SEU-PROJETO");
  const demo = !configured && !!window.SupabaseDemo;   // sem Supabase configurado: modo de demonstração
  const lib = configured ? window.supabase : window.SupabaseDemo;
  const sb = lib ? lib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  // cliente separado (para criar contas sem desconectar quem está cadastrando)
  const newClient = opts => lib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, opts);

  // Caminho até a raiz do site (funciona em GitHub Pages com subpasta /nome-do-repo/)
  const scriptSrc = document.currentScript && document.currentScript.src;
  const ROOT = scriptSrc ? new URL("../", scriptSrc).href : "./";

  async function session() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  let _profile = null;
  async function profile(force) {
    if (_profile && !force) return _profile;
    const s = await session();
    if (!s) return null;
    const { data } = await sb.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
    if (data) { _profile = data; try { if (data.es_level) localStorage.setItem("jinasEsLevel", data.es_level); else localStorage.removeItem("jinasEsLevel"); } catch (e) {} }
    return data || { id: s.user.id, full_name: s.user.user_metadata?.full_name || s.user.email, role: "student" };
  }

  // Protege uma página: sem login, volta para o portal.
  async function requireLogin() {
    if (!sb) return null;
    const s = await session();
    const p = s && await profile();
    if (!s || (p && p.must_change_password)) {
      location.replace(ROOT + "index.html?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
      return new Promise(() => {}); // interrompe a página
    }
    return s;
  }

  async function signOut() {
    if (sb) await sb.auth.signOut();
    location.href = ROOT + "index.html";
  }

  // Barra da escola no topo das plataformas: logo, troca de plataforma, conta e sair
  async function mountBar(current) {
    const p = await profile();
    const staff = p && (p.role === "teacher" || p.role === "admin");
    const has = { english: staff || !p || !!p.en_level, espanol: staff || !p || !!p.es_level };
    const name = p ? (p.full_name || p.email || "") : "Modo de teste";
    const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "J";
    const bar = document.createElement("header");
    bar.id = "school-bar";
    bar.setAttribute("aria-label", "Jinas School");
    bar.innerHTML = `
      <style>
        :root{--sbh:48px}
        body{padding-top:var(--sbh)!important}
        #side{top:var(--sbh)!important}
        #top{top:var(--sbh)!important}
        #school-bar{position:fixed;top:0;left:0;right:0;height:var(--sbh);z-index:9999;display:flex;align-items:center;gap:14px;padding:0 14px 0 12px;
          background:#14213d;color:#fff;font:500 14px Inter,system-ui,sans-serif;box-shadow:0 1px 0 rgba(255,255,255,.08)}
        #school-bar a{color:inherit;text-decoration:none}
        #school-bar .sb-home{display:flex;align-items:center;gap:8px;font:700 15px Poppins,system-ui,sans-serif;white-space:nowrap}
        #school-bar .sb-home img{width:26px;height:30px;object-fit:contain;background:#fff;border-radius:7px;padding:2px}
        #school-bar .sb-switch{display:flex;background:rgba(255,255,255,.1);border-radius:999px;padding:3px;gap:2px}
        #school-bar .sb-switch a{padding:5px 14px;border-radius:999px;font:600 13.5px Poppins,system-ui,sans-serif;color:#cfd6e6}
        #school-bar .sb-switch a[aria-current="page"]{background:#fff;color:#14213d}
        #school-bar .sb-switch a:not([aria-current]):hover{color:#fff}
        #school-bar .sb-me{margin-left:auto;display:flex;align-items:center;gap:10px;min-width:0}
        #school-bar .sb-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;color:#e6ebf5}
        #school-bar .sb-av{width:30px;height:30px;border-radius:50%;background:#ffc300;color:#14213d;display:grid;place-items:center;font:700 12.5px Poppins,sans-serif;flex:none}
        #school-bar button{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.3);border-radius:9px;padding:5px 12px;font:600 13px Inter,sans-serif;cursor:pointer}
        #school-bar button:hover{background:rgba(255,255,255,.1)}
        #school-bar :focus-visible{outline:3px solid #ffc300;outline-offset:2px}
        @media (max-width:640px){
          #school-bar{gap:10px;padding:0 10px}
          #school-bar .sb-home span,#school-bar .sb-name{display:none}
          #school-bar .sb-switch a{padding:5px 11px}
        }
      </style>
      <a class="sb-home" href="${ROOT}index.html" title="Voltar para minhas turmas"><img src="${ROOT}assets/logo-jinas.png" alt=""><span>Jinas School</span></a>
      <nav class="sb-switch" aria-label="Plataformas">
        ${has.english ? `<a href="${ROOT}english/index.html" ${current === "english" ? 'aria-current="page"' : ""}>English</a>` : ""}
        ${has.espanol ? `<a href="${ROOT}espanol/index.html" ${current === "espanol" ? 'aria-current="page"' : ""}>Español</a>` : ""}
      </nav>
      <div class="sb-me"><span class="sb-name"></span><span class="sb-av" aria-hidden="true"></span><button type="button">Sair</button></div>`;
    bar.querySelector(".sb-name").textContent = name;
    bar.querySelector(".sb-av").textContent = initials;
    bar.querySelector("button").onclick = signOut;
    document.body.prepend(bar);
  }

  // Caminho de níveis do English: concluídos (antes do atual) e próximos (depois)
  const EN_PATHS = {
    kids:  ["babies-one", "babies-two", "juniors-one", "juniors-two", "younger-two", "younger-three", "intermediate", "advanced", "master"],
    young: ["younger-one", "younger-two", "younger-three", "intermediate", "advanced", "master"],
    adult: ["basic-one", "basic-two", "intermediate", "advanced", "master"]
  };
  function enPath(cur) {
    if (!cur) return { done: [], next: [] };
    const path = /^(babies|juniors)/.test(cur) ? EN_PATHS.kids : /^younger/.test(cur) ? EN_PATHS.young : EN_PATHS.adult;
    const i = path.indexOf(cur); if (i < 0) return { done: [], next: [] };
    return { done: path.slice(0, i), next: path.slice(i + 1) };
  }
  const ES_LEVELS = ["A1", "A2", "B1", "B2", "C1"];
  function esPath(cur) { const i = ES_LEVELS.indexOf(cur); return i < 0 ? { done: [], next: [] } : { done: ES_LEVELS.slice(0, i), next: ES_LEVELS.slice(i + 1) }; }

  window.School = { sb, configured, demo, newClient, enPath, esPath, ROOT, session, profile, requireLogin, signOut, mountBar };
})();
