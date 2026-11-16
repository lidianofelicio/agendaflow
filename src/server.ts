import { buildApp } from "./app.js";
import { prisma } from "./infra/database/prisma-client.js";
import { PrismaAppointmentRepository } from "./infra/repositories/prisma-appointment-repository.js";

const repository = new PrismaAppointmentRepository(prisma);
const app = buildApp(repository);

async function start() {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0"
    });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function shutdown() {
  await app.close();
  await prisma.$disconnect();
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void start();