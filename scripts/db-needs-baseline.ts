/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env", override: false });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const MIGRATIONS_TABLE = "_prisma_migrations";
const SENTINEL_TABLE = "User";
const BASELINE = "0_init";

void (async () => {
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const tables = await prisma.$queryRaw<{ name: string }[]>`
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name IN (${MIGRATIONS_TABLE}, ${SENTINEL_TABLE})
    `;
    const names = new Set(tables.map((t) => t.name));

    if (!names.has(SENTINEL_TABLE)) {
      console.error("[baseline] empty database — deploy will create it");
      console.log("ok");
      return;
    }
    if (!names.has(MIGRATIONS_TABLE)) {
      console.error("[baseline] schema from db push, no migration history");
      console.log("baseline");
      return;
    }

    const applied = await prisma.$queryRaw<{ one: number }[]>`
      SELECT 1 AS one
      FROM "_prisma_migrations"
      WHERE migration_name = ${BASELINE}
        AND finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `;
    if (applied.length > 0) {
      console.error("[baseline] already recorded as applied");
      console.log("ok");
      return;
    }

    console.error(`[baseline] ${BASELINE} missing or failed — recording it`);
    console.log("baseline");
  } catch (e) {
    console.error("[baseline] could not inspect the database:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
