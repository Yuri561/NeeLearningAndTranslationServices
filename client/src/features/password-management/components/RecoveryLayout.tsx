import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AuthBrandPanel from "../../../components/auth/AuthBrandPanel";

export const RecoveryLayout = ({ children }: { children: ReactNode }) => (
  <main className="flex min-h-screen w-full items-stretch bg-slate-50 font-sans">
    <AuthBrandPanel mode="login" />
    <section className="relative flex w-full items-center justify-center bg-white p-6 sm:p-12 lg:w-1/2">
      <div className="pointer-events-none absolute right-8 top-8 size-56 rounded-full bg-blue-50 blur-3xl" />
      <div className="relative z-10 w-full max-w-[460px]">
        <Link to="/" className="mb-8 inline-flex lg:hidden" aria-label="Nee Learning home">
          <img src="/logo.png" alt="Nee Learning" className="h-11 w-auto" />
        </Link>
        {children}
      </div>
    </section>
  </main>
);

