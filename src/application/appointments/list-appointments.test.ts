import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";
import type {
  AppointmentRecord,
  AppointmentRepository,
  ListAppointmentsFilters
} from "./appointment-repository.js";
import {
  InvalidAppointmentQueryError,
  ListAppointments
} from "./list-appointments.js";

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

describe("ListAppointments", () => {
  it("lista todos os agendamentos ordenados por startsAt", async () => {
    const repository = new InMemoryAppointmentRepository();
    const listAppointments = new ListAppointments(repository);

    await repository.create({
      resourceId: "sala-2",
      startsAt: new Date("2026-11-20T11:00:00.000Z"),
      endsAt: new Date("2026-11-20T12:00:00.000Z")
    });
    await repository.create({
      resourceId: "sala-1",
      startsAt: new Date("2026-11-20T09:00:00.000Z"),
      endsAt: new Date("2026-11-20T10:00:00.000Z")
    });

    const result = await listAppointments.execute();
    expect(result).toHaveLength(2);
    expect(result[0]?.resourceId).toBe("sala-1");
    expect(result[1]?.resourceId).toBe("sala-2");
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      resourceId: "sala-1",
      status: "ACTIVE",
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });
  });

  it("rejeita resourceId vazio ou datas inválidas", async () => {
    const repository = new InMemoryAppointmentRepository();
    const listAppointments = new ListAppointments(repository);

    await expect(
      listAppointments.execute({ resourceId: "   " })
    ).rejects.toBeInstanceOf(InvalidAppointmentQueryError);

    await expect(
      listAppointments.execute({ startsAt: new Date("invalid") })
    ).rejects.toBeInstanceOf(InvalidAppointmentQueryError);

    await expect(
      listAppointments.execute({
        startsAt: new Date("2026-11-20T12:00:00.000Z"),
        endsAt: new Date("2026-11-20T10:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(InvalidAppointmentQueryError);
  });
});