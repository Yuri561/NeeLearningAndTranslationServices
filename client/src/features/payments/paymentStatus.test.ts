import { describe, expect, it } from "vitest";
import { bookingPaymentStatus, isPaymentCompleted, paymentStatusName } from "./paymentStatus";

describe("payment status helpers", () => {
  it("only treats explicit paid states as completed", () => {
    expect(isPaymentCompleted("COMPLETED")).toBe(true);
    expect(isPaymentCompleted("Paid")).toBe(true);
    expect(isPaymentCompleted("Pending")).toBe(false);
    expect(isPaymentCompleted(undefined)).toBe(false);
  });

  it("does not invent a backend payment state", () => {
    expect(paymentStatusName(undefined)).toBe("Payment status unavailable");
  });

  it("uses the current backend paid booking status as payment completion", () => {
    expect(bookingPaymentStatus(undefined, "paid")).toBe("paid");
    expect(bookingPaymentStatus("COMPLETED", "Pending")).toBe("COMPLETED");
    expect(bookingPaymentStatus(undefined, "Pending")).toBeNull();
  });
});
