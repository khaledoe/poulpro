import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = Number(searchParams.get("limit") ?? 50);

  const mortalites = await prisma.mortalite.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: { troupeau: { select: { id: true, nom: true } } },
  });
  return NextResponse.json(mortalites);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { date, troupeauId, nombre, cause, notes } = body;
  if (!date || !troupeauId || !nombre) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  // Create mortalite and update troupeau count
  const [m] = await prisma.$transaction([
    prisma.mortalite.create({
      data: { date: new Date(date), troupeauId, nombre: Number(nombre), cause, notes },
      include: { troupeau: { select: { id: true, nom: true } } },
    }),
    prisma.troupeau.update({
      where: { id: troupeauId },
      data: { nombreActuel: { decrement: Number(nombre) } },
    }),
  ]);

  return NextResponse.json(m, { status: 201 });
}
