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
- Prisma ORM + PostgreSQL (schema pronto; ver "Persistência")
- Auth.js/NextAuth com credenciais (preparado, desligado no modo local)
- Zod, React Hook Form, date-fns, Lucide

## Rodando

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. No primeiro acesso o sistema cria a organização e os usuários iniciais; cadastre ou importe as empresas.

## Persistência

Hoje o sistema roda em **modo local**: os dados ficam em `.demo/studio-gestor-data.json` (ignorado pelo Git), sem login. Isso serve para uso em uma máquina; **na Vercel o arquivo vai para `/tmp` e é perdido a cada deploy**.

Para uso pela equipe em produção, o próximo passo é ligar o PostgreSQL: o `prisma/schema.prisma` já contém `ClientProject` (empresa), `ClosingRow` e `ClosingCell`, e todo acesso a dados passa por `lib/data.ts` e `lib/actions/*`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="gere-um-segredo-forte"
AUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mesmo-valor-do-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

```bash
npm run prisma:migrate
npm run db:seed
```

Login do seed: `admin@studiogestor.com` / `Studio@123`.

## Estrutura

```txt
app/(dashboard)/
  dashboard        painel do fechamento
  empresas         lista, cadastro, detalhe, importação
  fiscal, folha    matriz por competência
  tarefas, calendario, equipe, configuracoes
components/closing/  matriz (client), página compartilhada, estilos das células
lib/closing.ts       módulos, etapas, status e regras de aplicabilidade
lib/data.ts          leitura (board, resumo, empresas, tarefas)
lib/actions/         companies.ts (CRUD + importação), closing.ts (células/linhas)
lib/demo-store.ts    armazenamento local (JSON) e seed
prisma/              schema e seed para PostgreSQL
```

## Perfis

- `ADMIN` / `GESTOR`: tudo, inclusive excluir empresas.
- `COORDENADOR` / `COLABORADOR`: cadastram empresas e marcam o fechamento.
- `CONSULTA`: somente visualização.

## Próximos passos

- Ligar PostgreSQL + login para uso multiusuário.
- Módulo Contábil na mesma matriz.
- Histórico por célula e relatório de fechamento por competência (exportação).
