import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { TroupeauxList } from "@/components/troupeaux/TroupeauxList";

export default async function TroupeauxPage() {
  await requireAuth();
  const [troupeaux, poulaillers] = await Promise.all([
    prisma.troupeau.findMany({
      where: { actif: true },
      orderBy: { dateArrivee: "desc" },
      include: { poulailler: { select: { id: true, nom: true } } },
    }),
    prisma.poulailler.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);
  return <TroupeauxList initialData={troupeaux} poulaillers={poulaillers} />;
}
