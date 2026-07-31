import { HiArrowRight } from "react-icons/hi";
import { Link } from "react-router-dom";

// Changing this to add tutor cards
const tutors = [
  {
    id: 1,
    name:"Needo",
    language: "Haitian Creole",
    experience: "2 years",
    bio: "Native Haitian Creole instructor specializing in conversational fluency and cultural immersion.",
    specialties: [
      "Beginner to Advanced",
      "One-on-One Lessons",
      "Certified Translator",
    ],
    cta: "Book Your Lessons",
    featured: true,
  },
  {
    id: 2,
    name:"Fadael Francisco Callixte",
    language: "Spanish",
    experience: "1 years",
    bio: "Experienced Spanish tutor helping students build confidence in everyday conversations.",
    specialties: [
      "Practice Session",
      "Vocabulary Practice",
      "Everyday Spanish Expressions",
    ],
    cta: "Book Your Lessons",
     featured: true,
  },
  {
    id: 3,
    name:"Marsou Dolce",
    language: "English",
    experience: "9 years",
    bio: "Experienced English tutor specializing in conversational English and helping students communicate with confidence.",
    specialties: [
      "Conversation Practice",
      "Grammar Practice",
      "English for Daily Life",
    ],
    cta: "Book Your Lessons",
     featured: true,
  },

  
];

const CheckMark = ({ inverse = false }: { inverse?: boolean }) => (
  <span
    aria-hidden="true"
    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
      inverse ? "bg-white/12 text-white" : "bg-haiti-red/[0.08] text-haiti-red"
    }`}
  >
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path
        d="m2.2 6.1 2.3 2.3 5.3-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

//New Code by Rae: Project Manager - Yassine review this code and layout.
//Updated Code 
const TutorCard = ({ tutor }: { tutor: (typeof tutors)[number] }) => {
  const featured = Boolean(tutor.featured);
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-haiti-navy/10 bg-white p-7 transition-all duration-300 shadow-[0_8px_35px_rgba(6,67,159,0.06)] hover:-translate-y-1.5 hover:border-haiti-navy/20 hover:shadow-[0_20px_50px_rgba(6,67,159,0.12)] sm:p-8"
    >
      <div>
        {/* Tutor Name */}
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-haiti-red">
          {tutor.name}
        </p>

        {/* Language */}
        <h3 className="mt-5 font-roxborough text-4xl font-bold leading-none tracking-tight text-haiti-navy">
          {tutor.language}
        </h3>

        {/* Experience */}
        <p className="mt-2 text-md text-black-500">
          Experience: {tutor.experience}
        </p>

        {/* Bio */}
        <p className="mt-5 min-h-16 text-sm leading-6 text-black-500">
          {tutor.bio}
        </p>
      </div>

      <div className="my-7 h-px bg-haiti-navy/10" />

      {/* Specialties */}
      <ul className="flex flex-1 flex-col gap-4">
        {tutor.specialties.map((specialty) => (
          <li key={specialty} className="flex items-start gap-3">
            <CheckMark  inverse={featured}/>
            <span className="text-md leading-6 text-haiti-navy/80">
              {specialty}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <Link
        to="/#contact"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-haiti-navy/20 px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-haiti-navy transition-all duration-300 hover:-translate-y-0.5 hover:border-haiti-navy hover:bg-haiti-navy hover:text-white"
      >
        {tutor.cta}
        <HiArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </article>
  );
};

const TutorsSection = () => {
  return (
    <section
      id="tutors"
      aria-labelledby="tutors-heading"
      className="relative isolate w-full scroll-mt-28 overflow-hidden py-15"
    >
      <div className="mx-auto w-full max-w-[1280px] px-[clamp(20px,5vw,40px)]">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="tutors-heading"
            className="mt-6 font-roxborough text-[clamp(2.35rem,5vw,4.25rem)] font-bold leading-[1.04] tracking-[-0.045em] text-haiti-navy"
          >
            Meet Our
            <em className="font-medium text-haiti-red"> Tutors.</em>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-9 text-black-500">
            Learn from experienced language instructors dedicated to helping
            you become confident in real conversations.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:mt-20 lg:gap-6">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-md font-semibold text-haiti-navy/60">
          {[
            "Native Speakers",
            "Personalized Lessons",
            "Flexible Scheduling",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckMark />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

//Clean up code : by deleting. -Rae

// const PricingCard = ({ tutor }: { plan: (typeof tutor)[number] }) => {
//   const featured = Boolean(tutor.featured);

//   return (
//     <article
//       className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition-all duration-300 sm:p-8 ${
//         featured
//           ? "bg-linear-to-br from-[#080c18] via-[#0d1f7a] to-[#06439f] text-white shadow-[0_22px_65px_rgba(6,67,159,0.24)] lg:-translate-y-3"
//           : "border border-haiti-navy/10 bg-white text-haiti-navy shadow-[0_8px_35px_rgba(6,67,159,0.06)] hover:-translate-y-1.5 hover:border-haiti-navy/20 hover:shadow-[0_20px_50px_rgba(6,67,159,0.12)]"
//       }`}
//     >
//       {featured && (
//         <>
//           <div
//             aria-hidden="true"
//             className="absolute -right-24 -top-24 size-72 rounded-full bg-haiti-red/15 blur-3xl"
//           />
//           <span className="absolute right-6 top-6 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
//             Most popular
//           </span>
//         </>
//       )}

      // <div className="relative z-10">
      //   <p
      //     className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${
      //       featured ? "text-white/65" : "text-haiti-red"
      //     }`}
      //   >
      //     {plan.name}
      //   </p>
      //   <div className="mt-5 flex items-end gap-2">
      //     <span className="font-roxborough text-[clamp(2.9rem,5vw,4rem)] font-bold leading-none tracking-[-0.055em]">
      //       {plan.price}
      //     </span>
      //     <span className={`pb-1 text-sm ${featured ? "text-white/55" : "text-gray-500"}`}>
      //       / {plan.period}
      //     </span>
      //   </div>
      //   <p
      //     className={`mt-5 min-h-12 text-sm leading-6 ${
      //       featured ? "text-white/68" : "text-gray-500"
      //     }`}
      //   >
      //     {plan.description}
      //   </p>
      // </div>

      // <div className={`relative z-10 my-7 h-px ${featured ? "bg-white/12" : "bg-haiti-navy/10"}`} />

      // <ul className="relative z-10 flex flex-1 flex-col gap-4">
      //   {plan.features.map((feature) => (
      //     <li key={feature} className="flex items-start gap-3">
      //       <CheckMark inverse={featured} />
      //       <span className={`text-sm leading-6 ${featured ? "text-white/82" : "text-haiti-navy/80"}`}>
      //         {feature}
      //       </span>
      //     </li>
      //   ))}
      // </ul>

//       <Link
//         to="/#contact"
//         className={`relative z-10 mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${
//           featured
//             ? "bg-white text-haiti-navy shadow-lg hover:-translate-y-0.5 hover:text-haiti-red hover:shadow-xl focus-visible:outline-white"
//             : "border border-haiti-navy/20 text-haiti-navy hover:-translate-y-0.5 hover:border-haiti-navy hover:bg-haiti-navy hover:text-white focus-visible:outline-haiti-navy"
//         }`}
//       >
//         {plan.cta}
//         <HiArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
//       </Link>
//     </article>
//   );
// };

// const PricingSection = () => {
//   return (
//     <section
//       id="pricing"
//       aria-labelledby="pricing-heading"
//       className="relative isolate w-full scroll-mt-28 overflow-hidden py-15"
//     >

    
//       <div className="mx-auto w-full max-w-[1280px] px-[clamp(20px,5vw,40px)]">
//         <div className="mx-auto max-w-3xl text-center">
      
//           <h2
//             id="pricing-heading"
//             className="mt-6 font-roxborough text-[clamp(2.35rem,5vw,4.25rem)] font-bold leading-[1.04] tracking-[-0.045em] text-haiti-navy"
//           >
//             Choose the support that fits{" "}
//             <em className="font-medium text-haiti-red">your goals.</em>
//           </h2>
//           <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-500">
//             Begin with a 30-day trial. No credit card, hidden fees, or long-term
//             commitment required.
//           </p>
//         </div>

//         <div className="mt-14 grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 lg:mt-20 lg:gap-6">
//           {plans.map((plan) => (
//             <PricingCard key={plan.name} plan={plan} />
//           ))}
//         </div>

//         <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-haiti-navy/55">
//           {["Expert-led instruction", "Flexible cancellation", "Responsive support"].map(
//             (item) => (
//               <span key={item} className="flex items-center gap-2">
//                 <CheckMark />
//                 {item}
//               </span>
//             ),
//           )}
//         </div>
//       </div>
//     </section>
//   );
// };

export default TutorsSection;
