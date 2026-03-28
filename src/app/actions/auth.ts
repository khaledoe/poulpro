"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: "Email ou mot de passe incorrect" };

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) return { error: "Email ou mot de passe incorrect" };

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function setupAdmin(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const count = await prisma.user.count();
  if (count > 0) return { error: "Un administrateur existe déjà" };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Tous les champs sont requis" };
  if (password.length < 6) return { error: "Mot de passe trop court (min 6 caractères)" };

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "ADMIN" },
  });

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/dashboard");
}
