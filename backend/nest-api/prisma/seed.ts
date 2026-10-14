import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function cleanDatabase() {
  // Ordem respeita as FKs (filhos antes dos pais). Roles são mantidos (upsert).
  await prisma.auditLog.deleteMany();
  await prisma.attendanceConfirmation.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.album.deleteMany();
  await prisma.scheduleAssignment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.massPastoralGroup.deleteMany();
  await prisma.eventPastoralGroup.deleteMany();
  await prisma.event.deleteMany();
  await prisma.mass.deleteMany();
  await prisma.massTemplate.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.category.deleteMany();
  await prisma.sacrament.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pastoralGroup.deleteMany();
}

async function main() {
  console.log('Iniciando seed...');

  console.log('Limpando dados antigos...');
  await cleanDatabase();

  // ------------------------------------------------------------
  // 1. ROLES (cargos base - RN005)
  // ------------------------------------------------------------
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'Admin Geral' },
    update: {},
    create: { name: 'Admin Geral', description: 'Acesso total ao sistema', isBase: true },
  });

  const roleSecretaria = await prisma.role.upsert({
    where: { name: 'Secretaria' },
    update: {},
    create: {
      name: 'Secretaria',
      description: 'Gestão de comunicados, eventos, missas, calendário, sacramentos e galeria',
      isBase: true,
    },
  });

  const roleCoordenador = await prisma.role.upsert({
    where: { name: 'Coordenador de Pastoral' },
    update: {},
    create: {
      name: 'Coordenador de Pastoral',
      description: 'Gestão restrita ao conteúdo e às escalas da própria pastoral',
      isBase: true,
    },
  });

  console.log('Roles criados.');

  // ------------------------------------------------------------
  // 2. PASTORAL GROUPS (3, com defaultRole - função sugerida na escala)
  // ------------------------------------------------------------
  const pastoralCatequese = await prisma.pastoralGroup.create({
    data: {
      name: 'Catequese',
      description: 'Pastoral responsável pela catequese infantil e de adultos',
      contact: 'catequese@paroquia.org',
      defaultRole: 'apoio_organizacao',
    },
  });

  const pastoralLiturgia = await prisma.pastoralGroup.create({
    data: {
      name: 'Liturgia',
      description: 'Pastoral responsável pela organização litúrgica das missas',
      contact: 'liturgia@paroquia.org',
      defaultRole: 'leitor',
    },
  });

  const pastoralCoroinhas = await prisma.pastoralGroup.create({
    data: {
      name: 'Coroinhas',
      description: 'Pastoral dos coroinhas e acólitos',
      contact: 'coroinhas@paroquia.org',
      defaultRole: 'coroinha',
    },
  });

  console.log('Pastorais criadas.');

  // ------------------------------------------------------------
  // 3. USERS (senha hasheada de verdade)
  // ------------------------------------------------------------
  const passwordHash = await bcrypt.hash('senha12345', SALT_ROUNDS);

  const userAdmin = await prisma.user.create({
    data: {
      name: 'Admin Geral Teste',
      email: 'admin@paroquia.org',
      passwordHash,
      roleId: roleAdmin.id,
      status: 'ACTIVE',
    },
  });

  const userSecretaria = await prisma.user.create({
    data: {
      name: 'Secretaria Teste',
      email: 'secretaria@paroquia.org',
      passwordHash,
      roleId: roleSecretaria.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Coordenador Catequese Teste',
      email: 'coordenador.catequese@paroquia.org',
      passwordHash,
      roleId: roleCoordenador.id,
      pastoralGroupId: pastoralCatequese.id, // RN006
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Coordenador Liturgia Teste',
      email: 'coordenador.liturgia@paroquia.org',
      passwordHash,
      roleId: roleCoordenador.id,
      pastoralGroupId: pastoralLiturgia.id, // RN006
      status: 'ACTIVE',
    },
  });

  console.log('Usuários criados (senha para todos: senha12345).');

  // ------------------------------------------------------------
  // 4. VOLUNTEERS (cada um pertence a exatamente 1 Pastoral - Bloco 1)
  // ------------------------------------------------------------
  const joao = await prisma.volunteer.create({
    data: { name: 'João da Silva', phone: '11999990001', email: 'joao@example.com', pastoralGroupId: pastoralCatequese.id },
  });
  await prisma.volunteer.create({
    data: { name: 'Carla Souza', phone: '11999990003', email: 'carla@example.com', pastoralGroupId: pastoralCatequese.id },
  });

  const maria = await prisma.volunteer.create({
    data: { name: 'Maria Oliveira', phone: '11999990002', email: 'maria@example.com', pastoralGroupId: pastoralLiturgia.id },
  });
  const pedro = await prisma.volunteer.create({
    data: { name: 'Pedro Santos', phone: '11999990004', email: 'pedro@example.com', pastoralGroupId: pastoralLiturgia.id },
  });

  const ana = await prisma.volunteer.create({
    data: { name: 'Ana Lima', phone: '11999990005', email: 'ana@example.com', pastoralGroupId: pastoralCoroinhas.id },
  });
  await prisma.volunteer.create({
    data: { name: 'Lucas Ferreira', phone: '11999990006', email: 'lucas@example.com', pastoralGroupId: pastoralCoroinhas.id },
  });

  console.log('Voluntários criados.');

  // ------------------------------------------------------------
  // 5. CATEGORIES
  // ------------------------------------------------------------
  const categoriaEvento = await prisma.category.create({
    data: { name: 'Festa Junina', type: 'EVENT' },
  });

  const categoriaComunicado = await prisma.category.create({
    data: { name: 'Aviso Geral', type: 'ANNOUNCEMENT' },
  });

  console.log('Categorias criadas.');

  // ------------------------------------------------------------
  // 6. MASSES + vínculo com Pastorais (RN017)
  // Cobre os 3 estados do card de escalas:
  //   missa1 -> COMPLETE      (Liturgia + Coroinhas, ambas escaladas)
  //   missa3 -> INCOMPLETE    (Liturgia escalada; Coroinhas e Catequese pendentes)
  //   missa4 -> INCOMPLETE    (Liturgia + Coroinhas, nenhuma escalada)
  //   missa5 -> NO_PASTORAL   (sem pastoral: não conta como pendente de escala)
  //   missa2 -> fora do mês, Liturgia vinculada, sem escala
  // Datas com fuso -03:00 (Brasil) pra não "virar o dia" no filtro do mês.
  // ------------------------------------------------------------
  const missa1 = await prisma.mass.create({
    data: {
      title: 'Missa Dominical',
      dateTime: new Date('2026-09-06T10:00:00-03:00'),
      type: 'COMMON',
      location: 'Igreja Matriz',
    },
  });

  const missa3 = await prisma.mass.create({
    data: {
      title: 'Missa Dominical',
      dateTime: new Date('2026-09-13T10:00:00-03:00'),
      type: 'COMMON',
      location: 'Igreja Matriz',
    },
  });

  const missa4 = await prisma.mass.create({
    data: {
      title: 'Missa Dominical',
      dateTime: new Date('2026-09-20T10:00:00-03:00'),
      type: 'COMMON',
      location: 'Igreja Matriz',
    },
  });

  await prisma.mass.create({
    data: {
      title: 'Missa Dominical (sem pastoral)',
      dateTime: new Date('2026-09-27T10:00:00-03:00'),
      type: 'COMMON',
      location: 'Igreja Matriz',
    },
  });

  const missa2 = await prisma.mass.create({
    data: {
      title: 'Missa de Natal',
      dateTime: new Date('2026-12-24T22:00:00-03:00'),
      type: 'SPECIAL',
      location: 'Igreja Matriz',
      notes: 'Missa do Galo',
    },
  });

  await prisma.massPastoralGroup.createMany({
    data: [
      { massId: missa1.id, pastoralGroupId: pastoralLiturgia.id },
      { massId: missa1.id, pastoralGroupId: pastoralCoroinhas.id },
      { massId: missa3.id, pastoralGroupId: pastoralLiturgia.id },
      { massId: missa3.id, pastoralGroupId: pastoralCoroinhas.id },
      { massId: missa3.id, pastoralGroupId: pastoralCatequese.id },
      { massId: missa4.id, pastoralGroupId: pastoralLiturgia.id },
      { massId: missa4.id, pastoralGroupId: pastoralCoroinhas.id },
      { massId: missa2.id, pastoralGroupId: pastoralLiturgia.id },
    ],
  });

  console.log('Missas criadas (com pastorais vinculadas).');

  // ------------------------------------------------------------
  // 7. EVENTS + vínculo com Pastorais (RN017)
  // ------------------------------------------------------------
  const evento1 = await prisma.event.create({
    data: {
      name: 'Festa Junina 2026',
      slug: 'festa-junina-2026',
      description: 'Festa junina anual da paróquia',
      categoryId: categoriaEvento.id,
      startDate: new Date('2026-06-20T18:00:00-03:00'),
      endDate: new Date('2026-06-20T23:00:00-03:00'),
      location: 'Salão Paroquial',
      status: 'ACTIVE',
    },
  });

  const evento2 = await prisma.event.create({
    data: {
      name: 'Novena de Natal',
      slug: 'novena-de-natal-2026',
      description: 'Novena preparatória para o Natal',
      startDate: new Date('2026-12-15T19:00:00-03:00'),
      endDate: new Date('2026-12-23T21:00:00-03:00'),
      location: 'Igreja Matriz',
      status: 'ACTIVE',
      massId: missa2.id, // RN002 - correlação opcional
    },
  });

  await prisma.eventPastoralGroup.createMany({
    data: [
      { eventId: evento1.id, pastoralGroupId: pastoralCatequese.id },
      { eventId: evento2.id, pastoralGroupId: pastoralLiturgia.id },
    ],
  });

  console.log('Eventos criados (com pastorais vinculadas).');

  // ------------------------------------------------------------
  // 8. SCHEDULES (1 por Missa/Evento + Pastoral; pastoralGroupId sempre preenchido)
  // ------------------------------------------------------------
  const escalaMissa1Liturgia = await prisma.schedule.create({
    data: { massId: missa1.id, pastoralGroupId: pastoralLiturgia.id },
  });
  const escalaMissa1Coroinhas = await prisma.schedule.create({
    data: { massId: missa1.id, pastoralGroupId: pastoralCoroinhas.id },
  });
  const escalaMissa3Liturgia = await prisma.schedule.create({
    data: { massId: missa3.id, pastoralGroupId: pastoralLiturgia.id },
  });
  const escalaEvento1Catequese = await prisma.schedule.create({
    data: { eventId: evento1.id, pastoralGroupId: pastoralCatequese.id },
  });

  console.log('Escalas criadas.');

  // ------------------------------------------------------------
  // 9. SCHEDULE ASSIGNMENTS (voluntário sempre da pastoral da escala)
  // ------------------------------------------------------------
  await prisma.scheduleAssignment.createMany({
    data: [
      { scheduleId: escalaMissa1Liturgia.id, volunteerId: maria.id, role: 'leitor' },
      { scheduleId: escalaMissa1Coroinhas.id, volunteerId: ana.id, role: 'coroinha' },
      { scheduleId: escalaMissa3Liturgia.id, volunteerId: pedro.id, role: 'leitor' },
      { scheduleId: escalaEvento1Catequese.id, volunteerId: joao.id, role: 'apoio_organizacao' },
    ],
  });

  console.log('Atribuições de escala criadas.');

  // ------------------------------------------------------------
  // 10. ANNOUNCEMENTS
  // ------------------------------------------------------------
  await prisma.announcement.create({
    data: {
      title: 'Comunicado de teste (rascunho)',
      slug: 'comunicado-de-teste-rascunho',
      content: 'Este é um comunicado ainda não publicado.',
      categoryId: categoriaComunicado.id,
      status: 'DRAFT',
      authorId: userAdmin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Comunicado de teste (publicado)',
      slug: 'comunicado-de-teste-publicado',
      content: 'Este comunicado já está visível no site institucional.',
      categoryId: categoriaComunicado.id,
      status: 'PUBLISHED',
      authorId: userSecretaria.id,
    },
  });

  console.log('Comunicados criados.');

  // ------------------------------------------------------------
  // 11. SACRAMENT
  // ------------------------------------------------------------
  await prisma.sacrament.create({
    data: {
      name: 'Batismo',
      slug: 'batismo',
      description: 'Sacramento de iniciação cristã.',
      requiredDocuments: 'Certidão de nascimento da criança, documento dos pais.',
      faq: [{ pergunta: 'Qual a idade mínima?', resposta: 'Não há idade mínima definida.' }],
      displayOrder: 1,
    },
  });

  console.log('Sacramento criado.');

  // ------------------------------------------------------------
  // 12. ALBUMS (RN003)
  // ------------------------------------------------------------
  await prisma.album.create({
    data: {
      title: 'Álbum Avulso de Teste',
      slug: 'album-avulso-de-teste',
      description: 'Álbum sem vínculo com nenhum evento.',
    },
  });

  const albumEvento = await prisma.album.create({
    data: {
      title: 'Fotos da Festa Junina 2026',
      slug: 'fotos-da-festa-junina-2026',
      description: 'Registro fotográfico da Festa Junina.',
      eventId: evento1.id,
    },
  });

  console.log('Álbuns criados.');

  // ------------------------------------------------------------
  // 13. PHOTOS (RN010 - capa única)
  // ------------------------------------------------------------
  await prisma.photo.create({
    data: { albumId: albumEvento.id, url: 'https://placeholder.local/fotos/festa-junina-1.jpg', isCover: true },
  });
  await prisma.photo.create({
    data: { albumId: albumEvento.id, url: 'https://placeholder.local/fotos/festa-junina-2.jpg', isCover: false },
  });

  console.log('Fotos criadas.');

  // ------------------------------------------------------------
  // 14. ATTENDANCE CONFIRMATION (RF012)
  // ------------------------------------------------------------
  await prisma.attendanceConfirmation.create({
    data: { eventId: evento1.id, name: 'Visitante de Teste', contact: '11988887777', ipAddress: '127.0.0.1' },
  });

  console.log('Confirmação de presença criada.');

  // ------------------------------------------------------------
  // 15. PERMISSIONS
  // ------------------------------------------------------------
  await prisma.permission.create({
    data: { roleId: roleAdmin.id, resource: 'usuarios', canCreate: true, canEdit: true, canDelete: true, canView: true },
  });
  await prisma.permission.create({
    data: { roleId: roleSecretaria.id, resource: 'eventos', canCreate: true, canEdit: true, canDelete: true, canView: true },
  });

  console.log('Permissões criadas.');

  // ------------------------------------------------------------
  // 16. CHECAGEM DE CONSISTÊNCIA (RN006/RN007/RN017)
  // ------------------------------------------------------------
  const problems: string[] = [];

  const schedules = await prisma.schedule.findMany({
    include: { assignments: { include: { volunteer: true } } },
  });

  for (const s of schedules) {
    if (s.pastoralGroupId === null) {
      problems.push(`Escala ${s.id}: pastoralGroupId nulo.`);
      continue;
    }
    if ((s.massId === null) === (s.eventId === null)) {
      problems.push(`Escala ${s.id}: viola RN007 (Missa XOR Evento).`);
    }

    const linked =
      s.massId !== null
        ? await prisma.massPastoralGroup.findUnique({
            where: { massId_pastoralGroupId: { massId: s.massId, pastoralGroupId: s.pastoralGroupId } },
          })
        : await prisma.eventPastoralGroup.findUnique({
            where: { eventId_pastoralGroupId: { eventId: s.eventId!, pastoralGroupId: s.pastoralGroupId } },
          });
    if (!linked) {
      problems.push(`Escala ${s.id}: pastoral ${s.pastoralGroupId} não está vinculada à Missa/Evento (RN017).`);
    }

    for (const a of s.assignments) {
      if (a.volunteer.pastoralGroupId !== s.pastoralGroupId) {
        problems.push(
          `Escala ${s.id}: voluntário "${a.volunteer.name}" não pertence à pastoral da escala.`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error('Seed inconsistente:\n- ' + problems.join('\n- '));
  }

  console.log('Checagem de consistência OK.');
  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao rodar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });