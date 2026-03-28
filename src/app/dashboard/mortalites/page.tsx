import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MortalitesPage } from "@/components/mortalites/MortalitesPage";

export default async function MortalitesPageRoute() {
  await requireAuth();
  const [mortalites, troupeaux] = await Promise.all([
    prisma.mortalite.findMany({
      orderBy: { date: "desc" },
      take: 60,
      include: { troupeau: { select: { id: true, nom: true } } },
    }),
    prisma.troupeau.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, nombreActuel: true },
    }),
  ]);
  return <MortalitesPage initialData={mortalites} troupeaux={troupeaux} />;
}
