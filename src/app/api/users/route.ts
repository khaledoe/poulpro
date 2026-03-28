import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password, role } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mot de passe trop court" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role ?? "WORKER" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
