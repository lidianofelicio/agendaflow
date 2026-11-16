import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import type {
  AppointmentRecord,
  AppointmentRepository,
  ListAppointmentsFilters
} from "../../application/appointments/appointment-repository.js";
import { CreateAppointment } from "../../application/appointments/create-appointment.js";
import { ListAppointments } from "../../application/appointments/list-appointments.js";
import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

import { appointmentRoutes } from "./appointments.js";

class InMemoryAppointmentRepository implements AppointmentRepository {
  readonly items: AppointmentRecord[] = [];

  async findByResourceId(resourceId: string): Promise<AppointmentPeriod[]> {
    return this.items
      .filter((appointment) => appointment.resourceId === resourceId)
      .map(({ resourceId: id, startsAt, endsAt }) => ({
        resourceId: id,
        startsAt,
        endsAt
      }));
  }

  async create(appointment: AppointmentPeriod): Promise<AppointmentPeriod> {
    const now = new Date();
    this.items.push({
      id: randomUUID(),
      resourceId: appointment.resourceId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now
    });

    return appointment;
  }

  async list(filters?: ListAppointmentsFilters): Promise<AppointmentRecord[]> {
    return this.items
      .filter((appointment) => {
        if (appointment.status !== "ACTIVE") {
          return false;
        }

        if (
          filters?.resourceId &&
          appointment.resourceId !== filters.resourceId
        ) {
          return false;
        }

        if (filters?.endsAt && !(appointment.startsAt < filters.endsAt)) {
          return false;
        }

        if (filters?.startsAt && !(appointment.endsAt > filters.startsAt)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }
}

const apps: FastifyInstance[] = [];

function buildTestApp() {
  const repository = new InMemoryAppointmentRepository();
  const createAppointment = new CreateAppointment(repository);
  const listAppointments = new ListAppointments(repository);
  const app = Fastify();

  app.register(appointmentRoutes, {
    createAppointment,
    listAppointments
  });

  apps.push(app);

  return {
    app,
    repository
  };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("POST /appointments", () => {
  it("retorna 201 ao criar um agendamento válido", async () => {
    const { app, repository } = buildTestApp();

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
    expect(repository.items).toHaveLength(1);
  });

  it("retorna 400 quando o período é inválido", async () => {
    const { app, repository } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-10T11:00:00.000Z",
        endsAt: "2026-11-10T10:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "INVALID_APPOINTMENT_PERIOD"
    });
    expect(repository.items).toHaveLength(0);
  });

  it("retorna 409 quando existe conflito de horário", async () => {
    const { app, repository } = buildTestApp();

    await repository.create({
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    });

    const response = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-1",
        startsAt: "2026-11-10T10:30:00.000Z",
        endsAt: "2026-11-10T11:30:00.000Z"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: "APPOINTMENT_CONFLICT"
    });
    expect(repository.items).toHaveLength(1);
  });

  it("retorna 400 quando os dados obrigatórios são inválidos", async () => {
    const { app, repository } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "",
        startsAt: "data-inválida"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(repository.items).toHaveLength(0);
  });
});

describe("GET /appointments", () => {
  it("retorna 200 com lista vazia quando não há agendamentos", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/appointments"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("retorna 200 com todos os campos obrigatórios ordenados por startsAt", async () => {
    const { app, repository } = buildTestApp();

    await repository.create({
      resourceId: "sala-2",
      startsAt: new Date("2026-11-10T14:00:00.000Z"),
      endsAt: new Date("2026-11-10T15:00:00.000Z")
    });
    await repository.create({
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T09:00:00.000Z"),
      endsAt: new Date("2026-11-10T10:00:00.000Z")
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
        startsAt: "2026-11-10T09:00:00.000Z",
        endsAt: "2026-11-10T10:00:00.000Z",
        status: "ACTIVE",
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      },
      {
        id: expect.any(String),
        resourceId: "sala-2",
        startsAt: "2026-11-10T14:00:00.000Z",
        endsAt: "2026-11-10T15:00:00.000Z",
        status: "ACTIVE",
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ]);
  });

  it("retorna 200 filtrando por resourceId", async () => {
    const { app, repository } = buildTestApp();

    await repository.create({
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T09:00:00.000Z"),
      endsAt: new Date("2026-11-10T10:00:00.000Z")
    });
    await repository.create({
      resourceId: "sala-2",
      startsAt: new Date("2026-11-10T11:00:00.000Z"),
      endsAt: new Date("2026-11-10T12:00:00.000Z")
    });

    const response = await app.inject({
      method: "GET",
      url: "/appointments?resourceId=sala-1"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: expect.any(String),
        resourceId: "sala-1",
        startsAt: "2026-11-10T09:00:00.000Z",
        endsAt: "2026-11-10T10:00:00.000Z",
        status: "ACTIVE",
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ]);
  });

  it("retorna 400 quando os parâmetros de consulta são inválidos", async () => {
    const { app } = buildTestApp();

    const invalidDateResponse = await app.inject({
      method: "GET",
      url: "/appointments?startsAt=data-invalida"
    });
    expect(invalidDateResponse.statusCode).toBe(400);

    const invalidRangeResponse = await app.inject({
      method: "GET",
      url: "/appointments?startsAt=2026-11-10T12:00:00.000Z&endsAt=2026-11-10T10:00:00.000Z"
    });
    expect(invalidRangeResponse.statusCode).toBe(400);
    expect(invalidRangeResponse.json()).toMatchObject({
      error: "INVALID_APPOINTMENT_QUERY"
    });
  });
});