import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const aliments = await prisma.aliment.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(aliments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { nom, unite, seuilAlerte } = body;
  if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const a = await prisma.aliment.create({
    data: { nom, unite: unite ?? "kg", seuilAlerte: Number(seuilAlerte ?? 100) },
  });
  return NextResponse.json(a, { status: 201 });
}
