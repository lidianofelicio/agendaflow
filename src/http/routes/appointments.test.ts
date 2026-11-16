import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import type { AppointmentRepository } from "../../application/appointments/appointment-repository.js";
import { CreateAppointment } from "../../application/appointments/create-appointment.js";
import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

import { appointmentRoutes } from "./appointments.js";

class InMemoryAppointmentRepository implements AppointmentRepository {
  readonly items: AppointmentPeriod[] = [];

  async findByResourceId(resourceId: string): Promise<AppointmentPeriod[]> {
    return this.items.filter(
      (appointment) => appointment.resourceId === resourceId
    );
  }

  async create(appointment: AppointmentPeriod): Promise<AppointmentPeriod> {
    this.items.push(appointment);

    return appointment;
  }
}

const apps: FastifyInstance[] = [];

function buildTestApp() {
  const repository = new InMemoryAppointmentRepository();
  const createAppointment = new CreateAppointment(repository);
  const app = Fastify();

  app.register(appointmentRoutes, {
    createAppointment
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

    repository.items.push({
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