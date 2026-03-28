import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = Number(searchParams.get("limit") ?? 50);

  const ventes = await prisma.vente.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: {
      client: { select: { id: true, nom: true } },
      lignes: true,
    },
  });
  return NextResponse.json(ventes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { date, clientId, lignes, montantPaye, notes } = body;

  if (!date || !clientId || !lignes?.length) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const total = lignes.reduce(
    (sum: number, l: { quantite: number; prixUnitaire: number }) =>
      sum + Number(l.quantite) * Number(l.prixUnitaire),
    0
  );

  const paye = Number(montantPaye ?? 0);
  const statut = paye >= total ? "PAYEE" : paye > 0 ? "PARTIELLE" : "EN_ATTENTE";

  const v = await prisma.vente.create({
    data: {
      date: new Date(date),
      clientId,
      total,
      montantPaye: paye,
      statut,
      notes,
      lignes: {
        create: lignes.map((l: { produit: string; quantite: number; prixUnitaire: number }) => ({
          produit: l.produit,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
          total: Number(l.quantite) * Number(l.prixUnitaire),
        })),
      },
    },
    include: { client: { select: { id: true, nom: true } }, lignes: true },
  });

  return NextResponse.json(v, { status: 201 });
}
