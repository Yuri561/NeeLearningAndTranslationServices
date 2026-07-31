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
    <section className="bg-gradient-to-br items-end py-15 px-15 relative from-[#101932] via-[#0d1f7a] to-[#00209F] inset-0  w-full h-screen flex items-center justify-center ">
      <img
        className="absolute z-0 top-1 opacity-10" 
        src="/about-page-picture/about-hero-waves.png"/>
      <div className="px-6 md:px-10 flex flex-col items-start gap-6">
        {/* Simple accent badge */}
        <span className="inline-flex items-center gap-2 bg-blue-100/5 text-blue-100 px-4 py-1.5 rounded-full text-xs font-semibold tracking-[0.15em] uppercase border border-blue-200">
          <HiSparkles className="text-haiti-red w-3.5 h-3.5" />
          About Nee's Learning
        </span>

        {/* Heading */}
        <h1
          className={`font-roxborough font-semibold leading-[1.15] text-white tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl 3xl:text-2xl transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
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
          className={`max-w-2xl text-blue-100/70 text-base sm:text-md md:text-lg xl:text-md 3xl:text-xl  leading-relaxed transition-all duration-700 ease-out delay-150 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          We deliver structured language learning and translation services that honor cultural heritage and help families, students, and professionals communicate naturally.
        </p>

        <Link
          to="/login"
          className={`group inline-flex items-center gap-4 rounded-full bg-white py-1 pl-6 pr-2 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-haiti-navy shadow-[0_18px_46px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-[0_24px_58px_rgba(0,0,0,0.28)] active:translate-y-0 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          Start Learning
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-haiti-red text-white transition-transform duration-300 group-hover:scale-105">
            <IoIosArrowRoundForward className="absolute h-7 w-7 translate-x-0 transition-transform duration-300 group-hover:translate-x-12" />
            <IoIosArrowRoundForward className="absolute h-7 w-7 -translate-x-12 transition-transform duration-300 group-hover:translate-x-0" />
          </span>
        </Link>
      </div>
      <div className="w-1/2 relative">
        {/* background under teacher */}
        <img className="absolute w-300 h-90 opacity-70  bottom-45 right-25 z-0"
        src="/about-page-picture/bg-under-teacher.png"/>
        <img
          className="w-[80%] h-140 z-10 relative top-15"
          src="/about-page-picture/hero-about-image.png" alt="" />
      </div>
    </section>
  );
};

export default AboutHero;
