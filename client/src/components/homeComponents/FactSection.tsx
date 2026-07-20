import { useEffect, useRef, useState } from "react";

/* ── Animated counter hook ── */
const useCountUp = (target: number, durationMs = 2000) => {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return { count, containerRef };
};

/* ─── Section ─── */
const FactSection = () => {
  const accuracy = useCountUp(96, 2000);
  const translations = useCountUp(120, 2000);

  return (
    <section
      id="results"
      className="relative w-full overflow-hidden z-[2] flex items-center"
      style={{
        paddingTop: "clamp(100px,12vw,180px)",
        paddingBottom: "clamp(100px,12vw,180px)",
      }}
    >
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src="/bg-fact-section.jpg"
          alt=""
          className="w-full object-cover object-center block"
          style={{ height: "120%", marginTop: "-10%" }}
        />
      </div>

      {/* Dark overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-[rgba(1,20,35,0.75)]"
      />

      {/* Content container */}
      <div
        ref={accuracy.containerRef}
        className="relative z-[2] w-full max-w-[1320px] mx-auto px-10 flex flex-col"
      >
        {/* Text block */}
        <div className="max-w-[600px] flex flex-col gap-[45px]">

          {/* Title */}
          <h2 className="flex flex-wrap gap-[10px] m-0">
            {["Learn", "Haitian", "Creole"].map((w) => (
              <span
                key={w}
                className="font-roxborough font-bold text-white"
                style={{ fontSize: "clamp(36px,5vw,64px)" }}
              >
                {w}
              </span>
            ))}
            <span
              className="font-roxborough font-bold italic text-[#ff4d4d]"
              style={{ fontSize: "clamp(36px,5vw,64px)" }}
            >
              {/* &amp; Translation */}
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-[18px] leading-[1.6] text-white/75 m-0 max-w-[600px] max-md:text-[16px]">
          Break language barriers with expert tutoring in Haitian Creole, English, Spanish, and French, along with professional translation services. 
          Learn with confidence, communicate effectively, and connect across languages.
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-white/20" />

          {/* Stats */}
          <div className="flex gap-[70px] flex-wrap max-md:flex-col max-md:gap-8">

            {/* Stat 1 — accuracy */}
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-baseline">
                <span
                  className="font-roxborough font-extrabold text-white"
                  style={{ fontSize: "64px" }}
                >
                  {accuracy.count}
                </span>
                <span
                  className="text-[32px] text-[#ff4d4d] ml-1"
                >
                  %
                </span>
              </div>
              <span className="text-[13px] tracking-[0.1em] uppercase text-white/60 font-semibold">
                Translation Accuracy
              </span>
            </div>

            {/* Divider between stats */}
            <div className="w-px h-[60px] bg-white/20 self-center max-md:hidden" />

            {/* Stat 2 — translations */}
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-baseline">
                <span
                  className="font-roxborough font-extrabold text-white"
                  style={{ fontSize: "64px" }}
                >
                  {translations.count}
                </span>
                <span
                  className="text-[32px] text-[#ff4d4d] ml-1"
                >
                  +
                </span>
              </div>
              <span className="text-[13px] tracking-[0.1em] uppercase text-white/60 font-semibold">
                Supported Translations
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FactSection;