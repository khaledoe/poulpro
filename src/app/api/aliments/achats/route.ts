import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const achats = await prisma.achatAliment.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: { aliment: { select: { id: true, nom: true, unite: true } } },
  });
  return NextResponse.json(achats);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { date, alimentId, quantite, prixUnitaire, fournisseur, notes } = body;
  if (!date || !alimentId || !quantite || !prixUnitaire) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const [achat] = await prisma.$transaction([
    prisma.achatAliment.create({
      data: {
        date: new Date(date),
        alimentId,
        quantite: Number(quantite),
        prixUnitaire: Number(prixUnitaire),
        fournisseur,
        notes,
      },
      include: { aliment: { select: { id: true, nom: true, unite: true } } },
    }),
    prisma.aliment.update({
      where: { id: alimentId },
      data: { stockActuel: { increment: Number(quantite) } },
    }),
  ]);

  return NextResponse.json(achat, { status: 201 });
}
