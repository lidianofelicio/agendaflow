import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import type {
  AppointmentRecord,
  AppointmentRepository,
  ListAppointmentsFilters
} from "./application/appointments/appointment-repository.js";
import type { AppointmentPeriod } from "./domain/appointments/appointment.js";

class InMemoryAppointmentRepository implements AppointmentRepository {
  readonly items: AppointmentRecord[] = [];

  async findByResourceId(resourceId: string): Promise<AppointmentPeriod[]> {
    return this.items
      .filter((item) => item.resourceId === resourceId)
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
    return this.items.filter((item) => {
      if (filters?.resourceId && item.resourceId !== filters.resourceId) {
        return false;
      }
      return true;
    });
  }
}

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("Observabilidade e SLO (/health e /metrics)", () => {
  it("expõe /health e contabiliza métricas e SLO em /metrics", async () => {
    const app = buildApp(new InMemoryAppointmentRepository());
    apps.push(app);

    const healthResponse = await app.inject({
      method: "GET",
      url: "/health"
    });
    expect(healthResponse.statusCode).toBe(200);
    expect(healthResponse.json()).toEqual({ status: "ok" });

    const createResponse = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-observabilidade",
        startsAt: "2026-12-20T10:00:00.000Z",
        endsAt: "2026-12-20T11:00:00.000Z"
      }
    });
    expect(createResponse.statusCode).toBe(201);

    const conflictResponse = await app.inject({
      method: "POST",
      url: "/appointments",
      payload: {
        resourceId: "sala-observabilidade",
        startsAt: "2026-12-20T10:30:00.000Z",
        endsAt: "2026-12-20T11:30:00.000Z"
      }
    });
    expect(conflictResponse.statusCode).toBe(409);

    const metricsResponse = await app.inject({
      method: "GET",
      url: "/metrics"
    });

    expect(metricsResponse.statusCode).toBe(200);
    expect(metricsResponse.json()).toMatchObject({
      service: "agendaflow",
      slo: {
        availabilityTarget: 0.995,
        latencyP95TargetMs: 200
      },
      metrics: {
        httpRequestsTotal: 3,
        appointmentsCreatedTotal: 1,
        appointmentsConflictTotal: 1,
        serverErrorsTotal: 0,
        observedAvailability: 1
      }
    });
  });
});