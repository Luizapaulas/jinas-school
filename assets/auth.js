// =============================================================
//  Jinas School — login compartilhado (Supabase Auth)
//  Usado pelo portal (index.html) e pelas plataformas /english e /espanol.
//  Requer: supabase-js (CDN) e assets/config.js carregados antes.
// =============================================================
(function () {
  const cfg = window.SCHOOL_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("SEU-PROJETO");
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  // Caminho até a raiz do site (funciona em GitHub Pages com subpasta /nome-do-repo/)
  const scriptSrc = document.currentScript && document.currentScript.src;
  const ROOT = scriptSrc ? new URL("../", scriptSrc).href : "./";

  async function session() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  async function profile() {
    const s = await session();
    if (!s) return null;
    const { data } = await sb.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
    return data || { id: s.user.id, full_name: s.user.user_metadata?.full_name || s.user.email, role: "student" };
  }

  // Protege uma página: sem login, volta para o portal.
  async function requireLogin() {
    if (!sb) { console.warn("[School] Supabase não configurado: login desativado (modo de teste)."); return null; }
    const s = await session();
    if (!s) {
      location.replace(ROOT + "index.html?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
      return new Promise(() => {}); // interrompe a página
    }
    return s;
  }

  async function signOut() {
    if (sb) await sb.auth.signOut();
    location.href = ROOT + "index.html";
  }

  // Barra fixa no topo das plataformas: nome do aluno, trocar idioma, sair
  async function mountBar(current) {
    const p = await profile();
    const bar = document.createElement("div");
    bar.id = "school-bar";
    bar.innerHTML = `
      <style>
        #school-bar{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:8px;align-items:center;
          background:#14213d;color:#fff;border-radius:999px;padding:6px 8px 6px 14px;font:600 13px Inter,system-ui,sans-serif;
          box-shadow:0 6px 24px rgba(0,0,0,.25)}
        #school-bar a,#school-bar button{background:#fff;color:#14213d;border:0;border-radius:999px;padding:5px 12px;
          font:700 12.5px Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer}
        #school-bar .me{opacity:.9;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      </style>
      <span class="me"></span>
      <a href="${ROOT}${current === "english" ? "espanol" : "english"}/index.html">${current === "english" ? "Español" : "English"}</a>
      <a href="${ROOT}index.html">Início</a>
      <button type="button">Sair</button>`;
    bar.querySelector(".me").textContent = p ? (p.full_name || "Aluno") : "Modo de teste";
    bar.querySelector("button").onclick = signOut;
    document.body.appendChild(bar);
  }

  window.School = { sb, configured, ROOT, session, profile, requireLogin, signOut, mountBar };
})();
