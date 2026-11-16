import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

export interface ListAppointmentsFilters {
  resourceId?: string;
  startsAt?: Date;
  endsAt?: Date;
}

export interface AppointmentRepository {
  findByResourceId(resourceId: string): Promise<AppointmentPeriod[]>;
  create(appointment: AppointmentPeriod): Promise<AppointmentPeriod>;
  list(filters?: ListAppointmentsFilters): Promise<AppointmentPeriod[]>;
}