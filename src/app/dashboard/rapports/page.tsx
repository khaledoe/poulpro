import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { RapportsPage } from "@/components/rapports/RapportsPage";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export default async function RapportsPageRoute() {
  await requireAuth();

  const now = new Date();
  const debut = startOfMonth(subMonths(now, 2));
  const fin = endOfMonth(now);

  const [productions, mortalites, ventes, achats] = await Promise.all([
    prisma.production.findMany({
      where: { date: { gte: debut, lte: fin } },
      orderBy: { date: "asc" },
      include: { troupeau: { select: { id: true, nom: true, nombreActuel: true } } },
    }),
    prisma.mortalite.findMany({
      where: { date: { gte: debut, lte: fin } },
      orderBy: { date: "asc" },
      include: { troupeau: { select: { id: true, nom: true } } },
    }),
    prisma.vente.findMany({
      where: { date: { gte: debut, lte: fin } },
      orderBy: { date: "asc" },
      include: { client: { select: { id: true, nom: true } }, lignes: true },
    }),
    prisma.achatAliment.findMany({
      where: { date: { gte: debut, lte: fin } },
      orderBy: { date: "asc" },
      include: { aliment: { select: { id: true, nom: true, unite: true } } },
    }),
  ]);

  return <RapportsPage productions={productions} mortalites={mortalites} ventes={ventes} achats={achats} />;
}
