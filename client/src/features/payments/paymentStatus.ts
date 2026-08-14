export const paymentStatusName = (status?: string | null) =>
  status?.trim() || "Payment status unavailable";

export const isPaymentCompleted = (status?: string | null) =>
  ["completed", "paid"].includes(status?.trim().toLowerCase() ?? "");

export const bookingPaymentStatus = (paymentStatus?: string | null, bookingStatus?: string | null) =>
  paymentStatus || (isPaymentCompleted(bookingStatus) ? bookingStatus : null);
