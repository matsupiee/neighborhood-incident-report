import prisma from "../index";

const INCIDENT_CATEGORIES = [
  { id: "cat_noise", name: "騒音" },
  { id: "cat_dangerous", name: "危険行為" },
  { id: "cat_dumping", name: "ゴミ不法投棄" },
  { id: "cat_parking", name: "迷惑駐車" },
  { id: "cat_other", name: "その他" },
] as const;

export async function seedCategories() {
  for (const category of INCIDENT_CATEGORIES) {
    await prisma.incidentCategory.upsert({
      where: { id: category.id },
      update: { name: category.name },
      create: { id: category.id, name: category.name },
    });
  }

  console.log(`Seeded ${INCIDENT_CATEGORIES.length} incident categories`);
}

if (import.meta.main) {
  seedCategories()
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
