import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/ventes/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const vente = await prisma.vente.findUnique({ where: { id } });
  if (!vente) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

  const montantPaye = Number(body.montantPaye ?? vente.montantPaye);
  const statut =
    montantPaye >= vente.total ? "PAYEE" : montantPaye > 0 ? "PARTIELLE" : "EN_ATTENTE";

  const v = await prisma.vente.update({
    where: { id },
    data: { montantPaye, statut, ...( body.notes !== undefined && { notes: body.notes }) },
    include: { client: { select: { id: true, nom: true } }, lignes: true },
  });
  return NextResponse.json(v);
}
