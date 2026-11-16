import type { FastifyInstance } from "fastify";

import {
  AppointmentConflictError,
  InvalidAppointmentPeriodError,
  type CreateAppointment
} from "../../application/appointments/create-appointment.js";
import {
  InvalidAppointmentQueryError,
  type ListAppointments
} from "../../application/appointments/list-appointments.js";

type AppointmentRoutesOptions = {
  createAppointment: CreateAppointment;
  listAppointments: ListAppointments;
};

type CreateAppointmentBody = {
  resourceId: string;
  startsAt: string;
  endsAt: string;
};

type ListAppointmentsQuerystring = {
  resourceId?: string;
  startsAt?: string;
  endsAt?: string;
};

export async function appointmentRoutes(
  app: FastifyInstance,
  options: AppointmentRoutesOptions
): Promise<void> {
  app.get<{ Querystring: ListAppointmentsQuerystring }>(
    "/appointments",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            resourceId: {
              type: "string",
              minLength: 1,
              pattern: "\\S"
            },
            startsAt: {
              type: "string",
              format: "date-time"
            },
            endsAt: {
              type: "string",
              format: "date-time"
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { resourceId, startsAt, endsAt } = request.query;

      try {
        const appointments = await options.listAppointments.execute({
          ...(resourceId !== undefined ? { resourceId } : {}),
          ...(startsAt !== undefined ? { startsAt: new Date(startsAt) } : {}),
          ...(endsAt !== undefined ? { endsAt: new Date(endsAt) } : {})
        });

        return reply.status(200).send(
          appointments.map((appointment) => ({
            id: appointment.id,
            resourceId: appointment.resourceId,
            startsAt: appointment.startsAt.toISOString(),
            endsAt: appointment.endsAt.toISOString(),
            status: appointment.status,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString()
          }))
        );
      } catch (error) {
        if (error instanceof InvalidAppointmentQueryError) {
          return reply.status(400).send({
            error: "INVALID_APPOINTMENT_QUERY",
            message: error.message
          });
        }

        throw error;
      }
    }
  );

  app.post<{ Body: CreateAppointmentBody }>(
    "/appointments",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["resourceId", "startsAt", "endsAt"],
          properties: {
            resourceId: {
              type: "string",
              minLength: 1,
              pattern: "\\S"
            },
            startsAt: {
              type: "string",
              format: "date-time"
            },
            endsAt: {
              type: "string",
              format: "date-time"
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { resourceId, startsAt, endsAt } = request.body;

      try {
        const appointment = await options.createAppointment.execute({
          resourceId: resourceId.trim(),
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt)
        });

        return reply.status(201).send({
          resourceId: appointment.resourceId,
          startsAt: appointment.startsAt.toISOString(),
          endsAt: appointment.endsAt.toISOString()
        });
      } catch (error) {
        if (error instanceof InvalidAppointmentPeriodError) {
          return reply.status(400).send({
            error: "INVALID_APPOINTMENT_PERIOD",
            message: error.message
          });
        }

        if (error instanceof AppointmentConflictError) {
          return reply.status(409).send({
            error: "APPOINTMENT_CONFLICT",
            message: error.message
          });
        }

        throw error;
      }
    }
  );
}