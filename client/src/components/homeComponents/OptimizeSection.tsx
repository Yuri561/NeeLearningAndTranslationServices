import { HiArrowRight } from "react-icons/hi";
import { Link } from "react-router-dom";

const workflow = [
  {
    number: "01",
    title: "Intake & placement",
    description:
      "We begin with a personal language assessment or document review to understand your goals, timeline, and exact needs.",
    label: "Discover",
  },
  {
    number: "02",
    title: "Personalized Learning Plan",
    description:
      "Track your learning progress, manage your lessons, and stay organized with a personalized language learning dashboard.",
    label: "Design",
  },
  {
    number: "03",
    title: "One-on-One Support",
    description:
      "Receive personalized language instruction or professional translation services delivered with accuracy, care, and cultural understanding.",
    label: "Improve",
  },
  {
    number: "04",
    title: "Translation Status",
    description:
      "Receive accurate certified translations with a simple, reliable process.",
    label: "Provide",
  },
];

const WorkflowCard = ({
  step,
  isLast,
}: {
  step: (typeof workflow)[number];
  isLast: boolean;
}) => (
  <li className="group relative grid grid-cols-[44px_1fr] gap-4 sm:grid-cols-[56px_1fr] sm:gap-6">
    <div className="relative flex justify-center">
      <span className="relative z-10 grid size-11 place-items-center rounded-full border border-haiti-navy/10 bg-white font-sans text-[11px] font-extrabold tracking-[0.08em] text-haiti-red shadow-[0_6px_22px_rgba(6,67,159,0.09)] transition-all duration-300 group-hover:border-haiti-red/25 group-hover:bg-haiti-red group-hover:text-white sm:size-12">
        {step.number}
      </span>
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-[-2rem] top-12 w-px bg-linear-to-b from-haiti-navy/16 to-haiti-navy/[0.04] sm:top-14"
        />
      )}
    </div>

    <article className="relative mb-8 overflow-hidden rounded-[24px] border border-haiti-navy/[0.09] bg-white p-6 shadow-[0_8px_32px_rgba(6,67,159,0.055)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-haiti-navy/15 group-hover:shadow-[0_18px_48px_rgba(6,67,159,0.11)] sm:mb-9 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-32 rounded-full bg-haiti-navy/[0.035] blur-2xl transition-colors duration-300 group-hover:bg-haiti-red/[0.06]"
      />
      <p className="relative text-[10px] font-extrabold uppercase tracking-[0.18em] text-haiti-red">
        {step.label}
      </p>
      <h3 className="relative mt-3 font-roxborough text-[clamp(1.3rem,2.4vw,1.65rem)] font-bold leading-tight tracking-[-0.025em] text-haiti-navy">
        {step.title}
      </h3>
      <p className="relative mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-[15px] sm:leading-7">
        {step.description}
      </p>
    </article>
  </li>
);

const OptimizeSection = () => {
  return (
    <section
      id="optimize"
      aria-labelledby="optimize-heading"
      className="relative isolate w-full scroll-mt-28 overflow-hidden bg-white"
    >
      <div
        aria-hidden="true"
        className="absolute -left-52 top-1/4 -z-10 size-[34rem] rounded-full bg-haiti-navy/[0.045] blur-3xl"
      />
   

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-14 px-[clamp(20px,5vw,40px)] lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 xl:gap-28">
        <div className="lg:sticky lg:top-32 lg:self-start">
       

          <h2
            id="optimize-heading"
            className="mt-6 max-w-xl font-roxborough text-[clamp(2.35rem,5vw,4.25rem)] font-bold leading-[1.04] tracking-[-0.045em] text-haiti-navy"
          >
            From first conversation to{" "}
            <em className="font-medium text-haiti-red">confident results.</em>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-black-500">
            From your first request to final results, our structured process ensures clear communication, professional support, and quality outcomes.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-y border-haiti-navy/[0.08] py-5 text-xs font-bold text-haiti-navy/60">
            {["Personal", "Transparent", "Secure"].map((quality) => (
              <span key={quality} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-haiti-red" aria-hidden="true" />
                {quality}
              </span>
            ))}
          </div>

          <Link
            to="/#contact"
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-linear-to-r from-[#080c18] via-[#0d1f7a] to-[#00209F] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_8px_25px_rgba(0,32,159,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(0,32,159,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-haiti-navy"
          >
            Start your journey
            <span className="grid size-8 place-items-center rounded-full bg-white/12">
              <HiArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        <ol aria-label="Our four-step workflow" className="w-full">
          {workflow.map((step, index) => (
            <WorkflowCard
              key={step.number}
              step={step}
              isLast={index === workflow.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default OptimizeSection;
