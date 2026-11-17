import { describe, expect, it } from "vitest";

import {
  hasAppointmentConflict,
  isAppointmentPeriodValid
} from "./appointment.js";

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
    it("permite o mesmo horário para recursos diferentes", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-2",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(false);
  });
    it("permite agendamentos consecutivos para o mesmo recurso", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T11:00:00.000Z"),
      endsAt: new Date("2026-11-10T12:00:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(false);
    });
  });
  describe("isAppointmentPeriodValid", () => {
  it("aceita um período com início anterior ao término", () => {
    const appointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T11:00:00.000Z")
    };

    expect(isAppointmentPeriodValid(appointment)).toBe(true);
  });

  it("rejeita um período com início igual ao término", () => {
    const appointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T10:00:00.000Z"),
      endsAt: new Date("2026-11-10T10:00:00.000Z")
    };

    expect(isAppointmentPeriodValid(appointment)).toBe(false);
  });

  it("rejeita um período com início posterior ao término", () => {
    const appointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-11-10T11:00:00.000Z"),
      endsAt: new Date("2026-11-10T10:00:00.000Z")
    };

    expect(isAppointmentPeriodValid(appointment)).toBe(false);
  });
});
describe("hasAppointmentConflict - cenários adicionais", () => {
  it("detecta conflito quando os horários são exatamente iguais", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:00:00.000Z"),
      endsAt: new Date("2026-12-10T11:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:00:00.000Z"),
      endsAt: new Date("2026-12-10T11:00:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(true);
  });

  it("detecta conflito quando o novo horário está dentro do existente", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:00:00.000Z"),
      endsAt: new Date("2026-12-10T12:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:30:00.000Z"),
      endsAt: new Date("2026-12-10T11:00:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(true);
  });

  it("detecta conflito quando o novo horário contém o existente", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:30:00.000Z"),
      endsAt: new Date("2026-12-10T11:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:00:00.000Z"),
      endsAt: new Date("2026-12-10T12:00:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(true);
  });

  it("permite horários totalmente separados para o mesmo recurso", () => {
    const existingAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:00:00.000Z"),
      endsAt: new Date("2026-12-10T11:00:00.000Z")
    };

    const newAppointment = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T13:00:00.000Z"),
      endsAt: new Date("2026-12-10T14:00:00.000Z")
    };

    expect(
      hasAppointmentConflict(existingAppointment, newAppointment)
    ).toBe(false);
  });
});

describe("isAppointmentPeriodValid - datas inválidas", () => {
  it("rejeita data inicial ou final inválida", () => {
    const invalidStart = {
      resourceId: "sala-1",
      startsAt: new Date("data-inválida"),
      endsAt: new Date("2026-12-10T11:00:00.000Z")
    };

    const invalidEnd = {
      resourceId: "sala-1",
      startsAt: new Date("2026-12-10T10:00:00.000Z"),
      endsAt: new Date("data-inválida")
    };

    expect(isAppointmentPeriodValid(invalidStart)).toBe(false);
    expect(isAppointmentPeriodValid(invalidEnd)).toBe(false);
  });
});