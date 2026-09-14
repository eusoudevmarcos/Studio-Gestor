# Studio Gestor

Controle gerencial interno do escritório contábil: cadastro simples das empresas e o **fechamento por competência em matriz** (empresa × etapa), igual à planilha, para os departamentos **Fiscal** e **Folha**.

Não há portal do cliente, chamados nem financeiro: é uma ferramenta de acompanhamento para o dono e a equipe.

## Como funciona

```txt
Empresa (código, CNPJ, IE / CF-DF, atividade, UF, regime, funcionários...)
   └── perfil ─► etapas aplicáveis por módulo (automático, com exceções por empresa)
         └── competência (YYYY-MM) ─► matriz: linha = empresa, coluna = etapa, célula = status
```

- **Empresas**: cadastro com os mesmos campos da planilha. Aceita importação em lote colando as linhas do Excel (`Empresas → Importar da planilha`).
- **Fiscal**: colunas `DW NF · IMPORT · AJUSTE · APURAR · DAS · PIS · COFINS · IRPJ · CSLL · SPED ICMS · EFD CONT · REINF · MIT · DCTFWEB`.
- **Folha**: colunas `EVENTOS · CALCULO · CONFER · RECIBOS · EXTRATOS · ESOCIAL · GFD · INSS · ENVIO`.
- **Status da célula** (cores da planilha): concluído (verde, com data), sem movimento (`S. Mov.`), não devido no mês (`Não`), pendente (branco), atenção (amarelo), não se aplica (preto). Marcadores como `IRRF` aparecem em vermelho enquanto pendentes.
- **Ações da linha** (clique no nome da empresa): sem movimento na competência, observações, concluir pendentes, reabrir tudo.
- **Painel**: andamento do fechamento da competência por módulo e empresas com pendências.
- **Tarefas avulsas**: demandas fora da rotina (alteração contratual, parcelamento...).

### Regras de aplicabilidade (resumo)

Definidas em [`lib/closing.ts`](lib/closing.ts) e derivadas de regime, atividade, UF, inscrição estadual / CF-DF, emissão de nota, IRRF de aluguel e quantidade de funcionários:

| Etapa | Aplica quando |
|---|---|
| DW NF | empresa emite nota |
| IMPORT | emite nota e (ICMS ou DF) |
| AJUSTE / APURAR | todo regime exceto MEI |
| DAS | Simples Nacional / MEI |
| PIS / COFINS / MIT | Lucro Presumido / Real |
| IRPJ / CSLL | Lucro Presumido / Real; só vence nas competências 03, 06, 09 e 12 |
| SPED ICMS | fora do Simples e com IE ou CF-DF |
| EFD CONT / DCTFWEB | fora do Simples (inclui imune/isenta) |
| REINF | Lucro Presumido / Real (padrão "Não") ou IRRF de aluguel (pendente com marcador) |
| Folha (exceto ESOCIAL) | empresa com funcionários (ou não informado) |
| ESOCIAL | sempre |

Exceções por empresa: `Editar empresa → Avançado` permite forçar "sempre aplica" / "nunca aplica" por etapa, e os módulos Fiscal/Folha podem ser desligados por empresa.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + componentes locais estilo shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth (credenciais) com senha bcrypt; só entra quem está cadastrado em **Equipe**
- Zod, React Hook Form, date-fns, Lucide

## Rodando localmente

Precisa de um PostgreSQL (Docker: `docker run -d --name sg-postgres -e POSTGRES_PASSWORD=sgtest -e POSTGRES_DB=studiotax -p 5433:5432 postgres:16-alpine`).

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL, NEXTAUTH_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD
npx prisma migrate deploy # cria as tabelas no schema studio_gestor
npm run db:seed           # organização, setores e administrador principal
npm run dev
```

Abra `http://localhost:3000`, entre com o e-mail/senha de `ADMIN_EMAIL`/`ADMIN_PASSWORD` e importe as empresas em **Empresas → Importar da planilha**.

## Deploy no Render (com o PostgreSQL que já existe)

1. **Render → New → Blueprint** apontando para este repositório (usa o `render.yaml`), ou **New → Web Service** com Build Command `npm run render:build` e Start Command `npm start`.
2. Variáveis de ambiente do serviço:
   - `DATABASE_URL`: a **Internal Database URL** do PostgreSQL existente + `?schema=studio_gestor` no final. O Gestor cria e usa só esse schema; nada do site é tocado. (Se o banco estiver em outra região, use a External Database URL.)
   - `NEXTAUTH_SECRET`: gerado pelo blueprint (ou `openssl rand -base64 32`).
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`: o acesso principal. É criado automaticamente no primeiro deploy/login; depois disso a senha pode ser trocada em Configurações e a variável pode ser removida.
   - `NEXTAUTH_URL` não é necessária no Render (usa `RENDER_EXTERNAL_URL`); defina apenas se usar domínio próprio.
3. O build roda `prisma migrate deploy` — a cada deploy as migrações pendentes são aplicadas.
4. No site da Studio Tax, o botão **Login** aponta para a URL do serviço (`NEXT_PUBLIC_GESTOR_URL`).

## Acesso e equipe

- Não há cadastro público. O administrador cria cada colaborador em **Equipe** (nome, e-mail, perfil, setor e senha inicial) e pode redefinir senhas.
- Cada usuário troca a própria senha em **Configurações**.
- Usuários inativos não conseguem entrar; sempre resta pelo menos um admin ativo.

## Estrutura

```txt
app/(auth)/login         tela de login
app/(dashboard)/
  dashboard              painel do fechamento
  empresas               lista, cadastro, detalhe, importação
  fiscal, folha          matriz por competência
  tarefas, calendario, equipe, configuracoes
components/closing/      matriz (client), página compartilhada, estilos das células
lib/closing.ts           módulos, etapas, status e regras de aplicabilidade
lib/data.ts              leitura (board, resumo, empresas, tarefas, equipe)
lib/actions/             companies.ts, closing.ts, tasks.ts, users.ts
lib/auth/                NextAuth, sessão, bootstrap do admin
proxy.ts                 bloqueio de rotas sem login
prisma/                  schema, migrações e seed
```

## Perfis

- `ADMIN`: tudo, inclusive equipe e senhas.
- `GESTOR`: tudo, exceto gerenciar a equipe.
- `COORDENADOR` / `COLABORADOR`: cadastram empresas e marcam o fechamento.
- `CONSULTA`: somente visualização.

## Próximos passos

- Módulo Contábil na mesma matriz.
- Histórico por célula e exportação do fechamento por competência.
- Domínio próprio (ex.: gestor.studiotax.com.br) no Render.
