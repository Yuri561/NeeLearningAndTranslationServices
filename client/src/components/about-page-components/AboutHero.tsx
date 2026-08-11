import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiSparkles } from "react-icons/hi";
import { IoIosArrowRoundForward } from "react-icons/io";

export const AboutHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center lg:items-end justify-center lg:justify-between bg-gradient-to-br from-[#101932] via-[#0d1f7a] to-[#00209F] pt-28 sm:pt-32 lg:pt-24 pb-16 lg:pb-0 px-6 sm:px-10 lg:px-16 xl:px-20 overflow-hidden">
      {/* Background waves */}
      <img
        className="absolute z-0 top-0 left-0 w-full h-full object-cover opacity-10 pointer-events-none"
        src="/about-page-picture/about-hero-waves.png"
        alt=""
        aria-hidden="true"
      />

      {/* Left — text content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 z-10 max-w-2xl lg:max-w-none self-center py-12 lg:py-16">
        {/* Simple accent badge */}
        <span className="inline-flex items-center gap-2 bg-blue-100/5 text-blue-100 px-4 py-1.5 rounded-full text-xs font-semibold tracking-[0.15em] uppercase border border-blue-200/30 backdrop-blur-sm">
          <HiSparkles className="text-haiti-red w-3.5 h-3.5" />
          About Nee's Learning
        </span>

        {/* Heading */}
        <h1
          className={`font-roxborough font-semibold leading-[1.15] text-white tracking-tight text-3xl sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Bridging Worlds, <br />
          One{" "}
          <span className="italic text-haiti-red font-medium">
            Word
          </span>{" "}
          at a Time
        </h1>

        {/* Subtitle */}
        <p
          className={`max-w-xl text-blue-100/80 text-sm sm:text-base md:text-lg leading-relaxed transition-all duration-700 ease-out delay-150 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          We deliver structured language learning and translation services that honor cultural heritage and help families, students, and professionals communicate naturally.
        </p>

        <Link
          to="/login"
          className={`group inline-flex items-center gap-4 rounded-full bg-white py-1 pl-6 pr-2 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-haiti-navy shadow-[0_18px_46px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-[0_24px_58px_rgba(0,0,0,0.28)] active:translate-y-0 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Start Learning
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-haiti-red text-white transition-transform duration-300 group-hover:scale-105">
            <IoIosArrowRoundForward className="absolute h-7 w-7 translate-x-0 transition-transform duration-300 group-hover:translate-x-12" />
            <IoIosArrowRoundForward className="absolute h-7 w-7 -translate-x-12 transition-transform duration-300 group-hover:translate-x-0" />
          </span>
        </Link>
      </div>

      {/* Right — image container (hidden on small devices, visible on big devices lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-end justify-end mt-10 lg:mt-0 z-10 lg:self-end">
        {/* background under teacher */}
        <img
          className="absolute w-full max-w-[500px] lg:max-w-[620px] h-auto opacity-70 z-0 pointer-events-none object-contain bottom-0 lg:bottom-4"
          src="/about-page-picture/bg-under-teacher.png"
          alt=""
          aria-hidden="true"
        />
        {/* Teacher image anchored to bottom */}
        <img
          className="w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] 2xl:max-w-[650px] h-auto object-contain object-bottom z-10 relative drop-shadow-2xl block"
          src="/about-page-picture/hero-about-image.png"
          alt="Nee's Learning Educator"
        />
      </div>
    </section>
  );
};

export default AboutHero;
