import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const url = process.env.DATABASE_URL ?? '';
if (process.env.NODE_ENV === 'production' || !url.includes('paroquia_test')) {
  console.error('seed:e2e só roda em banco "paroquia_test" e fora de produção. Recusado.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const passwordHash = await bcrypt.hash('senha12345', 10);

  const mk = (name: string, description: string) =>
    prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description, isBase: true },
    });
  const admin = await mk('Admin Geral', 'Acesso total ao sistema');
  const secretaria = await mk('Secretaria', 'Gestão de conteúdo');
  const coord = await mk('Coordenador de Pastoral', 'Restrito à própria pastoral');

  let liturgia = await prisma.pastoralGroup.findFirst({ where: { name: 'Liturgia' } });
  liturgia ??= await prisma.pastoralGroup.create({
    data: { name: 'Liturgia', description: 'Liturgia', contact: 'l@paroquia.org', defaultRole: 'leitor' },
  });

  const upsertUser = (email: string, name: string, roleId: number, pastoralGroupId?: number) =>
    prisma.user.upsert({
      where: { email },
      update: { passwordHash, status: 'ACTIVE' },
      create: { email, name, passwordHash, roleId, pastoralGroupId, status: 'ACTIVE' },
    });

  await upsertUser('admin@paroquia.org', 'Admin E2E', admin.id);
  await upsertUser('secretaria@paroquia.org', 'Secretaria E2E', secretaria.id);
  await upsertUser('coordenador.liturgia@paroquia.org', 'Coordenador E2E', coord.id, liturgia.id);

  const hasVolunteer = await prisma.volunteer.findFirst({ where: { name: 'Maria E2E' } });
  if (!hasVolunteer) {
    await prisma.volunteer.create({
      data: { name: 'Maria E2E', phone: '11999990000', pastoralGroupId: liturgia.id },
    });
  }
  console.log('Seed E2E concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());