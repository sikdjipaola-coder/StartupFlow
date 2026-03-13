const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passAdmin = await bcrypt.hash('adminpass', 10);
  const passUser = await bcrypt.hash('userpass', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@startupflow.test' },
    update: {},
    create: { name: 'Admin', email: 'admin@startupflow.test', password: passAdmin, isAdmin: true }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@startupflow.test' },
    update: {},
    create: { name: 'Demo User', email: 'user@startupflow.test', password: passUser }
  });

  const p1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'EcoCharge : Solaire Mobile',
      description: 'Réinventer la recharge nomade avec panneaux photovoltaïques ultra-légers.',
      goal: 100000,
      currentAmount: 65000,
      status: 'ACTIVE',
      category: 'Énergie',
      ownerId: admin.id
    }
  });

  const p2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'AgriTech : Fermes Verticales',
      description: "Optimisation de l'agriculture urbaine grâce à l'IA.",
      goal: 50000,
      currentAmount: 42000,
      status: 'ACTIVE',
      category: 'AgriTech',
      ownerId: user.id
    }
  });

  await prisma.investment.createMany({
    data: [
      { amount: 5000, userId: user.id, projectId: p1.id },
      { amount: 2000, userId: user.id, projectId: p2.id }
    ]
  });

  console.log('Seeding terminé. Users: ', { admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
