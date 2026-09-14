import { PrismaClient } from "@prisma/client";
import { ensureBootstrap } from "../lib/auth/bootstrap";

/*
 * Cria a organização, os setores padrão e o administrador principal
 * (ADMIN_EMAIL / ADMIN_PASSWORD do ambiente). As empresas entram pela tela
 * "Importar da planilha". O mesmo bootstrap roda automaticamente no primeiro login.
 */
const prisma = new PrismaClient();

ensureBootstrap()
  .then((organization) => {
    console.log(`Seed concluído para "${organization.name}".`);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("Defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente para criar o administrador principal.");
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
