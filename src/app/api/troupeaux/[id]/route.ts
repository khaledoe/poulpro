import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/troupeaux/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const t = await prisma.troupeau.update({
    where: { id },
    data: {
      ...body,
      nombreDebut: body.nombreDebut ? Number(body.nombreDebut) : undefined,
      nombreActuel: body.nombreActuel ? Number(body.nombreActuel) : undefined,
      dateArrivee: body.dateArrivee ? new Date(body.dateArrivee) : undefined,
    },
    include: { poulailler: { select: { id: true, nom: true } } },
  });
  return NextResponse.json(t);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/troupeaux/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await ctx.params;
  await prisma.troupeau.update({ where: { id }, data: { actif: false } });
  return NextResponse.json({ ok: true });
}
