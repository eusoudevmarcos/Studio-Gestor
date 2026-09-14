import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Bloqueia todas as telas para quem não está logado; o login e as rotas do NextAuth ficam livres.
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return token ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};
