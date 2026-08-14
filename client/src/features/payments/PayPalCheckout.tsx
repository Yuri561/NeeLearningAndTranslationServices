import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiLoader, FiRefreshCw } from "react-icons/fi";
import { useCapturePayPalOrder } from "./paymentQueries";
import type { PayPalCaptureResponse } from "./paymentTypes";

type PayPalApproveData = { orderID?: string };
type PayPalButtons = {
  isEligible: () => boolean;
  render: (container: HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
};
type PayPalNamespace = {
  Buttons: (options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string> | string;
    onApprove: (data: PayPalApproveData) => Promise<void>;
    onCancel: () => void;
    onError: (error: unknown) => void;
  }) => PayPalButtons;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let paypalScriptPromise: Promise<PayPalNamespace> | null = null;

const loadPayPal = () => {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (paypalScriptPromise) return paypalScriptPromise;

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim();
  if (!clientId) {
    return Promise.reject(new Error("PayPal checkout is not configured."));
  }

  paypalScriptPromise = new Promise<PayPalNamespace>((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons",
      "enable-funding": "card",
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal checkout could not be loaded."));
    };
    script.onerror = () => reject(new Error("PayPal checkout could not be loaded."));
    document.head.appendChild(script);
  });

  return paypalScriptPromise;
};

export const PayPalCheckout = ({
  paypalOrderId,
  onCompleted,
}: {
  paypalOrderId: string;
  onCompleted?: (payment: PayPalCaptureResponse) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedOrderRef = useRef<string | null>(null);
  const completedRef = useRef(onCompleted);
  const capture = useCapturePayPalOrder();
  const { mutateAsync: captureOrder } = capture;
  const [sdkError, setSdkError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    completedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || renderedOrderRef.current === paypalOrderId) return;

    let disposed = false;
    let buttons: PayPalButtons | undefined;
    renderedOrderRef.current = paypalOrderId;
    container.replaceChildren();

    void loadPayPal()
      .then(async (paypal) => {
        if (disposed) return;
        buttons = paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "paypal", height: 46 },
          createOrder: () => paypalOrderId,
          onApprove: async (data) => {
            const approvedOrderId = data.orderID || paypalOrderId;
            const payment = await captureOrder(approvedOrderId);
            if (payment.status.toUpperCase() !== "COMPLETED") {
              throw new Error("PayPal did not confirm this payment as completed.");
            }
            completedRef.current?.(payment);
          },
          onCancel: () => setCancelled(true),
          onError: () => setSdkError("PayPal could not complete the checkout. You have not been charged."),
        });

        if (!buttons.isEligible()) {
          throw new Error("PayPal checkout is not available for this browser or account.");
        }
        await buttons.render(container);
      })
      .catch((error: unknown) => {
        if (!disposed) {
          renderedOrderRef.current = null;
          setSdkError(error instanceof Error ? error.message : "PayPal checkout could not be loaded.");
        }
      });

    return () => {
      disposed = true;
      renderedOrderRef.current = null;
      container.replaceChildren();
      void buttons?.close?.().catch(() => undefined);
    };
  }, [captureOrder, paypalOrderId]);

  if (capture.isSuccess && capture.data.status.toUpperCase() === "COMPLETED") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <p className="flex items-center gap-2 text-sm font-extrabold"><FiCheckCircle /> Payment successful</p>
        <p className="mt-1 text-xs font-semibold">PayPal confirmed your payment and the booking data is being refreshed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {capture.isPending ? (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm font-bold text-haiti-navy">
          <FiLoader className="animate-spin" /> Capturing your PayPal payment...
        </div>
      ) : null}
      <div ref={containerRef} className={capture.isPending ? "pointer-events-none opacity-50" : ""} />
      {cancelled ? <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Payment was cancelled. Your booking remains unpaid and you can try again.</p> : null}
      {sdkError || capture.isError ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          <p className="flex items-center gap-2"><FiAlertCircle /> {sdkError || "We couldn't capture your payment. You have not been marked as paid."}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 inline-flex items-center gap-2 font-extrabold underline"><FiRefreshCw /> Reload checkout</button>
        </div>
      ) : null}
    </div>
  );
};
