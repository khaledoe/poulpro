import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const consommations = await prisma.consommationAliment.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: {
      aliment: { select: { id: true, nom: true, unite: true } },
      troupeau: { select: { id: true, nom: true } },
    },
  });
  return NextResponse.json(consommations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { date, alimentId, troupeauId, quantite, notes } = body;
  if (!date || !alimentId || !troupeauId || !quantite) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const [conso] = await prisma.$transaction([
    prisma.consommationAliment.create({
      data: {
        date: new Date(date),
        alimentId,
        troupeauId,
        quantite: Number(quantite),
        notes,
      },
      include: {
        aliment: { select: { id: true, nom: true, unite: true } },
        troupeau: { select: { id: true, nom: true } },
      },
    }),
    prisma.aliment.update({
      where: { id: alimentId },
      data: { stockActuel: { decrement: Number(quantite) } },
    }),
  ]);

  return NextResponse.json(conso, { status: 201 });
}
