import Fastify from "fastify";

import type { AppointmentRepository } from "./application/appointments/appointment-repository.js";
import { CreateAppointment } from "./application/appointments/create-appointment.js";
import { ListAppointments } from "./application/appointments/list-appointments.js";
import { appointmentRoutes } from "./http/routes/appointments.js";

export function buildApp(repository: AppointmentRepository) {
  const app = Fastify({
    logger: true
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  const createAppointment = new CreateAppointment(repository);
  const listAppointments = new ListAppointments(repository);

  app.register(appointmentRoutes, {
    createAppointment,
    listAppointments
  });

  return app;
}