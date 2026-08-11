import { Link } from "react-router-dom";
import DecoratorBox from "../DecoratorBox";
const btnDark =
  "inline-flex items-center justify-center gap-3 bg-gradient-to-br from-[#080c18] via-[#0d1f7a] to-[#00209F] " +
  "text-white py-[15px] px-[34px] rounded-full font-sans text-[13px] font-bold tracking-[0.12em] uppercase " +
  "cursor-pointer border-none transition-[transform,box-shadow]  duration-500 ease whitespace-nowrap no-underline " +
  "shadow-[0_4px_20px_rgba(0,32,159,0.40),0_1px_6px_rgba(8,12,24,0.30)] " +
  "hover:-translate-y-[3px] hover:shadow-[0_10px_36px_rgba(0,32,159,0.55),0_3px_10px_rgba(8,12,24,0.35)] " +
  "hover:from-[#001278] hover:via-[#00209F] hover:to-[#1a3aff] " +
  "active:-translate-y-[1px] active:shadow-[0_4px_16px_rgba(0,32,159,0.40),0_1px_4px_rgba(8,12,24,0.20)]";

const HeroSection = () => {
  return (
    <section className="flex flex-col lg:flex-row relative items-center pt-28 sm:pt-32 md:pt-36 lg:pt-28 mb-20 lg:mb-30 justify-between gap-12 lg:gap-0 max-w-8xl w-full px-6 lg:px-20 mx-auto">

      <img
        src="/grid-background.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "clamp(600px, 70vw, 950px)",
          height: "auto",
          opacity: 0.18,
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Left — text content */}
      <div className="w-full lg:flex-1 lg:max-w-[1000px] flex flex-col items-center lg:items-start text-center lg:text-left gap-10 z-10">
        <h1
          style={{
            fontFamily: "var(--font-roxborough)",
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--color-haiti-navy)",
          }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-7xl xl:text-8xl w-full text-center lg:text-left"
        >
          Learn Haitian
          <br />
          Creole
        </h1>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            lineHeight: 2.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#555e6c",
          }}
          className="text-[17px] text-center lg:text-left w-full md:w-[75%] lg:w-[85%] xl:w-[75%] mx-auto lg:mx-0"
        >
        Language learning and translation support for school, work, and everyday life.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:max-w-[430px] justify-center lg:justify-start relative z-10">
          {/* Primary */}
          <Link to="/contact" className={`${btnDark} w-full sm:w-auto`}>
            Book Your First Lesson
          </Link>

          {/* Outline — gradient border via background-clip trick */}
          <Link
            to="/services"
            className="inline-flex items-center justify-center gap-2 rounded-full font-sans text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer border-2 border-transparent transition-[transform,box-shadow,color] duration-300 whitespace-nowrap no-underline w-full sm:w-auto hover:-translate-y-[3px] active:-translate-y-[1px] group"
            style={{
              padding: "14px 34px",
              background:
                "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #080c18 0%, #00209F 100%) border-box",
              color: "#080c18",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #080c18 0%, #0d1f7a 45%, #00209F 100%) padding-box, linear-gradient(135deg, #080c18 0%, #00209F 100%) border-box";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.boxShadow =
                "0 10px 32px rgba(0,32,159,0.45), 0 3px 10px rgba(8,12,24,0.30)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #080c18 0%, #00209F 100%) border-box";
              e.currentTarget.style.color = "#080c18";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Request a Translation Quote
          </Link>
        </div>
      </div>

      {/* Right — hero image with responsive DecoratorBox */}
      <div className="relative w-full max-w-[480px] lg:max-w-[500px] 2xl:max-w-[600px] lg:flex-1 h-auto lg:h-[450px] xl:h-150 z-10 flex items-center justify-center">
        <img
          src="/background-image.png"
          alt="Haitian Creole & English learning vibrant culture collage"
          className="w-full h-full object-cover rounded-[20px]"
        />
        <DecoratorBox className="absolute hidden 2xl:flex -bottom-6 left-1/2 z-20 animate-decorator-slide-up [--decorator-tx:-50%] lg:left-auto lg:-left-12 lg:translate-x-0 lg:[--decorator-tx:0%]" />
      </div>
    </section>
  );
};

export default HeroSection;