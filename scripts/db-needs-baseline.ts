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

/** Any table from `0_init`; `User` is the first one it creates. */
const SENTINEL_TABLE = "User";

void (async () => {
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name IN ('_prisma_migrations', ${SENTINEL_TABLE})
    `;
    const names = new Set(rows.map((r) => r.name));
    const managed = names.has("_prisma_migrations");
    const legacy = !managed && names.has(SENTINEL_TABLE);
    console.log(legacy ? "baseline" : "ok");
  } catch (e) {
    console.error("[baseline] could not inspect the database:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
