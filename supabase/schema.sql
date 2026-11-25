-- =============================================================
--  Jinas School — banco de dados
--  Rode este arquivo inteiro UMA vez no Supabase > SQL Editor.
--  (Pode rodar de novo depois: ele não apaga dados.)
-- =============================================================

-- 1) Perfis: um por conta
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  email                 text,
  role                  text not null default 'student',
  es_level              text,
  en_level              text,
  en_code               text,
  must_change_password  boolean not null default false,
  created_by            uuid,
  created_at            timestamptz not null default now()
);
alter table public.profiles add column if not exists es_level text;
alter table public.profiles add column if not exists en_level text;
alter table public.profiles add column if not exists en_code text;
alter table public.profiles add column if not exists must_change_password boolean not null default false;
alter table public.profiles add column if not exists created_by uuid;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student','teacher','admin'));
alter table public.profiles drop constraint if exists profiles_es_level_check;
alter table public.profiles add constraint profiles_es_level_check check (es_level in ('A1','A2','B1','B2','C1'));

-- 2) Convites: professor/administração cadastra a pessoa aqui antes de criar a conta.
--    Sem convite ninguém consegue criar conta (exceto a primeira, que vira administração).
create table if not exists public.invites (
  email       text primary key,
  full_name   text,
  role        text not null default 'student' check (role in ('student','teacher','admin')),
  es_level    text,
  en_level    text,
  en_code     text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

-- 3) Dados internos das plataformas (temas, tarefas, mural, turmas, notas...)
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

-- 4) Funções auxiliares
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('teacher','admin'), false);
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false);
$$;

-- Liga o aluno do Español à conta dele (sem segunda senha)
create or replace function public.sync_espanol(p_id uuid, p_name text, p_email text, p_level text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_level is null then return; end if;
  insert into public.site_docs (site, path, coll, doc_id, data)
  values ('espanol', 'students/' || p_id, 'students', p_id::text,
          jsonb_build_object('name', coalesce(p_name, ''), 'user', coalesce(p_email, ''), 'level', p_level,
                             'created', (extract(epoch from now()) * 1000)::bigint))
  on conflict (site, path) do update
    set data = public.site_docs.data || jsonb_build_object('name', coalesce(p_name, ''), 'level', p_level), updated_at = now();
  insert into public.site_docs (site, path, coll, doc_id, data)
  values ('espanol', 'links/' || p_id, 'links', p_id::text,
          jsonb_build_object('key', p_id::text, 'at', (extract(epoch from now()) * 1000)::bigint))
  on conflict (site, path) do nothing;
end $$;

-- 5) Conta criada: usa o convite (ou vira administração se for a primeira conta)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where email = lower(new.email);
  if found then
    insert into public.profiles (id, full_name, email, role, es_level, en_level, en_code, must_change_password, created_by)
    values (new.id, inv.full_name, lower(new.email), inv.role, nullif(inv.es_level, ''), nullif(inv.en_level, ''),
            nullif(inv.en_code, ''), true, inv.created_by)
    on conflict (id) do nothing;
    delete from public.invites where email = inv.email;
    perform public.sync_espanol(new.id, inv.full_name, lower(new.email), nullif(inv.es_level, ''));
  elsif not exists (select 1 from public.profiles) then
    insert into public.profiles (id, full_name, email, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), lower(new.email), 'admin');
  else
    raise exception 'Cadastro somente por convite da escola';
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que cada pessoa mude a própria função ou turmas
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id; new.email := old.email; new.created_at := old.created_at;
  if public.is_admin() then
    if new.id = auth.uid() then new.role := old.role; end if;   -- ninguém tira a própria administração
    return new;
  end if;
  if public.is_teacher() and new.id <> auth.uid() and old.role = 'student' then
    new.role := 'student'; return new;                         -- professor só mexe em alunos
  end if;
  if new.id = auth.uid() then
    new.role := old.role; new.es_level := old.es_level; new.en_level := old.en_level; new.created_by := old.created_by;
    if old.en_code is not null then new.en_code := old.en_code; end if;   -- o aluno só salva o código do English uma vez
    if old.must_change_password = false then new.must_change_password := false; end if;
    return new;
  end if;
  raise exception 'Sem permissão';
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Mudou o nível de espanhol na página inicial -> atualiza a plataforma
create or replace function public.profile_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.es_level is distinct from old.es_level then
    if new.es_level is null then
      delete from public.site_docs where site = 'espanol' and path in ('students/' || new.id, 'links/' || new.id);
    else
      perform public.sync_espanol(new.id, new.full_name, new.email, new.es_level);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists on_profile_changed on public.profiles;
create trigger on_profile_changed after update on public.profiles
  for each row execute function public.profile_changed();

-- 6) Regras dos dados das plataformas (as mesmas dos sites originais)
--  'any' = qualquer conta logada | 'own' = o próprio aluno ou professor
--  'staff' = professor ou administração | 'admin' = só administração
--  'level' = alunos daquela turma do English (chaves das unidades liberadas)
create or replace function public.doc_rule(p_site text, p_path text, p_write boolean)
returns text language sql immutable as $$
  select case
    when p_site = 'espanol' then case split_part(p_path, '/', 1)
      when 'students' then case when p_write then 'staff' else 'any' end
      when 'themes'   then case when p_write then 'staff' else 'any' end
      when 'tasks'    then case when p_write then 'staff' else 'any' end
      when 'comments' then case when p_write then 'own'   else 'any' end
      when 'links'    then case when p_write then 'staff' else 'own' end
      when 'progress' then 'own'
      when 'subs'     then 'own'
      else case when p_write then 'staff' else 'any' end end
    else case split_part(p_path, '/', 1)
      when 'admin'    then 'admin'
      when 'levelkeys' then case when p_write then 'staff' else 'level' end
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
    when 'level' then public.is_teacher()
                      or exists (select 1 from public.profiles where id = auth.uid() and en_level = split_part(p_path, '/', 2))
    when 'staff' then public.is_teacher()
    when 'admin' then public.is_admin()
    else false end
$$;

-- 7) Segurança (RLS)
alter table public.profiles  enable row level security;
alter table public.invites   enable row level security;
alter table public.site_docs enable row level security;

drop policy if exists "perfil: ver o próprio ou professor" on public.profiles;
create policy "perfil: ver o próprio ou professor" on public.profiles
  for select using (id = auth.uid() or public.is_teacher());
drop policy if exists "perfil: editar o próprio nome" on public.profiles;
drop policy if exists "perfil: administração muda funções" on public.profiles;
drop policy if exists "perfil: editar" on public.profiles;
create policy "perfil: editar" on public.profiles
  for update using (id = auth.uid() or public.is_teacher());   -- o gatilho guard_profile limita o que cada um muda

drop policy if exists "convite: ver" on public.invites;
create policy "convite: ver" on public.invites for select using (public.is_teacher());
drop policy if exists "convite: criar" on public.invites;
create policy "convite: criar" on public.invites for insert
  with check (public.is_admin() or (public.is_teacher() and role = 'student'));
drop policy if exists "convite: apagar" on public.invites;
create policy "convite: apagar" on public.invites for delete using (public.is_teacher());

drop policy if exists "docs: ler" on public.site_docs;
create policy "docs: ler" on public.site_docs for select using (public.can_doc(site, path, false));
drop policy if exists "docs: criar" on public.site_docs;
create policy "docs: criar" on public.site_docs for insert with check (public.can_doc(site, path, true));
drop policy if exists "docs: alterar" on public.site_docs;
create policy "docs: alterar" on public.site_docs for update using (public.can_doc(site, path, true)) with check (public.can_doc(site, path, true));
drop policy if exists "docs: apagar" on public.site_docs;
create policy "docs: apagar" on public.site_docs for delete using (public.can_doc(site, path, true));

-- 8) Atualização ao vivo (mural, comentários e notas aparecem sem recarregar)
do $$ begin
  alter publication supabase_realtime add table public.site_docs;
exception when others then null; end $$;

-- =============================================================
--  A PRIMEIRA conta criada vira administração automaticamente.
--  Crie-a em Authentication > Users > Add user (marque "Auto Confirm User").
-- =============================================================
