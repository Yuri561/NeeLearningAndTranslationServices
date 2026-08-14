export type PayPalCreateOrderResponse = {
  paypal_order_id: string;
  status: string;
  approval_url: string;
};

export type PayPalCaptureResponse = {
  booking_id?: number;
  learner_id?: number;
  tutor_id?: number;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  amount?: string;
  currency?: string;
  status: string;
};

