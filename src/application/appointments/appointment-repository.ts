import type { AppointmentPeriod } from "../../domain/appointments/appointment.js";

export type AppointmentStatus = "ACTIVE" | "CANCELLED";

export interface AppointmentRecord {
  id: string;
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAppointmentsFilters {
  resourceId?: string;
  startsAt?: Date;
  endsAt?: Date;
}

export interface AppointmentRepository {
  findByResourceId(resourceId: string): Promise<AppointmentPeriod[]>;
  create(appointment: AppointmentPeriod): Promise<AppointmentPeriod>;
  list(filters?: ListAppointmentsFilters): Promise<AppointmentRecord[]>;
}