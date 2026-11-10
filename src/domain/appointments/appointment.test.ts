import { describe, expect, it } from "vitest";

import { hasAppointmentConflict } from "./appointment.js";

describe("hasAppointmentConflict", () => {
  it("detecta conflito de horários para o mesmo recurso", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:30:00.000Z"),
      endsAt: new Date("2026-11-10T11:30:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(true);
  });
});