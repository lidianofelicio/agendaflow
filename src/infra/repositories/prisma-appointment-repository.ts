import type { PrismaClient } from "@prisma/client";

import type {
  AppointmentRepository,
  ListAppointmentsFilters
} from "../../application/appointments/appointment-repository.js";
import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByResourceId(resourceId: string): Promise<AppointmentPeriod[]> {
    return this.prisma.appointment.findMany({
      where: {
        resourceId,
        status: "ACTIVE"
      },
      select: {
        resourceId: true,
        startsAt: true,
        endsAt: true
      }
    });
  }

  async create(appointment: AppointmentPeriod): Promise<AppointmentPeriod> {
    return this.prisma.appointment.create({
      data: {
        resourceId: appointment.resourceId,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt
      },
      select: {
        resourceId: true,
        startsAt: true,
        endsAt: true
      }
    });
  }

  async list(filters?: ListAppointmentsFilters): Promise<AppointmentPeriod[]> {
    return this.prisma.appointment.findMany({
      where: {
        status: "ACTIVE",
        ...(filters?.resourceId ? { resourceId: filters.resourceId } : {}),
        ...(filters?.endsAt ? { startsAt: { lt: filters.endsAt } } : {}),
        ...(filters?.startsAt ? { endsAt: { gt: filters.startsAt } } : {})
      },
      orderBy: {
        startsAt: "asc"
      },
      select: {
        resourceId: true,
        startsAt: true,
        endsAt: true
      }
    });
  }
}