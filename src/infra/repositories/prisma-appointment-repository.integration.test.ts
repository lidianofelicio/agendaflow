import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../app.js";
import { prisma } from "../database/prisma-client.js";

import { PrismaAppointmentRepository } from "./prisma-appointment-repository.js";

const repository = new PrismaAppointmentRepository(prisma);
const app = buildApp(repository);

beforeEach(async () => {
  await prisma.appointment.deleteMany();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("POST /appointments com PostgreSQL", () => {
  it("grava um agendamento no banco", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-integracao-1",
        startsAt: "2026-12-10T10:00:00.000Z",
        endsAt: "2026-12-10T11:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(201);

    const appointments = await prisma.appointment.findMany();

    expect(appointments).toHaveLength(1);
    expect(appointments[0]).toMatchObject({
      resourceId: "sala-integracao-1",
      status: "ACTIVE"
    });
  });

  it("retorna 409 e não grava quando existe conflito", async () => {
    const firstResponse = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-integracao-2",
        startsAt: "2026-12-10T10:00:00.000Z",
        endsAt: "2026-12-10T11:00:00.000Z"
      }
    });

    const conflictingResponse = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-integracao-2",
        startsAt: "2026-12-10T10:30:00.000Z",
        endsAt: "2026-12-10T11:30:00.000Z"
      }
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(conflictingResponse.statusCode).toBe(409);
    expect(await prisma.appointment.count()).toBe(1);
  });
});