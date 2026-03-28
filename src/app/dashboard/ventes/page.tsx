import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { VentesPage } from "@/components/ventes/VentesPage";

export default async function VentesPageRoute() {
  await requireAuth();
  const [ventes, clients] = await Promise.all([
    prisma.vente.findMany({
      orderBy: { date: "desc" }, take: 50,
      include: { client: { select: { id: true, nom: true } }, lignes: true },
    }),
    prisma.client.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  return <VentesPage initialVentes={ventes} initialClients={clients} />;
}
