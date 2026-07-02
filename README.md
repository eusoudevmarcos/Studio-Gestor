# Studio Gestor

Sistema web fullstack para gestão operacional de rotinas, tarefas, setores, responsáveis, prazos e entregas em empresas de vários segmentos.

## Proposta

O Studio Gestor não é exclusivo para contabilidade. A estrutura do MVP segue o fluxo:

```txt
Organização -> Segmentos -> Setores -> Rotinas -> Tarefas -> Responsáveis -> Prazos -> Status
```

Segmentos iniciais do seed:

- Contabilidade
- Empresa de TI
- Recrutamento e Seleção
- Jurídico
- Marketing
- Consultoria
- Financeiro/BPO

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui como padrão de componentes locais
- Prisma ORM
- PostgreSQL
- Auth.js/NextAuth com credenciais
- Zod
- React Hook Form
- date-fns
- TanStack Table
- Lucide React

## Modo atual

Nesta etapa, o sistema está em modo operacional local, sem login e sem dependência de PostgreSQL para navegar e testar as telas principais. Os dados ficam em `.demo/studio-gestor-data.json`, arquivo ignorado pelo Git.

A autenticação, usuários reais e conexão definitiva com PostgreSQL ficam preservadas na estrutura do projeto para retomada posterior.

## Configuração com banco

1. Instale dependências:

```bash
npm install
```

2. Crie `.env` com base no `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="gere-um-segredo-forte"
AUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mesmo-valor-do-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

3. Quando for ativar banco novamente, rode migrations e seed:

```bash
npm run prisma:migrate
npm run db:seed
```

4. Inicie o projeto:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Login do seed futuro

- Admin: `admin@studiogestor.com`
- Senha: `Studio@123`

Outros usuários fictícios também usam a senha `Studio@123`.

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts"
}
```

## Estrutura

```txt
app/
  (auth)/login
  (dashboard)/
    dashboard
    clientes
    tarefas
    rotinas
    calendario
    setores
    segmentos
    equipe
    relatorios
    configuracoes
components/
  badges/
  dashboard/
  forms/
  layout/
  tables/
  ui/
lib/
  actions/
  auth/
  permissions/
  prisma/
  validations/
prisma/
  schema.prisma
  seed.ts
types/
```

## Perfis

- `ADMIN`: gerencia tudo.
- `GESTOR`: vê tudo e gerencia rotinas/tarefas/clientes.
- `COORDENADOR`: trabalha no próprio setor e equipe.
- `COLABORADOR`: acompanha tarefas atribuídas e do setor.
- `CONSULTA`: visualização.

## Funcionalidades do MVP

- Login com credenciais.
- Dashboard com cards, próximos vencimentos, tarefas críticas e rankings.
- CRUD de Clientes/Projetos.
- CRUD de Tarefas com comentários e histórico.
- CRUD de Rotinas e geração de tarefa.
- CRUD de Segmentos.
- CRUD de Setores.
- Calendário por vencimento.
- Equipe com edição rápida por admin.
- Relatórios básicos.
- Prisma schema com multiempresa simples.
- Seed multi-segmento.

## Próximos passos

- Convites de usuários e redefinição de senha.
- Auditoria avançada por módulo.
- Notificações por e-mail.
- Integrações externas como agenda, WhatsApp e arquivos.
- Papéis e permissões configuráveis por organização.
