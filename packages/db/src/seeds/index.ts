import prisma from "../index";
import { seedCategories } from "./categories";
import { seedPoliceData } from "./police-data";
import { seedSystemUser } from "./system-user";

async function main() {
  await seedCategories();
  await seedSystemUser();
  await seedPoliceData();
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
