import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";
import type {
  AppointmentRecord,
  AppointmentRepository,
  ListAppointmentsFilters
} from "./appointment-repository.js";
import {
  AppointmentConflictError,
  CreateAppointment,
  InvalidAppointmentPeriodError
} from "./create-appointment.js";

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

describe("CreateAppointment", () => {
  it("cria um agendamento válido e sem conflito", async () => {
    const repository = new InMemoryAppointmentRepository();
    const createAppointment = new CreateAppointment(repository);

    const appointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    };

    await expect(createAppointment.execute(appointment)).resolves.toEqual(
      appointment
    );
    expect(repository.items).toHaveLength(1);
  });

  it("rejeita um agendamento com período inválido", async () => {
    const repository = new InMemoryAppointmentRepository();
    const createAppointment = new CreateAppointment(repository);

    const appointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T11:00:00.000Z"),
      endsAt: new Date("2026-11-10T10:00:00.000Z")
    };

    await expect(createAppointment.execute(appointment)).rejects.toBeInstanceOf(
      InvalidAppointmentPeriodError
    );
    expect(repository.items).toHaveLength(0);
  });

  it("rejeita um agendamento que conflita com outro existente", async () => {
    const repository = new InMemoryAppointmentRepository();
    const createAppointment = new CreateAppointment(repository);

    await repository.create({
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    });

    const appointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:30:00.000Z"),
      endsAt: new Date("2026-11-10T11:30:00.000Z")
    };

    await expect(createAppointment.execute(appointment)).rejects.toBeInstanceOf(
      AppointmentConflictError
    );
    expect(repository.items).toHaveLength(1);
  });
});