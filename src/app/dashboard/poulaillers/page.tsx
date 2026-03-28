import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PoulaillersList } from "@/components/poulaillers/PoulaillersList";

export default async function PoulaillerPage() {
  await requireAuth();
  const poulaillers = await prisma.poulailler.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    include: {
      troupeaux: { where: { actif: true }, select: { id: true, nom: true, nombreActuel: true } },
    },
  });
  return <PoulaillersList initialData={poulaillers} />;
}
