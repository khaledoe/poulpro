import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ProductionPage } from "@/components/production/ProductionPage";

export default async function ProductionPageRoute() {
  await requireAuth();
  const [productions, troupeaux] = await Promise.all([
    prisma.production.findMany({
      orderBy: { date: "desc" },
      take: 60,
      include: { troupeau: { select: { id: true, nom: true, nombreActuel: true } } },
    }),
    prisma.troupeau.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, nombreActuel: true },
    }),
  ]);
  return <ProductionPage initialData={productions} troupeaux={troupeaux} />;
}
