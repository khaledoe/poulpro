import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const poulaillers = await prisma.poulailler.findMany({
    orderBy: { nom: "asc" },
    include: { troupeaux: { where: { actif: true }, select: { id: true, nombreActuel: true } } },
  });
  return NextResponse.json(poulaillers);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { nom, capacite, description } = body;
  if (!nom || !capacite) return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });

  const p = await prisma.poulailler.create({ data: { nom, capacite: Number(capacite), description } });
  return NextResponse.json(p, { status: 201 });
}
