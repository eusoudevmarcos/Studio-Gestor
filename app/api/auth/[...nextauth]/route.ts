import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

// No Render, a URL pública vem em RENDER_EXTERNAL_URL; dispensa configurar NEXTAUTH_URL à mão.
if (!process.env.NEXTAUTH_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.NEXTAUTH_URL = process.env.RENDER_EXTERNAL_URL;
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
