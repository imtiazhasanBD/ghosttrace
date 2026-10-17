import { PrismaClient, WorkspaceRole } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function main() {
  console.log('Seeding GhostTrace database...');

  // 1. Create Default User (password: Password123! hashed with fixed bcrypt-like or mock sha256)
  // For standard bcrypt compatibility: standard pre-hashed value for 'Password123!' with salt rounds 10:
  // $2b$10$w82h0bJkE1.QvT0pQfP2dOq1hIvdG0i.Rk/nL1K27v3u7q3mY4iXe
  const defaultPasswordHash = '$2b$10$w82h0bJkE1.QvT0pQfP2dOq1hIvdG0i.Rk/nL1K27v3u7q3mY4iXe';

  const user = await prisma.user.upsert({
    where: { email: 'demo@ghosttrace.io' },
    update: {},
    create: {
      email: 'demo@ghosttrace.io',
      name: 'Demo Architect',
      passwordHash: defaultPasswordHash,
    },
  });
  console.log(`User created/verified: ${user.email} (${user.id})`);

  // 2. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'default-workspace' },
    update: {},
    create: {
      name: 'Default Workspace',
      slug: 'default-workspace',
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });
  console.log(`Workspace created/verified: ${workspace.name} (${workspace.id})`);

  // 3. Create Project
  const project = await prisma.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'demo-project',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Demo Project',
      slug: 'demo-project',
    },
  });
  console.log(`Project created/verified: ${project.name} (${project.id})`);

  // 4. Create API Key for Demo Project
  const demoApiKey = 'gt_live_default_demo_project_key_test_12345';
  const hashedKey = hashApiKey(demoApiKey);

  const apiKey = await prisma.apiKey.upsert({
    where: { keyHash: hashedKey },
    update: {
      projectId: project.id,
      revokedAt: null,
    },
    create: {
      projectId: project.id,
      name: 'Demo Default Key',
      keyPrefix: 'gt_live_default_',
      keyHash: hashedKey,
    },
  });
  console.log(`API Key active: ${apiKey.keyPrefix}... -> ${apiKey.id}`);

  // 5. Seed Demo Products for Instrumented Checkout
  await prisma.demoProduct.upsert({
    where: { sku: 'PROD-SUCCESS-1' },
    update: { stock: 50 },
    create: {
      name: 'Premium Cloud Storage (1TB)',
      sku: 'PROD-SUCCESS-1',
      price: 99.99,
      stock: 50,
    },
  });

  await prisma.demoProduct.upsert({
    where: { sku: 'PROD-FAIL-OUTOFSTOCK' },
    update: { stock: 0 },
    create: {
      name: 'Limited Quantum Processing Unit',
      sku: 'PROD-FAIL-OUTOFSTOCK',
      price: 4999.00,
      stock: 0,
    },
  });
  console.log('Demo products seeded.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
