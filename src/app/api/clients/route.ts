import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { nom, telephone, email, adresse } = body;
  if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const c = await prisma.client.create({ data: { nom, telephone, email, adresse } });
  return NextResponse.json(c, { status: 201 });
}
