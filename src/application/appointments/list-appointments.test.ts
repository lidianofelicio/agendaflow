import { describe, expect, it } from "vitest";

import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";
import type {
  AppointmentRepository,
  ListAppointmentsFilters
} from "./appointment-repository.js";
import {
  InvalidAppointmentQueryError,
  ListAppointments
} from "./list-appointments.js";

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

  async list(filters?: ListAppointmentsFilters): Promise<AppointmentPeriod[]> {
    return this.items
      .filter((appointment) => {
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
  it("lista todos os agendamentos quando nenhum filtro é informado", async () => {
    const repository = new InMemoryAppointmentRepository();
    const listAppointments = new ListAppointments(repository);

    const first = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-20T09:00:00.000Z"),
      endsAt: new Date("2026-11-20T10:00:00.000Z")
    };
    const second = {
      resourceId: "sala-2",
      startsAt: new Date("2026-11-20T11:00:00.000Z"),
      endsAt: new Date("2026-11-20T12:00:00.000Z")
    };

    repository.items.push(second, first);

    await expect(listAppointments.execute()).resolves.toEqual([first, second]);
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