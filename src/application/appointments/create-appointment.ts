import {
  hasAppointmentConflict,
  isAppointmentPeriodValid,
  type AppointmentPeriod
} from "../../domain/appointments/appointment.js";

import type { AppointmentRepository } from "./appointment-repository.js";

export class InvalidAppointmentPeriodError extends Error {
  constructor() {
    super("Appointment start must be before its end");
    this.name = "InvalidAppointmentPeriodError";
  }
}

export class AppointmentConflictError extends Error {
  constructor() {
    super("The resource already has an appointment during this period");
    this.name = "AppointmentConflictError";
  }
}

export class CreateAppointment {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(appointment: AppointmentPeriod): Promise<AppointmentPeriod> {
    if (!isAppointmentPeriodValid(appointment)) {
      throw new InvalidAppointmentPeriodError();
    }

    const existingAppointments = await this.repository.findByResourceId(
      appointment.resourceId
    );

    const hasConflict = existingAppointments.some((existingAppointment) =>
      hasAppointmentConflict(existingAppointment, appointment)
    );

    if (hasConflict) {
      throw new AppointmentConflictError();
    }

    return this.repository.create(appointment);
  }
}