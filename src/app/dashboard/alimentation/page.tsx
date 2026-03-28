import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AlimentationPage } from "@/components/alimentation/AlimentationPage";

export default async function AlimentationPageRoute() {
  await requireAuth();
  const [aliments, achats, consommations, troupeaux] = await Promise.all([
    prisma.aliment.findMany({ orderBy: { nom: "asc" } }),
    prisma.achatAliment.findMany({
      orderBy: { date: "desc" }, take: 30,
      include: { aliment: { select: { id: true, nom: true, unite: true } } },
    }),
    prisma.consommationAliment.findMany({
      orderBy: { date: "desc" }, take: 30,
      include: {
        aliment: { select: { id: true, nom: true, unite: true } },
        troupeau: { select: { id: true, nom: true } },
      },
    }),
    prisma.troupeau.findMany({ where: { actif: true }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
  ]);
  return <AlimentationPage aliments={aliments} achats={achats} consommations={consommations} troupeaux={troupeaux} />;
}
