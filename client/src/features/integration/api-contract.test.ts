import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/apiClient", () => ({ apiRequest: vi.fn() }));

import { apiRequest } from "../../lib/apiClient";
import { bookingsApi } from "../../lib/api/bookings.api";
import { servicesApi } from "../../lib/api/services.api";
import { learnerApi } from "../learner/learnerApi";
import { tutorApi } from "../tutor/tutorApi";
import { paymentApi } from "../payments/paymentApi";

const request = vi.mocked(apiRequest);

describe("live API contract routes", () => {
  beforeEach(() => request.mockReset());

  it("uses role-scoped booking routes instead of downloading every booking", async () => {
    request.mockResolvedValue([]);

    await learnerApi.getBookings(17);
    expect(request).toHaveBeenLastCalledWith("/api/v1/bookings/learner/17", {}, true);

    await tutorApi.getBookings(29);
    expect(request).toHaveBeenLastCalledWith("/api/v1/bookings/tutor/29", {}, true);
  });

  it("uses the current tutor route names for service and admin drill-downs", async () => {
    request.mockResolvedValue([]);

    await tutorApi.getServices({ tutorId: 29 });
    expect(request).toHaveBeenLastCalledWith("/api/v1/services/tutor/29", {}, true);

    await servicesApi.getByTutor(29);
    expect(request).toHaveBeenLastCalledWith("/api/v1/services/tutor/29", {}, true);
  });

  it("uses learner and tutor terminology for admin booking drill-downs", async () => {
    request.mockResolvedValue([]);

    await bookingsApi.getByLearner(17);
    expect(request).toHaveBeenLastCalledWith("/api/v1/bookings/learner/17", {}, true);

    await bookingsApi.getByTutor(29);
    expect(request).toHaveBeenLastCalledWith("/api/v1/bookings/tutor/29", {}, true);
  });

  it("sends the selected service price required by the current booking contract", async () => {
    const payload = {
      learner_id: 17,
      service_id: 5,
      tutor_id: 29,
      availability_id: 31,
      booking_date: "2026-08-20",
      start_time: "10:00:00",
      end_time: "11:00:00",
      total_price: 18.98,
      status: "Pending" as const,
      notes: "Conversation practice",
    };
    request.mockResolvedValue({ id: 1, ...payload });

    await learnerApi.createBooking(payload);
    expect(request).toHaveBeenLastCalledWith(
      "/api/v1/bookings/",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  });

  it("sends only server-owned identifiers to the PayPal endpoints", async () => {
    request.mockResolvedValue({
      paypal_order_id: "ORDER-123",
      status: "CREATED",
      approval_url: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123",
    });

    await paymentApi.createPayPalOrder(41);
    expect(request).toHaveBeenLastCalledWith(
      "/payments/paypal/create-order",
      { method: "POST", body: JSON.stringify({ booking_id: 41 }) },
      true,
    );

    await paymentApi.capturePayPalOrder("ORDER-123");
    expect(request).toHaveBeenLastCalledWith(
      "/payments/paypal/capture-order",
      { method: "POST", body: JSON.stringify({ paypal_order_id: "ORDER-123" }) },
      true,
    );
  });
});
