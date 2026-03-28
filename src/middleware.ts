import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const publicRoutes = ["/login", "/setup"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicRoutes.some((r) => path.startsWith(r));

  const token = req.cookies.get("session")?.value;
  const session = token ? await decrypt(token) : null;

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (session && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
