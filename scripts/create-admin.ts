/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const dbUrl = process.env.DATABASE_URL;

if (!email || !password || !dbUrl) {
  console.error(
    "Missing ADMIN_EMAIL, ADMIN_PASSWORD, or DATABASE_URL in .env.local",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });
const passwordHash = await hash(password, 12);

await prisma.user.upsert({
  where: { email },
  update: { passwordHash },
  create: { email, passwordHash },
});

await prisma.$disconnect();
console.log(`Admin user ready: ${email}`);
