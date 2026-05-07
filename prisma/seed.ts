import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const BATCH_SIZE = 1000;

async function seed() {
  console.log('Seeding database...');

  const sitesPath = path.join(__dirname, '../SitesJSONData.json');
  const trucksPath = path.join(__dirname, '../TrucksJSONData.json');

  const sites: Array<{ id: number; name: string; address: string; description: string }> =
    JSON.parse(fs.readFileSync(sitesPath, 'utf-8'));

  const trucks: Array<{ id: number; license: string; siteId: number }> = JSON.parse(
    fs.readFileSync(trucksPath, 'utf-8'),
  );

  // Clear in dependency order before re-seeding.
  await prisma.ticket.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.site.deleteMany();

  // Sites: insert in batches to avoid hitting SQLite parameter limits.
  for (let i = 0; i < sites.length; i += BATCH_SIZE) {
    await prisma.site.createMany({ data: sites.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  Seeded ${sites.length} sites`);

  for (let i = 0; i < trucks.length; i += BATCH_SIZE) {
    await prisma.truck.createMany({ data: trucks.slice(i, i + BATCH_SIZE) });
  }
  console.log(`  Seeded ${trucks.length} trucks`);

  console.log('Done.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
