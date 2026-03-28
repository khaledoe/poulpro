import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ParametresPage } from "@/components/parametres/ParametresPage";

export default async function ParametresPageRoute() {
  const session = await requireAuth();
  const users = await prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return <ParametresPage users={users} currentUserId={session.userId} />;
}
