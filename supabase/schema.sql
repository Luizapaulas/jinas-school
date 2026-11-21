-- =============================================================
--  Jinas School — banco de dados (rode uma vez no Supabase > SQL Editor)
-- =============================================================

-- 1) Perfis: um por usuário (criado automaticamente no cadastro)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text,
  role       text not null default 'student' check (role in ('student','teacher','admin')),
  created_at timestamptz not null default now()
);

-- 3) Cria o perfil sozinho quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Função auxiliar: o usuário atual é professor?
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 5) Segurança (RLS): cada aluno só vê e altera o que é dele;
--    professores podem ver todas as contas.
alter table public.profiles enable row level security;

drop policy if exists "perfil: ver o próprio ou professor" on public.profiles;
create policy "perfil: ver o próprio ou professor" on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

drop policy if exists "perfil: editar o próprio nome" on public.profiles;
create policy "perfil: editar o próprio nome" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "perfil: administração muda funções" on public.profiles;
create policy "perfil: administração muda funções" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 6) Dados internos das plataformas (temas, tarefas, mural, turmas, notas...)
--    Cada linha é um "documento" no caminho path (ex.: "themes/abc").
create table if not exists public.site_docs (
  site       text not null check (site in ('english','espanol')),
  path       text not null,
  coll       text not null,
  doc_id     text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (site, path)
);
create index if not exists site_docs_coll on public.site_docs (site, coll);

-- Regras de acesso (as mesmas das plataformas originais):
--  'any'   = qualquer pessoa logada
--  'own'   = o próprio aluno (documento com o id dele) ou professor
--  'staff' = professor(a) ou administração
--  'admin' = só administração
create or replace function public.doc_rule(p_site text, p_path text, p_write boolean)
returns text language sql immutable as $$
  select case
    when p_site = 'espanol' then case split_part(p_path, '/', 1)
      when 'students' then case when p_write then 'staff' else 'any' end
      when 'themes'   then case when p_write then 'staff' else 'any' end
      when 'tasks'    then case when p_write then 'staff' else 'any' end
      when 'comments' then case when p_write then 'own'   else 'any' end
      when 'links'    then 'own'
      when 'progress' then 'own'
      when 'subs'     then 'own'
      else case when p_write then 'staff' else 'any' end end
    else case split_part(p_path, '/', 1)
      when 'admin'    then 'admin'
      when 'school'   then 'staff'
      when 'mural'    then 'staff'
      when 'teachers' then case when p_write then 'admin' else 'staff' end
      else case when p_write then 'staff' else 'any' end end
  end
$$;

create or replace function public.can_doc(p_site text, p_path text, p_write boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and case public.doc_rule(p_site, p_path, p_write)
    when 'any'   then true
    when 'own'   then split_part(p_path, '/', 2) = auth.uid()::text or public.is_teacher()
    when 'staff' then public.is_teacher()
    when 'admin' then public.is_admin()
    else false end
$$;

alter table public.site_docs enable row level security;
drop policy if exists "docs: ler" on public.site_docs;
create policy "docs: ler" on public.site_docs for select using (public.can_doc(site, path, false));
drop policy if exists "docs: criar" on public.site_docs;
create policy "docs: criar" on public.site_docs for insert with check (public.can_doc(site, path, true));
drop policy if exists "docs: alterar" on public.site_docs;
create policy "docs: alterar" on public.site_docs for update using (public.can_doc(site, path, true)) with check (public.can_doc(site, path, true));
drop policy if exists "docs: apagar" on public.site_docs;
create policy "docs: apagar" on public.site_docs for delete using (public.can_doc(site, path, true));

-- Atualização ao vivo (mural, comentários, notas aparecem sem recarregar)
do $$ begin
  alter publication supabase_realtime add table public.site_docs;
exception when others then null; end $$;

-- =============================================================
--  Para transformar alguém em PROFESSOR, rode (troque o e-mail):
--  update public.profiles set role = 'teacher' where email = 'professor@exemplo.com';
--  Para ADMINISTRAÇÃO (gestão da escola no English):
--  update public.profiles set role = 'admin' where email = 'diretora@exemplo.com';
-- =============================================================
