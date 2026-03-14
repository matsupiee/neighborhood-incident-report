import prisma from "../index";

/** 警察オープンデータ自動インポート用のシステムユーザーID */
export const SYSTEM_USER_ID = "system_police_data_user";

export async function seedSystemUser() {
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      name: "警察オープンデータ",
      email: "system@neighborhood-incident-report.local",
      emailVerified: true,
      trustScore: 100,
    },
  });

  console.log("Seeded system user");
}

if (import.meta.main) {
  seedSystemUser()
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
