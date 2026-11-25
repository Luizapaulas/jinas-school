// =============================================================
//  English w/ School — Class Board, Assignments, Grades, News e Teacher Desk
//  Mesmo funcionamento do Español: o aluno vê a turma da conta dele,
//  comenta no mural, entrega tarefas e recebe notas; professor e
//  administração gerenciam tudo no Teacher Desk.
//
//  Este arquivo roda depois do script principal do English e usa as
//  funções e variáveis dele (ACC, LV, LEVELS, esc, $, setNav, crumbs, UNSUB).
//  Dados (site "english"): themes, comments/<uid>, tasks, subs/<uid>, announcements, mural
// =============================================================
(function () {
  const H = { tab: "students", students: [], themes: [], comments: [], tasks: [], subs: [], news: [], mural: [], me: null };
  const db = () => ACC.db;
  const staff = () => !!ACC.role;
  const lvName = id => (id === "all" ? "All classes" : (LV[id] && LV[id].name) || id || "—");
  const when = t => t ? new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";
  const fmtGrade = g => g == null || g === "" ? "—" : String(g).replace(".", ",");
  const levelOpts = (sel, withAll) => (withAll ? `<option value="all">All classes</option>` : "") +
    LEVELS.map(l => `<option value="${l.id}" ${l.id === sel ? "selected" : ""}>${esc(l.name)}</option>`).join("");
  const sub = (ref, fn) => { try { UNSUB.push(ref.onSnapshot(fn, () => {})); } catch (e) {} };
  const toast = (id, ok, text) => { const m = $("#" + id); if (m) { m.className = "msg " + (ok ? "ok" : "err"); m.textContent = text; } };
  const myLevel = () => H.me && H.me.en_level;
  const forMe = x => staff() || x.level === "all" || x.level === myLevel();

  async function me() { if (!H.me && window.School) { H.me = await School.profile(); } return H.me; }

  const css = document.createElement("style");
  css.textContent = `
  .hub-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 16px}
  .hub-tabs button{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font:600 14px var(--display)}
  .hub-tabs button[aria-pressed="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}
  .hub-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end}
  .hub-theme .cm{border-top:1px solid var(--line);padding:8px 0;font-size:14.5px}
  .hub-theme .cm b{font-family:var(--display)}
  .hub-theme .cm small{color:var(--mut);margin-left:6px}
  .hub-x{background:none;border:0;color:var(--bad);font-weight:700;font-size:12.5px;text-decoration:underline;padding:0 0 0 6px}
  .hub-task .st{font-size:13px;font-weight:700}
  .hub-grade{font:800 22px var(--display);color:var(--red)}
  #who .linkbtn{display:none}
  .level.hub-mine{box-shadow:0 0 0 3px var(--gold);order:-1}
  .hub-badge{align-self:flex-start;margin-top:4px}
  @media (max-width:860px){
    /* menu vira uma faixa rolável e o conteúdo aparece logo */
    #side{display:flex!important;flex-direction:row!important;align-items:center;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;position:sticky!important;top:var(--sbh,0)!important;z-index:35}
    #side::-webkit-scrollbar{display:none}
    #side .brand{padding:8px 10px;border:0;flex:none;display:flex}
    #side .brand .logo{width:34px;height:34px;border-radius:9px}
    #side .brand b,#side .brand span span{display:none}
    #side nav{flex-direction:row!important;flex-wrap:nowrap!important;padding:6px 8px 6px 0;gap:4px;margin:0}
    #side nav button{white-space:nowrap;padding:8px 12px}
    #side .side-foot{display:none}
    #top{position:static!important;padding:8px 16px;min-height:0}
    main{padding:18px 16px 40px}
    /* player de áudio compacto */
    .player .aistripe{font-size:10.5px;padding:3px 6px}
    .player .in{gap:8px!important;padding:8px 12px!important;flex-wrap:nowrap!important;align-items:center}
    .player .now b{font-size:13.5px}
    .player .pbtn{width:40px;height:40px;flex:none}
    .player .now{flex:1 1 auto}
    .player .now .ai-tag,.player .speed{display:none}
    .player .chips{flex:none}
    .player .chips button[data-s="0.9"]{display:none}
    body{padding-bottom:84px}
  }`;
  document.head.appendChild(css);

  // ---------------- Vistas ----------------
  async function boardView() {
    setNav("board"); crumbs([["Class Board"]]); await me();
    return `<h1>Class Board</h1><p class="note">Every week your teacher posts a topic. Read, think and comment in English. Reply to your classmates too: it's a conversation!</p>
      ${!db() ? '<div class="card">The Class Board needs you to be signed in.</div>' : '<div id="hubThemes"><p class="note">Loading…</p></div>'}`;
  }
  async function tasksView() {
    setNav("tasks"); crumbs([["Assignments"]]); await me();
    return `<h1>Assignments</h1><p class="note">Write your answer and send it to your teacher. You can send it again until it is graded.</p>
      ${!db() ? '<div class="card">Assignments need you to be signed in.</div>' : '<div id="hubTasks"><p class="note">Loading…</p></div>'}`;
  }
  async function gradesView() {
    setNav("grades"); crumbs([["My Grades"]]); await me();
    if (staff()) return `<h1>My Grades</h1><div class="card">Teachers grade assignments in the <button class="linkbtn" style="display:inline" data-go="desk">Teacher Desk</button>.</div>`;
    return `<h1>My Grades</h1><p class="note">Grades and feedback from your teacher.</p><div id="hubGrades"><p class="note">Loading…</p></div>`;
  }
  async function newsView() {
    setNav("news"); crumbs([["News Board"]]); await me();
    const title = staff() ? "News Board" : `News Board · ${esc(lvName(myLevel()))}`;
    return `<h1>${title}</h1><p class="note">Messages from Jinas School${staff() ? '. Post news in the <button class="linkbtn" style="display:inline" data-go="desk">Teacher Desk</button>.' : " for your class."}</p><div id="hubNews"><p class="note">Loading…</p></div>`;
  }
  async function deskView() {
    setNav("desk"); crumbs([["Teacher Desk"]]); await me();
    if (!staff()) return `<h1>Teacher Desk</h1><div class="card">This area is for teachers and the school management.</div>`;
    const tabs = [["students", "👩‍🎓 Students"], ["board", "💬 Class Board"], ["tasks", "📎 Assignments"], ["subs", "📨 Submissions & grades"], ["news", "📣 Class news"], ["mural", "📌 Teachers' mural"]];
    return `<h1>${ACC.role === "mgmt" ? "Management & Teacher Desk" : "Teacher Desk"}</h1>
      <p class="note">Students and classes are managed on the <a href="../index.html">Jinas School home page</a> (Create access). All units of each class are open to its students.</p>
      <div class="hub-tabs">${tabs.map(([k, t]) => `<button data-hubtab="${k}" aria-pressed="${H.tab === k}">${t}</button>`).join("")}</div>
      <div id="hubMsg" role="status" style="margin-bottom:10px"></div><div id="hubDesk"></div>`;
  }

  // ---------------- Desenho ----------------
  function drawThemes() {
    const box = $("#hubThemes"); if (!box) return;
    const list = H.themes.filter(forMe).sort((a, b) => b.at - a.at);
    if (!list.length) { box.innerHTML = `<div class="card">There are no topics yet. ${staff() ? "Create the first one in the Teacher Desk." : "Your teacher will post the first one soon."}</div>`; return; }
    const uid = H.me && H.me.id;
    box.innerHTML = list.map(t => {
      const cs = H.comments.filter(c => c.theme === t.id).sort((a, b) => a.at - b.at);
      return `<div class="card hub-theme"><span class="badge">${esc(lvName(t.level))}</span> <small class="note">${when(t.at)}</small><h3>${esc(t.title)}</h3><p style="white-space:pre-wrap">${esc(t.text)}</p>
        ${cs.map(c => `<div class="cm"><b>${esc(c.name)}</b><small>${when(c.at)}</small>${c.pid === uid || staff() ? `<button class="hub-x" data-hubdelc="${c.pid}|${c.cid}">Delete</button>` : ""}<div style="white-space:pre-wrap">${esc(c.text)}</div></div>`).join("") || '<p class="note">No comments yet. Be the first!</p>'}
        <form class="form" data-hubcomment="${t.id}" style="margin-top:8px"><textarea required rows="2" maxlength="2000" placeholder="Write your comment in English…"></textarea><div class="row"><button class="btn sm">Post</button></div></form></div>`;
    }).join("");
  }
  function drawTasks() {
    const box = $("#hubTasks"); if (!box) return;
    const list = H.tasks.filter(forMe).sort((a, b) => b.at - a.at);
    if (!list.length) { box.innerHTML = `<div class="card">There are no assignments yet.</div>`; return; }
    const mine = (H.subs.find(s => s.pid === (H.me && H.me.id)) || {}).items || {};
    box.innerHTML = list.map(t => {
      const s = mine[t.id]; const graded = s && s.grade != null && s.grade !== "";
      const status = graded ? `<span class="badge ok">Grade ${esc(fmtGrade(s.grade))}</span>` : s ? `<span class="badge">Sent ${when(s.at)} · waiting for grade</span>` : `<span class="badge lock">Not sent</span>`;
      return `<div class="card hub-task"><div class="row" style="justify-content:space-between"><span class="badge">${esc(lvName(t.level))}</span>${status}</div>
        <h3>${esc(t.title)}</h3><p style="white-space:pre-wrap">${esc(t.text)}</p>${t.due ? `<p class="note">Due: ${esc(t.due)}</p>` : ""}
        ${graded && s.fb ? `<div class="tip"><b>Teacher's feedback:</b> ${esc(s.fb)}</div>` : ""}
        ${staff() ? "" : graded ? `<p class="note">Your answer:</p><p style="white-space:pre-wrap">${esc(s.text)}</p>` :
          `<form class="form" data-hubsend="${t.id}"><textarea required rows="5" maxlength="8000" placeholder="Write your answer here…">${s ? esc(s.text) : ""}</textarea><div class="row"><button class="btn sm">${s ? "Send again" : "Send to my teacher"}</button></div></form>`}</div>`;
    }).join("");
  }
  function drawGrades() {
    const box = $("#hubGrades"); if (!box) return;
    const mine = (H.subs.find(s => s.pid === (H.me && H.me.id)) || {}).items || {};
    const rows = Object.entries(mine).map(([id, s]) => ({ id, ...s, title: s.title || (H.tasks.find(t => t.id === id) || {}).title || "Assignment" })).sort((a, b) => b.at - a.at);
    const graded = rows.filter(r => r.grade != null && r.grade !== "" && !isNaN(parseFloat(String(r.grade).replace(",", "."))));
    const avg = graded.length ? (graded.reduce((a, r) => a + parseFloat(String(r.grade).replace(",", ".")), 0) / graded.length).toFixed(1).replace(".", ",") : "—";
    box.innerHTML = `<div class="grid3" style="margin-bottom:14px"><div class="card"><div class="hub-grade">${rows.length}</div><span class="note">assignments sent</span></div>
        <div class="card"><div class="hub-grade">${graded.length}</div><span class="note">graded</span></div><div class="card"><div class="hub-grade">${avg}</div><span class="note">average grade</span></div></div>
      <div class="card"><table><thead><tr><th>Assignment</th><th>Sent</th><th>Grade</th><th>Feedback</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${esc(r.title)}</td><td>${when(r.at)}</td><td><b>${esc(fmtGrade(r.grade))}</b></td><td>${esc(r.fb || "")}</td></tr>`).join("") || '<tr><td colspan="4">You have not sent any assignment yet.</td></tr>'}</tbody></table></div>`;
  }
  function drawNews() {
    const box = $("#hubNews"); if (!box) return;
    const list = H.news.filter(forMe).sort((a, b) => b.at - a.at);
    box.innerHTML = list.map(n => `<div class="news"><time>${when(n.at)} · ${esc(lvName(n.level))}</time><h4>${esc(n.title)}</h4><p style="white-space:pre-wrap;margin:0">${esc(n.text)}</p></div>`).join("") || '<p class="note">No news yet.</p>';
  }
  function drawDesk() {
    const box = $("#hubDesk"); if (!box) return;
    const t = H.tab;
    const lvSel = (name, all) => `<select name="${name}">${levelOpts("", all)}</select>`;
    if (t === "students") {
      const by = {}; H.students.forEach(s => (by[s.en_level || "—"] = by[s.en_level || "—"] || []).push(s));
      const subsOf = id => Object.values((H.subs.find(x => x.pid === id) || {}).items || {});
      box.innerHTML = `<div class="card"><h2>Students (${H.students.length})</h2><p class="note">To add a student or change their class, use <b>Create access</b> and <b>School accounts</b> on the <a href="../index.html">home page</a>.</p>
        <div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>E-mail</th><th>Class</th><th>Sent</th><th>Graded</th><th>Average</th></tr></thead><tbody>
        ${LEVELS.filter(l => by[l.id]).concat(by["—"] ? [{ id: "—", name: "No class" }] : []).map(l => by[l.id].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")).map(s => {
          const it = subsOf(s.id); const g = it.filter(x => x.grade != null && x.grade !== "" && !isNaN(parseFloat(String(x.grade).replace(",", "."))));
          const avg = g.length ? (g.reduce((a, x) => a + parseFloat(String(x.grade).replace(",", ".")), 0) / g.length).toFixed(1).replace(".", ",") : "—";
          return `<tr><td>${esc(s.full_name || "—")}</td><td>${esc(s.email || "")}</td><td>${esc(l.name)}</td><td>${it.length}</td><td>${g.length}</td><td>${avg}</td></tr>`;
        }).join("")).join("") || '<tr><td colspan="6">No students in English classes yet.</td></tr>'}</tbody></table></div></div>`;
    } else if (t === "board") {
      box.innerHTML = `<div class="card"><h2>New weekly topic</h2><form class="form" data-hubform="theme"><input name="title" required maxlength="200" placeholder="Topic title"><textarea name="text" required rows="4" maxlength="4000" placeholder="Text, questions to discuss…"></textarea>
        <div class="row">${lvSel("level", true)}<button class="btn">Post topic</button></div></form></div>
        <div class="card"><h2>Published topics</h2>${H.themes.sort((a, b) => b.at - a.at).map(x => `<p><b>${esc(x.title)}</b> <span class="badge">${esc(lvName(x.level))}</span> <small class="note">${when(x.at)} · ${H.comments.filter(c => c.theme === x.id).length} comment(s)</small> <button class="hub-x" data-hubdel="themes/${x.id}">Delete</button></p>`).join("") || '<p class="note">No topics yet.</p>'}</div>`;
    } else if (t === "tasks") {
      box.innerHTML = `<div class="card"><h2>New assignment</h2><form class="form" data-hubform="task"><input name="title" required maxlength="200" placeholder="Assignment title"><textarea name="text" required rows="4" maxlength="4000" placeholder="Instructions…"></textarea>
        <div class="hub-row"><label>Class${lvSel("level", true)}</label><label>Due date (optional)<input name="due" maxlength="40" placeholder="e.g. 30 Nov"></label><button class="btn">Publish assignment</button></div></form></div>
        <div class="card"><h2>Published assignments</h2>${H.tasks.sort((a, b) => b.at - a.at).map(x => `<p><b>${esc(x.title)}</b> <span class="badge">${esc(lvName(x.level))}</span> <small class="note">${when(x.at)}${x.due ? " · due " + esc(x.due) : ""}</small> <button class="hub-x" data-hubdel="tasks/${x.id}">Delete</button></p>`).join("") || '<p class="note">No assignments yet.</p>'}</div>`;
    } else if (t === "subs") {
      const rows = H.subs.flatMap(s => Object.entries(s.items || {}).map(([tid, it]) => ({ pid: s.pid, name: s.name, level: s.level, tid, ...it }))).sort((a, b) => b.at - a.at);
      box.innerHTML = `<div class="card"><h2>Submissions & grades</h2>${rows.map(r => `<div class="ex ${r.grade != null && r.grade !== "" ? "ok" : ""}"><div class="row" style="justify-content:space-between"><b>${esc(r.name)} · ${esc(lvName(r.level))}</b><small class="note">${when(r.at)}</small></div>
          <h4 style="margin:6px 0">${esc(r.title || (H.tasks.find(t => t.id === r.tid) || {}).title || "Assignment")}</h4><p style="white-space:pre-wrap">${esc(r.text)}</p>
          <form class="hub-row" data-hubgrade="${r.pid}|${r.tid}"><label>Grade (0–10)<input name="grade" value="${esc(r.grade ?? "")}" maxlength="5" required></label><label style="grid-column:span 2">Feedback<input name="fb" value="${esc(r.fb || "")}" maxlength="1000"></label><button class="btn sm">Save grade</button></form></div>`).join("") || '<p class="note">No submissions yet.</p>'}</div>`;
    } else if (t === "news") {
      box.innerHTML = `<div class="card"><h2>Post class news</h2><form class="form" data-hubform="news"><input name="title" required maxlength="200" placeholder="Title"><textarea name="text" required rows="3" maxlength="4000" placeholder="Message to the class…"></textarea>
        <div class="row">${lvSel("level", true)}<button class="btn">Post news</button></div></form></div>
        <div class="card"><h2>Posted news</h2>${H.news.sort((a, b) => b.at - a.at).map(x => `<p><b>${esc(x.title)}</b> <span class="badge">${esc(lvName(x.level))}</span> <small class="note">${when(x.at)}</small> <button class="hub-x" data-hubdel="announcements/${x.id}">Delete</button></p>`).join("") || '<p class="note">No news yet.</p>'}</div>`;
    } else if (t === "mural") {
      box.innerHTML = `<div class="card"><h2>📌 Teachers' mural</h2><p class="note">Ideas, materials, reminders and good news for the team. Only staff can see it.</p><form class="form" data-hubform="mural"><textarea name="text" required rows="3" maxlength="2000" placeholder="Write to the team…"></textarea><div class="row"><button class="btn">Post</button></div></form>
        ${H.mural.sort((a, b) => b.at - a.at).map(x => `<div class="news"><time>${esc(x.name || "")} · ${when(x.at)}</time><p style="white-space:pre-wrap;margin:4px 0 0">${esc(x.text)}</p><button class="hub-x" data-hubdel="mural/${x.id}">Delete</button></div>`).join("") || '<p class="note">Nothing posted yet.</p>'}</div>`;
    }
  }
  const redraw = () => { drawThemes(); drawTasks(); drawGrades(); drawNews(); drawDesk(); };

  // ---------------- Dados ao vivo ----------------
  // A turma do aluno aparece primeiro, destacada, em "My Classes" e na página inicial
  function myClassFirst() {
    const lv = ACC.family && ACC.family.level; if (!lv || staff()) return;
    document.querySelectorAll(".levels").forEach(box => {
      const mine = box.querySelector(`.level[data-go="${lv}"]`); if (!mine) return;
      box.prepend(mine); mine.classList.add("hub-mine");
      if (!mine.querySelector(".hub-badge")) { const b = document.createElement("span"); b.className = "badge ok hub-badge"; b.textContent = "Your class"; mine.appendChild(b); }
    });
  }

  function after(h) {
    if (h === "levels" || h === "home") myClassFirst();
    if (!["board", "tasks", "grades", "news", "desk"].includes(h) || !db()) return;
    const d = db();
    sub(d.collection("themes"), s => { H.themes = s.docs.map(x => ({ id: x.id, ...x.data() })); redraw(); });
    sub(d.collection("comments"), s => { H.comments = s.docs.flatMap(x => Object.entries(x.data().items || {}).map(([cid, c]) => ({ pid: x.id, cid, ...c }))); redraw(); });
    sub(d.collection("tasks"), s => { H.tasks = s.docs.map(x => ({ id: x.id, ...x.data() })); redraw(); });
    sub(d.collection("announcements"), s => { H.news = s.docs.map(x => ({ id: x.id, ...x.data() })); redraw(); });
    if (staff()) {
      sub(d.collection("subs"), s => { H.subs = s.docs.map(x => ({ pid: x.id, ...x.data() })); redraw(); });
      sub(d.collection("mural"), s => { H.mural = s.docs.map(x => ({ id: x.id, ...x.data() })); redraw(); });
      if (window.School && School.sb) School.sb.from("profiles").select("id,full_name,email,en_level,role").eq("role", "student").then(({ data }) => { H.students = (data || []).filter(p => p.en_level); redraw(); });
    } else if (H.me) {
      sub(d.doc("subs/" + H.me.id), s => { H.subs = s.exists ? [{ pid: H.me.id, ...s.data() }] : []; redraw(); });
    }
    redraw();
  }

  // ---------------- Ações ----------------
  const fail = (id, e) => toast(id, false, e && e.code === "invalid_argument" ? "You don't have permission to do this." : "This could not be saved. Please try again.");
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-hubtab],[data-hubdel],[data-hubdelc]"); if (!t) return;
    if (t.dataset.hubtab) { H.tab = t.dataset.hubtab; document.querySelectorAll("[data-hubtab]").forEach(b => b.setAttribute("aria-pressed", b === t)); drawDesk(); return; }
    if (t.dataset.hubdel) { try { await db().doc(t.dataset.hubdel).delete(); } catch (er) { console.warn(er); } return; }
    if (t.dataset.hubdelc) {
      const [pid, cid] = t.dataset.hubdelc.split("|");
      try { const ref = db().doc("comments/" + pid); const s = await ref.get(); if (!s.exists) return; const d = structuredClone(s.data()); delete d.items[cid]; await ref.set(d); } catch (er) { console.warn(er); }
    }
  });
  document.addEventListener("submit", async e => {
    const f = e.target; const ds = f.dataset;
    if (!(ds.hubform || ds.hubcomment || ds.hubsend || ds.hubgrade)) return;
    e.preventDefault(); const btn = f.querySelector("button"); if (btn) btn.disabled = true;
    const val = n => (f.elements[n] ? f.elements[n].value.trim() : "");
    const m = await me(); const name = staff() ? (ACC.staff && ACC.staff.name) || (m && m.full_name) || "Teacher" : (m && m.full_name) || "Student";
    try {
      if (ds.hubform === "theme") { await db().collection("themes").add({ title: val("title"), text: val("text"), level: val("level"), at: Date.now() }); f.reset(); toast("hubMsg", true, "Topic posted."); }
      if (ds.hubform === "task") { await db().collection("tasks").add({ title: val("title"), text: val("text"), level: val("level"), due: val("due"), at: Date.now() }); f.reset(); toast("hubMsg", true, "Assignment published."); }
      if (ds.hubform === "news") { await db().collection("announcements").add({ title: val("title"), text: val("text"), level: val("level"), at: Date.now() }); f.reset(); toast("hubMsg", true, "News posted."); }
      if (ds.hubform === "mural") { await db().collection("mural").add({ name, email: (m && m.email) || "", text: val("text"), at: Date.now() }); f.reset(); }
      if (ds.hubcomment) {
        const text = f.querySelector("textarea").value.trim(); if (!text) return;
        const ref = db().doc("comments/" + m.id); const s = await ref.get(); const cid = "c" + Date.now().toString(36);
        const item = { theme: ds.hubcomment, text: text.slice(0, 2000), at: Date.now(), name };
        if (s.exists) await ref.update({ items: { [cid]: item } }); else await ref.set({ items: { [cid]: item } });
        f.reset();
      }
      if (ds.hubsend) {
        const text = f.querySelector("textarea").value.trim(); if (!text) return;
        const task = H.tasks.find(x => x.id === ds.hubsend) || {};
        const ref = db().doc("subs/" + m.id); const s = await ref.get();
        const item = { text, title: task.title || "", at: Date.now(), grade: null, fb: "" };
        const base = { name: m.full_name || "", level: m.en_level || "" };
        if (s.exists) await ref.update({ ...base, items: { [ds.hubsend]: item } }); else await ref.set({ ...base, items: { [ds.hubsend]: item } });
      }
      if (ds.hubgrade) {
        const [pid, tid] = ds.hubgrade.split("|");
        await db().doc("subs/" + pid).update({ items: { [tid]: { grade: val("grade"), fb: val("fb") } } });
        toast("hubMsg", true, "Grade saved.");
      }
    } catch (er) { fail("hubMsg", er); }
    if (btn) btn.disabled = false;
  });

  window.EnglishHub = { views: { board: boardView, tasks: tasksView, grades: gradesView, news: newsView, desk: deskView }, after };
})();
