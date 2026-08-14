import { apiRequest } from "../../lib/apiClient";
import type {
  PayPalCaptureResponse,
  PayPalCreateOrderResponse,
} from "./paymentTypes";

const PAYPAL_PATH = "/payments/paypal";

export const paymentApi = {
  createPayPalOrder: (bookingId: number) =>
    apiRequest<PayPalCreateOrderResponse>(
      `${PAYPAL_PATH}/create-order`,
      {
        method: "POST",
        body: JSON.stringify({ booking_id: bookingId }),
      },
      true,
    ),

  capturePayPalOrder: (paypalOrderId: string) =>
    apiRequest<PayPalCaptureResponse>(
      `${PAYPAL_PATH}/capture-order`,
      {
        method: "POST",
        body: JSON.stringify({ paypal_order_id: paypalOrderId }),
      },
      true,
    ),
};

