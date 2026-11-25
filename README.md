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
4. Em **Authentication → Sign In / Providers → Email**:
   - deixe **Enable Email provider** e **Allow new users to sign up** ligados (o site cria as contas por aí; o banco recusa qualquer cadastro sem convite da escola);
   - **desligue "Confirm email"**, para a senha provisória funcionar na hora.
5. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public** key.

## 2. Colar as chaves no site

Abra `assets/config.js` (dá pra editar direto no GitHub, no ícone de lápis) e troque:

```js
SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
SUPABASE_ANON_KEY: "COLE_AQUI_A_ANON_PUBLIC_KEY",
```

> A *anon key* pode ficar pública: quem protege os dados são as regras do `schema.sql`. **Nunca** coloque a *service_role key* no site.

## 3. Publicar no GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e clique em **Save**.
3. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## 4. Avisar o Supabase qual é o endereço do site

Em **Authentication → URL Configuration**, coloque o endereço do site em **Site URL** e em **Redirect URLs**. Isso faz o link de "Esqueci minha senha" voltar para o seu site.

## 5. Criar a primeira conta (administração)

Em **Authentication → Users → Add user → Create new user**, coloque seu e-mail e uma senha e marque **Auto Confirm User**. A **primeira** conta criada vira **administração** automaticamente. Depois disso, todas as outras contas são criadas pelo próprio site.

## Como funciona o acesso

- **Entrar:** só e-mail e senha. Não existe cadastro aberto: quem cria as contas é a escola.
- **Criar acesso** (página inicial, depois de entrar):
  - **Professor(a)** cria contas de **alunos**.
  - **Administração** cria contas de alunos, professores e administração, e muda a função de qualquer conta na tabela **Contas da escola**.
- A conta nasce com uma **senha provisória**. No primeiro acesso o site obriga a pessoa a criar a própria senha.
- **Turmas:** ao criar (ou depois, na tabela) escolha o **nível do Español** e a **turma do English** do aluno. Ao entrar, ele já vê as turmas dele.
- **Español:** o aluno entra direto no nível dele, sem outra senha. A professora vê o aluno no *Panel de la profesora* automaticamente e pode mudar o nível por lá também.
- **English:** funciona igual ao Español. O aluno vê **todas as unidades da turma** dele (campo *English · turma*) assim que entra, sem código. Tem **Class Board** (mural), **Assignments** (tarefas com entrega), **My Grades** (notas e comentários do professor) e **News Board**. Professor e administração entram direto no **Teacher Desk**, sem código.
- **Esqueceu a senha:** o próprio aluno usa **Esqueci minha senha** e recebe um link por e-mail.

| Função | O que pode |
|---|---|
| Aluno(a) | estudar nas turmas dele, comentar no mural, entregar tarefas e ver as notas (nas duas plataformas) |
| Professor(a) | criar alunos e definir turmas; *Panel de la profesora* no Español e *Teacher Desk* no English (mural, tarefas, notas, recados) |
| Administração | tudo do professor + criar professores e administração, mudar funções, importar os dados do English |

## Chaves das aulas do English

As unidades do English são **criptografadas** dentro do arquivo; as chaves ficam no banco.

1. Entre no site como **administração** e use **Importar dados do English** (página inicial) com o arquivo de exportação do banco original (`…db-export.json`).
2. Pronto: o site abre as 12 turmas. Cada aluno já vê todas as unidades da turma dele, e cada turma só consegue ler as chaves dela. Professores e administração veem todas.

> O arquivo de exportação contém a chave mestra das aulas: **não coloque no GitHub** (o `.gitignore` já bloqueia) e apague depois de importar.

## Testar no computador

Sem configurar o Supabase, o portal mostra um aviso e as plataformas abrem em modo de teste, sem login e sem salvar nada no banco:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```
