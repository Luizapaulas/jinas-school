# Jinas School · English & Español

Plataforma única com as duas escolas (**English w/ School** e **Español con School**) e uma área de login com e-mail e senha.

```
index.html          → portal: entrar, criar conta, recuperar senha, escolher idioma
english/            → plataforma de inglês
espanol/            → plataforma de espanhol (index.html + data/A1…C1.js)
assets/config.js    → onde você cola as chaves do Supabase
assets/auth.js      → login compartilhado e proteção das páginas
assets/claude-shim.js → liga as plataformas ao banco do Supabase (temas, tarefas, turmas, notas)
supabase/schema.sql → tabelas e regras de segurança do banco
```

O site é estático (só HTML/JS) e fica hospedado de graça no **GitHub Pages**. O login e o banco de dados ficam no **Supabase** (plano grátis).

---

## 1. Criar o projeto no Supabase (≈ 5 min)

1. Entre em <https://supabase.com>, crie uma conta e clique em **New project**.
2. Dê um nome (ex.: `jinas-school`), crie uma senha do banco e escolha a região **South America (São Paulo)**.
3. Quando o projeto abrir, vá em **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
4. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public** key

## 2. Colar as chaves no site

Abra `assets/config.js` (dá pra editar direto no GitHub, no ícone de lápis) e troque:

```js
SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
SUPABASE_ANON_KEY: "COLE_AQUI_A_ANON_PUBLIC_KEY",
```

> A *anon key* pode ficar pública. Quem protege os dados são as regras (RLS) do `schema.sql`: cada aluno só enxerga o que é dele. **Nunca** coloque a *service_role key* no site.

## 3. Publicar no GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e clique em **Save**.
3. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## 4. Avisar o Supabase qual é o endereço do site

Em **Authentication → URL Configuration**:

- **Site URL**: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`
- **Redirect URLs**: adicione o mesmo endereço.

Isso faz os links de confirmação de e-mail e de "esqueci minha senha" voltarem para o seu site.

## 5. Funções: aluno, professor e administração

Toda conta nova nasce como **aluno**. Para dar a primeira conta de administração, rode no **SQL Editor** (troque o e-mail):

```sql
update public.profiles set role = 'admin' where email = 'diretora@exemplo.com';
```

Depois disso, quem é da administração muda a função das outras contas direto na página inicial do site (tabela **Contas da escola**).

| Função | O que pode |
|---|---|
| Aluno(a) | estudar, comentar no mural, entregar tarefas |
| Professor(a) | painel da professora no Español (criar alunos, temas, tarefas, dar notas) e Teacher Desk no English |
| Administração | tudo do professor + gestão do English + mudar funções |

### Español: como dar acesso a um aluno
1. O aluno cria a conta na página inicial.
2. A professora entra no **Panel de la profesora → Alumnos** e cria um usuário, senha e nível para ele.
3. O aluno abre o Español e digita esse usuário e senha uma vez. A partir daí só vê o nível dele.

### English: códigos de família e de professor
O English usa códigos (ex.: `LION-AB12-CD34`) criados pela gestão no **Management Desk**. As lições do English são **criptografadas** e só abrem com as chaves da escola (ver abaixo).

> ⚠️ **Chaves do English.** As chaves que destravam as unidades estavam guardadas no banco do site original no Claude, não no arquivo da página. Sem elas, a gestão vê a mensagem *"The school database is not set up yet"* e as unidades não abrem. É preciso importar essas chaves para o Supabase (tabela `site_docs`, documentos `admin/owner` e `school/keys`).

## Opções úteis no Supabase

- **Authentication → Providers → Email → Confirm email**: deixe ligado para exigir confirmação por e-mail, ou desligue para o aluno entrar direto após o cadastro.
- **Authentication → Users**: ver, bloquear ou apagar alunos.
- **Table Editor → site_docs**: ver os dados das plataformas (alunos, temas, tarefas, notas, comentários).

## Testar no computador

Sem configurar o Supabase, o portal mostra um aviso e as plataformas abrem em modo de teste, sem login e sem salvar nada no banco. Para rodar localmente:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```
