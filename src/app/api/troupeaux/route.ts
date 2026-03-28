import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const troupeaux = await prisma.troupeau.findMany({
    where: { actif: true },
    orderBy: { dateArrivee: "desc" },
    include: { poulailler: { select: { id: true, nom: true } } },
  });
  return NextResponse.json(troupeaux);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { nom, race, nombreDebut, dateArrivee, poulaillerId } = body;
  if (!nom || !race || !nombreDebut || !dateArrivee || !poulaillerId) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const t = await prisma.troupeau.create({
    data: {
      nom,
      race,
      nombreDebut: Number(nombreDebut),
      nombreActuel: Number(nombreDebut),
      dateArrivee: new Date(dateArrivee),
      poulaillerId,
    },
    include: { poulailler: { select: { id: true, nom: true } } },
  });
  return NextResponse.json(t, { status: 201 });
}
