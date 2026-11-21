-- =============================================================
--  Jinas School — banco de dados (rode uma vez no Supabase > SQL Editor)
-- =============================================================

-- 1) Perfis: um por usuário (criado automaticamente no cadastro)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text,
  role       text not null default 'student' check (role in ('student','teacher')),
  created_at timestamptz not null default now()
);

-- 2) Progresso: um registro por aluno e por plataforma
create table if not exists public.progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null check (platform in ('english','espanol')),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, platform)
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
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

-- 5) Segurança (RLS): cada aluno só vê e altera o que é dele;
--    professores podem ver todos os alunos e progressos.
alter table public.profiles enable row level security;
alter table public.progress enable row level security;

drop policy if exists "perfil: ver o próprio ou professor" on public.profiles;
create policy "perfil: ver o próprio ou professor" on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

drop policy if exists "perfil: editar o próprio nome" on public.profiles;
create policy "perfil: editar o próprio nome" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "progresso: ver o próprio ou professor" on public.progress;
create policy "progresso: ver o próprio ou professor" on public.progress
  for select using (user_id = auth.uid() or public.is_teacher());

drop policy if exists "progresso: gravar o próprio" on public.progress;
create policy "progresso: gravar o próprio" on public.progress
  for insert with check (user_id = auth.uid());

drop policy if exists "progresso: atualizar o próprio" on public.progress;
create policy "progresso: atualizar o próprio" on public.progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================
--  Para transformar alguém em PROFESSOR, rode (troque o e-mail):
--  update public.profiles set role = 'teacher' where email = 'professor@exemplo.com';
-- =============================================================
