export type AppointmentPeriod = {
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
};

export function hasAppointmentConflict(
  existingAppointment: AppointmentPeriod,
  newAppointment: AppointmentPeriod
): boolean {
  if (existingAppointment.resourceId !== newAppointment.resourceId) {
    return false;
  }

  return (
    existingAppointment.startsAt < newAppointment.endsAt &&
    newAppointment.startsAt < existingAppointment.endsAt
  );
}