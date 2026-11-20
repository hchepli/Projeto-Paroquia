import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // mesmo custo do UsersService

function fail(message: string): never {
  console.error(`seed:prod: ${message}`);
  process.exit(1);
}

// Mesma política do @StrongPassword(): 8 a 72 caracteres, 1 letra e 1 número.
function passwordProblem(password: string): string | null {
  if (password.length < 8 || password.length > 72) {
    return 'ADMIN_PASSWORD deve ter de 8 a 72 caracteres.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'ADMIN_PASSWORD deve ter ao menos 1 letra e 1 número.';
  }
  return null;
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrador';

  if (!process.env.DATABASE_URL) fail('DATABASE_URL não definida.');
  if (!email) fail('ADMIN_EMAIL não definido.');
  if (!password) fail('ADMIN_PASSWORD não definida.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
    fail('ADMIN_EMAIL inválido.');
  }
  const problem = passwordProblem(password);
  if (problem) fail(problem);
  if (email.endsWith('@paroquia.org')) {
    fail('ADMIN_EMAIL parece ser de teste (@paroquia.org). Use um e-mail real.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    // Cargos base (RN005). Idempotente: update vazio não altera o que já existe.
    const roleAdmin = await prisma.role.upsert({
      where: { name: 'Admin Geral' },
      update: {},
      create: { name: 'Admin Geral', description: 'Acesso total ao sistema', isBase: true },
    });
    await prisma.role.upsert({
      where: { name: 'Secretaria' },
      update: {},
      create: {
        name: 'Secretaria',
        description: 'Gestão de comunicados, eventos, missas, calendário, sacramentos e galeria',
        isBase: true,
      },
    });
    await prisma.role.upsert({
      where: { name: 'Coordenador de Pastoral' },
      update: {},
      create: {
        name: 'Coordenador de Pastoral',
        description: 'Gestão restrita ao conteúdo e às escalas da própria pastoral',
        isBase: true,
      },
    });
    console.log('Cargos base garantidos.');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Usuário ${email} já existe. Nada a fazer.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.create({
      data: { name, email, passwordHash, roleId: roleAdmin.id, status: 'ACTIVE' },
    });
    console.log(`Admin Geral criado: ${email}`);
    console.log('Agora REMOVA ADMIN_PASSWORD do .env do servidor.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('seed:prod falhou:', e);
  process.exit(1);
});