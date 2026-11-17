import { Prisma, type PrismaClient } from "@prisma/client";

import type {
  AppointmentRecord,
  AppointmentRepository,
  AppointmentStatus,
  ListAppointmentsFilters
} from "../../application/appointments/appointment-repository.js";
import { AppointmentConflictError } from "../../application/appointments/create-appointment.js";
import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

function isSerializationFailure(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") {
      return true;
    }

    const metaCode =
      typeof error.meta?.code === "string" ? error.meta.code : undefined;
    if (metaCode === "40001") {
      return true;
    }
  }

  return error instanceof Error && error.message.includes("40001");
}

function isExclusionConstraintConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const metaCode =
      typeof error.meta?.code === "string" ? error.meta.code : undefined;
    if (metaCode === "23P01") {
      return true;
    }
  }

  if (error instanceof Error) {
    return (
      error.message.includes("23P01") ||
      error.message.includes("appointments_no_overlapping_active")
    );
  }

  return false;
}

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
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const conflictingAppointment = await tx.appointment.findFirst({
              where: {
                resourceId: appointment.resourceId,
                status: "ACTIVE",
                startsAt: { lt: appointment.endsAt },
                endsAt: { gt: appointment.startsAt }
              },
              select: { id: true }
            });

            if (conflictingAppointment) {
              throw new AppointmentConflictError();
            }

            return tx.appointment.create({
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
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable
          }
        );
      } catch (error) {
        if (error instanceof AppointmentConflictError) {
          throw error;
        }

        if (isExclusionConstraintConflict(error)) {
          throw new AppointmentConflictError();
        }

        if (isSerializationFailure(error)) {
          if (attempt < maxAttempts) {
            continue;
          }

          throw new AppointmentConflictError();
        }

        throw error;
      }
    }

    throw new AppointmentConflictError();
  }

  async list(filters?: ListAppointmentsFilters): Promise<AppointmentRecord[]> {
    const appointments = await this.prisma.appointment.findMany({
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
        id: true,
        resourceId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      resourceId: appointment.resourceId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status as AppointmentStatus,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }));
  }
}