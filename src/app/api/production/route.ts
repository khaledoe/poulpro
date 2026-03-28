import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = Number(searchParams.get("limit") ?? 50);
  const troupeauId = searchParams.get("troupeauId");

  const productions = await prisma.production.findMany({
    where: troupeauId ? { troupeauId } : undefined,
    orderBy: { date: "desc" },
    take: limit,
    include: { troupeau: { select: { id: true, nom: true, nombreActuel: true } } },
  });
  return NextResponse.json(productions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { date, troupeauId, oeufsTotaux, oeufsCasses, oeufsSales, notes } = body;
  if (!date || !troupeauId || oeufsTotaux === undefined) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const p = await prisma.production.upsert({
    where: { date_troupeauId: { date: new Date(date), troupeauId } },
    create: {
      date: new Date(date),
      troupeauId,
      oeufsTotaux: Number(oeufsTotaux),
      oeufsCasses: Number(oeufsCasses ?? 0),
      oeufsSales: Number(oeufsSales ?? 0),
      notes,
    },
    update: {
      oeufsTotaux: Number(oeufsTotaux),
      oeufsCasses: Number(oeufsCasses ?? 0),
      oeufsSales: Number(oeufsSales ?? 0),
      notes,
    },
    include: { troupeau: { select: { id: true, nom: true, nombreActuel: true } } },
  });
  return NextResponse.json(p, { status: 201 });
}
