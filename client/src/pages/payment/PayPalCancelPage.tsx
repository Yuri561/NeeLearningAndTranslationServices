import { Link } from "react-router-dom";
import { FiInfo } from "react-icons/fi";

export const PayPalCancelPage = () => (
  <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
    <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_18px_55px_rgba(15,23,42,.10)] sm:p-10">
      <FiInfo className="mx-auto size-12 text-amber-600" />
      <h1 className="mt-5 text-2xl font-extrabold text-slate-950">PayPal payment cancelled</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">No payment was completed. Your booking remains available so you can try again when you&apos;re ready.</p>
      <Link to="/dashboard/learner/bookings" className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-haiti-navy px-6 text-sm font-bold text-white transition hover:bg-haiti-navy-dark">Return to My Bookings</Link>
    </section>
  </main>
);

