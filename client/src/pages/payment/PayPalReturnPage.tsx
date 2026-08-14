import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiLoader, FiRefreshCw } from "react-icons/fi";
import { useCapturePayPalOrder } from "../../features/payments/paymentQueries";

const readPayPalOrderId = (params: URLSearchParams) =>
  params.get("token") ?? params.get("paypal_order_id") ?? params.get("order_id");

export const PayPalReturnPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = readPayPalOrderId(searchParams);
  const capture = useCapturePayPalOrder();
  const startedOrderRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId || startedOrderRef.current === orderId) return;
    startedOrderRef.current = orderId;
    capture.mutate(orderId);
  }, [capture, orderId]);

  const retry = () => {
    if (!orderId || capture.isPending) return;
    startedOrderRef.current = orderId;
    capture.mutate(orderId);
  };

  const completed = capture.data?.status?.toUpperCase() === "COMPLETED";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_18px_55px_rgba(15,23,42,.10)] sm:p-10">
        {!orderId ? (
          <>
            <FiAlertCircle className="mx-auto size-12 text-red-600" />
            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">Payment information is missing</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">We could not identify the PayPal order. Your payment has not been marked as completed.</p>
          </>
        ) : capture.isPending || capture.isIdle ? (
          <>
            <FiLoader className="mx-auto size-12 animate-spin text-haiti-navy" />
            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">Processing your payment...</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Please keep this page open while PayPal confirms your lesson payment.</p>
          </>
        ) : capture.isSuccess && completed ? (
          <>
            <FiCheckCircle className="mx-auto size-12 text-emerald-600" />
            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">Payment successful</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Your lesson has been booked and paid successfully.</p>
          </>
        ) : (
          <>
            <FiAlertCircle className="mx-auto size-12 text-red-600" />
            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">We couldn&apos;t complete your payment</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Your booking has not been marked as paid. Please try the capture again or return to your bookings.</p>
            <button type="button" onClick={retry} disabled={capture.isPending} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              <FiRefreshCw /> Retry confirmation
            </button>
          </>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/dashboard/learner/bookings" className="inline-flex h-12 items-center justify-center rounded-xl bg-haiti-navy px-6 text-sm font-bold text-white transition hover:bg-haiti-navy-dark">View My Bookings</Link>
          <Link to="/dashboard/learner" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Go to Dashboard</Link>
        </div>
      </section>
    </main>
  );
};

