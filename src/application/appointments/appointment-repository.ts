import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

export interface AppointmentRepository {
  findByResourceId(resourceId: string): Promise<AppointmentPeriod[]>;

  create(appointment: AppointmentPeriod): Promise<AppointmentPeriod>;
}