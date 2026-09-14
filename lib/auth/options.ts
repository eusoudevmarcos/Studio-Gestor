import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ensureBootstrap, normalizeEmail } from "@/lib/auth/bootstrap";
import { loginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma/client";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = normalizeEmail(parsed.data.email);

        // Primeiro acesso de uma instalação nova: cria organização, setores e admin do ambiente.
        if (process.env.ADMIN_EMAIL && normalizeEmail(process.env.ADMIN_EMAIL) === email) {
          await ensureBootstrap();
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organization: true, department: true },
        });

        // Só entra quem foi cadastrado pela Equipe e está ativo.
        if (!user || !user.active) return null;

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          departmentId: user.departmentId,
          departmentName: user.department?.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId ?? "";
        token.organizationName = user.organizationName;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.organizationName = token.organizationName;
        session.user.departmentId = token.departmentId;
        session.user.departmentName = token.departmentName;
      }
      return session;
    },
  },
};
