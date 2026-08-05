import { describe, expect, it } from "vitest";
import type { Availability, AvailabilityFormValue } from "./availability.types";
import {
  sortAvailability,
  toLocalAvailability,
  toUtcRequest,
  validateAvailabilityRows,
} from "./availability.utils";

const slot = (overrides: Partial<Availability> = {}): Availability => ({
  id: 1,
  day: "Monday",
  start_time: "09:00",
  end_time: "12:00",
  is_active: true,
  ...overrides,
});

const form = (overrides: Partial<AvailabilityFormValue> = {}): AvailabilityFormValue => ({
  day: "Monday",
  start_time: "12:00",
  end_time: "13:00",
  is_active: true,
  ...overrides,
});

describe("availability validation", () => {
  it("rejects an end time that is not later than the start", () => {
    expect(
      validateAvailabilityRows([form({ start_time: "14:00", end_time: "10:00" })], [])
    ).toContain("later than the start time");
  });

  it("rejects exact duplicates", () => {
    expect(validateAvailabilityRows([form({ start_time: "09:00", end_time: "12:00" })], [slot()]))
      .toContain("identical");
  });

  it("rejects overlaps but accepts adjacent slots", () => {
    expect(validateAvailabilityRows([form({ start_time: "11:00", end_time: "14:00" })], [slot()]))
      .toContain("overlaps");
    expect(validateAvailabilityRows([form()], [slot()])).toBeNull();
  });

  it("excludes the current slot during edit validation", () => {
    expect(
      validateAvailabilityRows(
        [form({ start_time: "09:00", end_time: "12:00" })],
        [slot()],
        1
      )
    ).toBeNull();
  });

  it("detects conflicts between rows in one bulk submission", () => {
    expect(
      validateAvailabilityRows(
        [form({ start_time: "09:00", end_time: "12:00" }), form({ start_time: "10:00" })],
        []
      )
    ).toContain("overlaps");
  });
});

describe("availability time helpers", () => {
  it("round-trips a local slot through the backend UTC representation", () => {
    const local = form({ day: "Wednesday", start_time: "10:00", end_time: "11:30" });
    const utc = toUtcRequest(local);
    expect("error" in utc).toBe(false);
    if ("error" in utc) return;
    const roundTrip = toLocalAvailability({ id: 9, ...utc });
    expect(roundTrip).toMatchObject(local);
  });

  it("sorts by weekday and then start time", () => {
    expect(
      sortAvailability([
        slot({ id: 3, day: "Tuesday", start_time: "08:00" }),
        slot({ id: 2, start_time: "13:00" }),
        slot({ id: 1, start_time: "08:00" }),
      ]).map((item) => item.id)
    ).toEqual([1, 2, 3]);
  });
});

