import type {
  AppointmentRecord,
  AppointmentRepository,
  ListAppointmentsFilters
} from "./appointment-repository.js";

export class InvalidAppointmentQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAppointmentQueryError";
  }
}

export class ListAppointments {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(
    filters?: ListAppointmentsFilters
  ): Promise<AppointmentRecord[]> {
    if (filters?.resourceId !== undefined && filters.resourceId.trim() === "") {
      throw new InvalidAppointmentQueryError("resourceId cannot be empty");
    }

    if (filters?.startsAt && Number.isNaN(filters.startsAt.getTime())) {
      throw new InvalidAppointmentQueryError("Invalid startsAt date");
    }

    if (filters?.endsAt && Number.isNaN(filters.endsAt.getTime())) {
      throw new InvalidAppointmentQueryError("Invalid endsAt date");
    }

    if (
      filters?.startsAt &&
      filters?.endsAt &&
      filters.startsAt >= filters.endsAt
    ) {
      throw new InvalidAppointmentQueryError("startsAt must be before endsAt");
    }

    return this.repository.list({
      ...(filters?.resourceId ? { resourceId: filters.resourceId.trim() } : {}),
      ...(filters?.startsAt ? { startsAt: filters.startsAt } : {}),
      ...(filters?.endsAt ? { endsAt: filters.endsAt } : {})
    });
  }
}