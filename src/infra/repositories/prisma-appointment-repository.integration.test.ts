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
  await prisma.appointment.deleteMany();
  await app.close();
  await prisma.$disconnect();
});

describe("POST /appointments com PostgreSQL", () => {
  it("grava um agendamento no banco", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-10T10:00:00.000Z",
        endsAt: "2026-11-10T11:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      resourceId: "sala-1",
      startsAt: "2026-11-10T10:00:00.000Z",
      endsAt: "2026-11-10T11:00:00.000Z"
    });

    const records = await prisma.appointment.findMany();
    expect(records).toHaveLength(1);
    expect(records[0]?.resourceId).toBe("sala-1");
  });

  it("retorna 409 e não grava quando existe conflito", async () => {
    await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-10T10:00:00.000Z",
        endsAt: "2026-11-10T11:00:00.000Z"
      }
    });

    const conflictResponse = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-10T10:30:00.000Z",
        endsAt: "2026-11-10T11:30:00.000Z"
      }
    });

    expect(conflictResponse.statusCode).toBe(409);

    const records = await prisma.appointment.findMany();
    expect(records).toHaveLength(1);
  });
});

describe("GET /appointments com PostgreSQL", () => {
  it("lista agendamentos ativos com todos os campos e ignora cancelados", async () => {
    await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-2",
        startsAt: "2026-11-20T14:00:00.000Z",
        endsAt: "2026-11-20T15:00:00.000Z"
      }
    });

    await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-20T09:00:00.000Z",
        endsAt: "2026-11-20T10:00:00.000Z"
      }
    });

    await prisma.appointment.create({
      data: {
        resourceId: "sala-1",
        startsAt: new Date("2026-11-20T11:00:00.000Z"),
        endsAt: new Date("2026-11-20T12:00:00.000Z"),
        status: "CANCELLED"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/appointments"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: expect.any(String),
        resourceId: "sala-1",
        startsAt: "2026-11-20T09:00:00.000Z",
        endsAt: "2026-11-20T10:00:00.000Z",
        status: "ACTIVE",
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      },
      {
        id: expect.any(String),
        resourceId: "sala-2",
        startsAt: "2026-11-20T14:00:00.000Z",
        endsAt: "2026-11-20T15:00:00.000Z",
        status: "ACTIVE",
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ]);
  });

  it("filtra agendamentos por resourceId e janela de datas no PostgreSQL", async () => {
    await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-20T08:00:00.000Z",
        endsAt: "2026-11-20T09:00:00.000Z"
      }
    });

    await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-20T10:00:00.000Z",
        endsAt: "2026-11-20T11:00:00.000Z"
      }
    });

    await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-2",
        startsAt: "2026-11-20T10:00:00.000Z",
        endsAt: "2026-11-20T11:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/appointments?resourceId=sala-1&startsAt=2026-11-20T09:30:00.000Z&endsAt=2026-11-20T12:00:00.000Z"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: expect.any(String),
        resourceId: "sala-1",
        startsAt: "2026-11-20T10:00:00.000Z",
        endsAt: "2026-11-20T11:00:00.000Z",
        status: "ACTIVE",
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ]);
  });
});

describe("Proteção contra concorrência com PostgreSQL", () => {
  it("grava apenas um agendamento e retorna 409 na tentativa simultânea conflitante", async () => {
    const payload = {
      resourceId: "sala-concorrencia",
      startsAt: "2026-12-10T10:00:00.000Z",
      endsAt: "2026-12-10T11:00:00.000Z"
    };

    const [firstResponse, secondResponse] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/appointments",
        payload
      }),
      app.inject({
        method: "POST",
        url: "/appointments",
        payload
      })
    ]);

    const statusCodes = [
      firstResponse.statusCode,
      secondResponse.statusCode
    ].sort((a, b) => a - b);

    expect(statusCodes).toEqual([201, 409]);

    const conflictResponse =
      firstResponse.statusCode === 409 ? firstResponse : secondResponse;
    expect(conflictResponse.json()).toMatchObject({
      error: "APPOINTMENT_CONFLICT"
    });

    const records = await prisma.appointment.findMany({
      where: { resourceId: "sala-concorrencia" }
    });
    expect(records).toHaveLength(1);
  });

  it("permite agendamentos simultâneos consecutivos sem sobreposição", async () => {
    const [firstResponse, secondResponse] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/appointments",
        payload: {
          resourceId: "sala-concorrencia",
          startsAt: "2026-12-10T10:00:00.000Z",
          endsAt: "2026-12-10T11:00:00.000Z"
        }
      }),
      app.inject({
        method: "POST",
        url: "/appointments",
        payload: {
          resourceId: "sala-concorrencia",
          startsAt: "2026-12-10T11:00:00.000Z",
          endsAt: "2026-12-10T12:00:00.000Z"
        }
      })
    ]);

    expect([firstResponse.statusCode, secondResponse.statusCode]).toEqual([
      201,
      201
    ]);

    const records = await prisma.appointment.findMany({
      where: { resourceId: "sala-concorrencia" }
    });
    expect(records).toHaveLength(2);
  });
});