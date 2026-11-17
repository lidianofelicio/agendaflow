import Fastify from "fastify";

import type { AppointmentRepository } from "./application/appointments/appointment-repository.js";
import { CreateAppointment } from "./application/appointments/create-appointment.js";
import { ListAppointments } from "./application/appointments/list-appointments.js";
import { appointmentRoutes } from "./http/routes/appointments.js";

const SERVICE_SLO = {
  availabilityTarget: 0.995,
  latencyP95TargetMs: 200
} as const;

export function buildApp(repository: AppointmentRepository) {
  const app = Fastify({
    logger: {
      base: {
        service: "agendaflow"
      }
    }
  });

  const metrics = {
    httpRequestsTotal: 0,
    appointmentsCreatedTotal: 0,
    appointmentsConflictTotal: 0,
    serverErrorsTotal: 0,
    totalDurationMs: 0,
    maxDurationMs: 0
  };

  app.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url ?? request.url;
    const durationMs = Number(reply.elapsedTime.toFixed(2));

    metrics.httpRequestsTotal += 1;
    metrics.totalDurationMs += durationMs;
    if (durationMs > metrics.maxDurationMs) {
      metrics.maxDurationMs = durationMs;
    }

    if (request.method === "POST" && route === "/appointments") {
      if (reply.statusCode === 201) {
        metrics.appointmentsCreatedTotal += 1;
      } else if (reply.statusCode === 409) {
        metrics.appointmentsConflictTotal += 1;
      }
    }

    if (reply.statusCode >= 500) {
      metrics.serverErrorsTotal += 1;
    }

    request.log.info(
      {
        event: "http_request_completed",
        method: request.method,
        route,
        statusCode: reply.statusCode,
        durationMs
      },
      "HTTP request completed"
    );
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/metrics", async () => {
    const averageDurationMs =
      metrics.httpRequestsTotal > 0
        ? Number((metrics.totalDurationMs / metrics.httpRequestsTotal).toFixed(2))
        : 0;

    const observedAvailability =
      metrics.httpRequestsTotal > 0
        ? Number(
            (
              (metrics.httpRequestsTotal - metrics.serverErrorsTotal) /
              metrics.httpRequestsTotal
            ).toFixed(4)
          )
        : 1;

    return {
      service: "agendaflow",
      slo: SERVICE_SLO,
      metrics: {
        httpRequestsTotal: metrics.httpRequestsTotal,
        appointmentsCreatedTotal: metrics.appointmentsCreatedTotal,
        appointmentsConflictTotal: metrics.appointmentsConflictTotal,
        serverErrorsTotal: metrics.serverErrorsTotal,
        averageDurationMs,
        maxDurationMs: metrics.maxDurationMs,
        observedAvailability
      }
    };
  });

  const createAppointment = new CreateAppointment(repository);
  const listAppointments = new ListAppointments(repository);

  app.register(appointmentRoutes, {
    createAppointment,
    listAppointments
  });

  return app;
}