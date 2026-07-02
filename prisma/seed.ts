import { AccountingInvoiceModel, PrismaClient, TaskPriority, TaskStatus, UserRole } from "@prisma/client";
import { addDays, subDays } from "date-fns";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const password = "Studio@123";

const segmentTemplates = [
  {
    name: "Contabilidade",
    description: "Operações contábeis, fiscais, trabalhistas, societárias e tributárias.",
    departments: {
      Folha: ["Fechamento da folha", "eSocial", "FGTS Digital", "DCTFWeb", "Pró-labore", "Férias", "Rescisões"],
      Fiscal: ["Importação de notas fiscais", "Conferência de XML", "Apuração de impostos", "Obrigações fiscais", "Emissão de guias"],
      Contábil: ["Importação de extratos", "Lançamentos contábeis", "Conciliação bancária", "Fechamento mensal", "Balancete"],
      Societário: ["Abertura de empresa", "Alteração contratual", "Baixa de empresa", "Regularização cadastral", "Viabilidade", "DBE", "Junta Comercial"],
      Tributário: ["Revisão tributária", "Ajuste de CNAE", "Revisão de regime", "Regularização de pendências", "Parcelamentos", "Diagnóstico fiscal"],
    },
  },
  {
    name: "Empresa de TI",
    description: "Rotinas de suporte, produto, desenvolvimento, infraestrutura e relacionamento.",
    departments: {
      Suporte: ["Atendimento de chamado", "Triagem de bug", "Retorno ao cliente", "Encerramento de ticket", "Follow-up de SLA"],
      Desenvolvimento: ["Planejamento de sprint", "Desenvolvimento de feature", "Correção de bug", "Code review", "Deploy", "Homologação"],
      Infraestrutura: ["Monitoramento de servidores", "Backup", "Atualizações de segurança", "Controle de acessos", "Verificação de incidentes"],
      Produto: ["Levantamento de requisitos", "Priorização de backlog", "Testes de usabilidade", "Validação de release", "Documentação de produto"],
      Comercial: ["Prospecção", "Demonstração", "Proposta comercial", "Follow-up", "Fechamento"],
      "Customer Success": ["Onboarding de cliente", "Reunião de acompanhamento", "Análise de uso", "Plano de sucesso", "Renovação de contrato"],
    },
  },
  {
    name: "Recrutamento e Seleção",
    description: "Fluxos de vagas, triagem, entrevistas, clientes, admissão e banco de talentos.",
    departments: {
      Recrutamento: ["Abertura de vaga", "Divulgação da vaga", "Captação de candidatos", "Alinhamento de perfil", "Atualização da vaga"],
      Triagem: ["Análise de currículos", "Pré-entrevista", "Teste técnico/comportamental", "Shortlist", "Envio de candidatos ao cliente"],
      Entrevistas: ["Agendamento de entrevista", "Entrevista RH", "Entrevista técnica", "Feedback ao candidato", "Feedback ao cliente"],
      Cliente: ["Reunião de briefing", "Validação de perfil", "Envio de relatório", "Aprovação de candidato", "Follow-up comercial"],
      Admissão: ["Solicitação de documentos", "Conferência documental", "Exame admissional", "Envio para contratação", "Onboarding"],
      "Banco de Talentos": ["Cadastro de candidato", "Atualização de perfil", "Recontato", "Classificação por área", "Disponibilidade"],
    },
  },
  {
    name: "Jurídico",
    description: "Gestão de contratos, prazos processuais, consultivo, compliance e societário.",
    departments: {
      Contratos: ["Análise de contrato", "Elaboração de contrato", "Revisão de cláusulas"],
      Contencioso: ["Controle de prazos processuais", "Protocolo", "Audiência"],
      Consultivo: ["Parecer jurídico", "Due diligence"],
      Compliance: ["Acompanhamento de compliance"],
      Societário: ["Regularização societária"],
    },
  },
  {
    name: "Marketing",
    description: "Planejamento, conteúdo, tráfego, design, atendimento e estratégia.",
    departments: {
      "Social Media": ["Criação de calendário editorial", "Publicação", "Monitoramento de métricas"],
      "Tráfego Pago": ["Planejamento de campanha", "Otimização de anúncios", "Relatório mensal"],
      Design: ["Produção de arte", "Aprovação de peça"],
      Conteúdo: ["Produção de copy"],
      Atendimento: ["Reunião com cliente"],
      Estratégia: ["Planejamento de campanha"],
    },
  },
  {
    name: "Consultoria",
    description: "Diagnóstico, implantação, acompanhamento, relatórios e comercial.",
    departments: {
      Diagnóstico: ["Reunião inicial", "Coleta de dados", "Diagnóstico"],
      Implantação: ["Plano de ação", "Implantação", "Treinamento"],
      Acompanhamento: ["Acompanhamento semanal", "Reunião de resultados"],
      Relatórios: ["Relatório de evolução"],
      Comercial: ["Reunião inicial"],
    },
  },
  {
    name: "Financeiro/BPO",
    description: "Contas a pagar, receber, conciliação, faturamento, cobrança e relatórios.",
    departments: {
      "Contas a pagar": ["Lançamento de contas", "Conferência de pagamentos"],
      "Contas a receber": ["Emissão de boletos", "Cobrança de inadimplentes"],
      Conciliação: ["Conciliação bancária"],
      Faturamento: ["Emissão de notas"],
      Cobrança: ["Cobrança de inadimplentes"],
      Relatórios: ["Relatório de fluxo de caixa", "Fechamento financeiro mensal"],
    },
  },
];

async function main() {
  const passwordHash = await hash(password, 10);

  const organization = await prisma.organization.upsert({
    where: { slug: "studio-gestor-demo" },
    update: {},
    create: {
      name: "Studio Gestor Demo",
      slug: "studio-gestor-demo",
      segment: "Multi-segmento",
    },
  });

  const segments = new Map<string, Awaited<ReturnType<typeof prisma.segment.create>>>();
  const departments = new Map<string, Awaited<ReturnType<typeof prisma.department.create>>>();
  const routines = [];

  for (const template of segmentTemplates) {
    const segment = await prisma.segment.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: template.name } },
      update: { description: template.description, active: true },
      create: {
        name: template.name,
        description: template.description,
        organizationId: organization.id,
      },
    });
    segments.set(template.name, segment);

    for (const [departmentName, routineNames] of Object.entries(template.departments)) {
      const department = await prisma.department.upsert({
        where: {
          organizationId_segmentId_name: {
            organizationId: organization.id,
            segmentId: segment.id,
            name: departmentName,
          },
        },
        update: {
          description: `Setor de ${departmentName} para ${template.name}.`,
          active: true,
        },
        create: {
          name: departmentName,
          description: `Setor de ${departmentName} para ${template.name}.`,
          organizationId: organization.id,
          segmentId: segment.id,
        },
      });
      departments.set(`${template.name}:${departmentName}`, department);

      for (const [index, routineName] of routineNames.entries()) {
        const existing = await prisma.routine.findFirst({
          where: {
            organizationId: organization.id,
            segmentId: segment.id,
            departmentId: department.id,
            name: routineName,
          },
        });

        const routineData = {
          description: `Rotina padrão de ${routineName.toLowerCase()} para ${template.name}.`,
          recurrence: index % 5 === 0 ? "SEMANAL" : "MENSAL",
          defaultDueDay: (index + 5) % 28 || 10,
          defaultPriority: index % 7 === 0 ? TaskPriority.ALTA : TaskPriority.MEDIA,
          active: true,
          organizationId: organization.id,
          segmentId: segment.id,
          departmentId: department.id,
        } as const;

        const routine = existing
          ? await prisma.routine.update({ where: { id: existing.id }, data: routineData })
          : await prisma.routine.create({ data: { name: routineName, ...routineData } });

        routines.push(routine);
      }
    }
  }

  const folha = departments.get("Contabilidade:Folha");
  const fiscal = departments.get("Contabilidade:Fiscal");
  const suporte = departments.get("Empresa de TI:Suporte");
  const marketing = departments.get("Marketing:Social Media");

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@studiogestor.com" },
      update: { passwordHash, role: UserRole.ADMIN, active: true, organizationId: organization.id },
      create: { name: "Admin Studio", email: "admin@studiogestor.com", passwordHash, role: UserRole.ADMIN, organizationId: organization.id },
    }),
    prisma.user.upsert({
      where: { email: "gestor@studiogestor.com" },
      update: { passwordHash, role: UserRole.GESTOR, active: true, organizationId: organization.id },
      create: { name: "Gestora Operacional", email: "gestor@studiogestor.com", passwordHash, role: UserRole.GESTOR, organizationId: organization.id },
    }),
    prisma.user.upsert({
      where: { email: "coordenador.folha@studiogestor.com" },
      update: { passwordHash, role: UserRole.COORDENADOR, active: true, organizationId: organization.id, departmentId: folha?.id },
      create: { name: "Coordenador Folha", email: "coordenador.folha@studiogestor.com", passwordHash, role: UserRole.COORDENADOR, organizationId: organization.id, departmentId: folha?.id },
    }),
    prisma.user.upsert({
      where: { email: "ana.fiscal@studiogestor.com" },
      update: { passwordHash, role: UserRole.COLABORADOR, active: true, organizationId: organization.id, departmentId: fiscal?.id },
      create: { name: "Ana Fiscal", email: "ana.fiscal@studiogestor.com", passwordHash, role: UserRole.COLABORADOR, organizationId: organization.id, departmentId: fiscal?.id },
    }),
    prisma.user.upsert({
      where: { email: "bruno.suporte@studiogestor.com" },
      update: { passwordHash, role: UserRole.COLABORADOR, active: true, organizationId: organization.id, departmentId: suporte?.id },
      create: { name: "Bruno Suporte", email: "bruno.suporte@studiogestor.com", passwordHash, role: UserRole.COLABORADOR, organizationId: organization.id, departmentId: suporte?.id },
    }),
    prisma.user.upsert({
      where: { email: "clara.marketing@studiogestor.com" },
      update: { passwordHash, role: UserRole.COLABORADOR, active: true, organizationId: organization.id, departmentId: marketing?.id },
      create: { name: "Clara Marketing", email: "clara.marketing@studiogestor.com", passwordHash, role: UserRole.COLABORADOR, organizationId: organization.id, departmentId: marketing?.id },
    }),
    prisma.user.upsert({
      where: { email: "consulta@studiogestor.com" },
      update: { passwordHash, role: UserRole.CONSULTA, active: true, organizationId: organization.id },
      create: { name: "Usuário Consulta", email: "consulta@studiogestor.com", passwordHash, role: UserRole.CONSULTA, organizationId: organization.id },
    }),
  ]);

  const admin = users[0];
  const activeUsers = users.filter((user) => user.role !== UserRole.CONSULTA);

  const clientTemplates = [
    ["Alfa Contábil Ltda", "Contabilidade", "CLIENTE"],
    ["SprintHub Plataforma", "Empresa de TI", "PROJETO"],
    ["Vaga Gerente Financeiro", "Recrutamento e Seleção", "CANDIDATO"],
    ["Processo Trabalhista 2241", "Jurídico", "PROCESSO"],
    ["Campanha Lançamento Q3", "Marketing", "PROJETO"],
    ["Implantação OKR Norte", "Consultoria", "EMPRESA"],
    ["BPO Financeiro Atlas", "Financeiro/BPO", "CLIENTE"],
  ] as const;

  const clients = [];
  for (const [index, [name, segmentName, type]] of clientTemplates.entries()) {
    const segment = segments.get(segmentName);
    const existing = await prisma.clientProject.findFirst({ where: { organizationId: organization.id, name } });
    const isAccountingClient = segmentName === "Contabilidade";
    const data = {
      document: index % 2 === 0 ? `00.000.00${index}/0001-0${index}` : null,
      type,
      status: index === 2 ? "EM_IMPLANTACAO" : "ATIVO",
      notes: `Registro fictício para operações de ${segmentName}.`,
      accountingTaxRegime: isAccountingClient ? "SIMPLES_NACIONAL" : null,
      accountingActivity: isAccountingClient ? "COMERCIO_SERVICO" : null,
      accountingState: isAccountingClient ? "SP" : null,
      hasMonthlyMovement: isAccountingClient ? true : null,
      issuesInvoices: isAccountingClient,
      invoiceModels: isAccountingClient ? [AccountingInvoiceModel.NFE, AccountingInvoiceModel.NFSE_PREFEITURA] : [],
      hasRentalIrrf: isAccountingClient,
      organizationId: organization.id,
      segmentId: segment?.id,
      mainResponsibleUserId: activeUsers[index % activeUsers.length]?.id,
    } as const;

    const client = existing
      ? await prisma.clientProject.update({ where: { id: existing.id }, data })
      : await prisma.clientProject.create({ data: { name, ...data } });

    clients.push(client);
  }

  const existingTaskCount = await prisma.task.count({ where: { organizationId: organization.id } });
  if (existingTaskCount === 0) {
    const sampleRoutines = routines.slice(0, 28);
    for (const [index, routine] of sampleRoutines.entries()) {
      const responsible = activeUsers[index % activeUsers.length];
      const client = clients[index % clients.length];
      const statusPool = [
        TaskStatus.PENDENTE,
        TaskStatus.EM_ANDAMENTO,
        TaskStatus.AGUARDANDO_CLIENTE,
        TaskStatus.EM_REVISAO,
        TaskStatus.CONCLUIDO,
      ];
      const status = index % 9 === 0 ? TaskStatus.ATRASADO : statusPool[index % statusPool.length];
      const dueDate = index % 9 === 0 ? subDays(new Date(), index + 1) : addDays(new Date(), index - 4);
      const priority = index % 8 === 0 ? TaskPriority.CRITICA : index % 5 === 0 ? TaskPriority.ALTA : routine.defaultPriority;

      const task = await prisma.task.create({
        data: {
          title: routine.name,
          description: `Execução de ${routine.name.toLowerCase()} para ${client.name}.`,
          competence: null,
          dueDate,
          status,
          priority,
          internalNotes: index % 4 === 0 ? "Acompanhar pendências com o responsável antes do vencimento." : null,
          completedAt: status === TaskStatus.CONCLUIDO ? subDays(new Date(), 1) : null,
          organizationId: organization.id,
          clientProjectId: client.id,
          segmentId: routine.segmentId,
          departmentId: routine.departmentId,
          routineId: routine.id,
          responsibleId: responsible?.id,
          createdById: admin.id,
        },
      });

      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: admin.id,
          action: "Tarefa criada pelo seed",
          newValue: task.title,
        },
      });

      if (index % 6 === 0 && responsible) {
        await prisma.taskComment.create({
          data: {
            taskId: task.id,
            authorId: responsible.id,
            text: "Pendência registrada para acompanhamento na rotina semanal.",
          },
        });
      }
    }
  }

  console.log(`Seed concluído. Login: admin@studiogestor.com / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
