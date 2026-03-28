import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/poulaillers/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const p = await prisma.poulailler.update({ where: { id }, data: body });
  return NextResponse.json(p);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/poulaillers/[id]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await ctx.params;
  await prisma.poulailler.update({ where: { id }, data: { actif: false } });
  return NextResponse.json({ ok: true });
}
