import { useEffect, useRef, useState } from "react";

interface AccordionItem {
  title: string;
  body: string;
}

const accordionItems: AccordionItem[] = [
  {
    title: "Structured path to fluency",
    body: "We design engaging language tools that reduce complexity, improve retention, and help learners communicate with confidence.",
  },
  {
    title: "Expert cultural context",
    body: "We shape lessons and translations into culturally authentic communications, simplifying the learning curve for native accuracy.",
  },
  {
    title: "Certified accuracy & trust",
    body: "We create easy-to-follow language programs and practical learning materials that help you speak confidently in everyday situations.",
  },
];

/* ── Accordion component ── */
const Accordion = () => {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="w-full">
      {accordionItems.map((item, i) => {
        const isOpen = openIdx === i;
        const panelId = `accordion-panel-${i}`;
        const triggerId = `accordion-trigger-${i}`;

        return (
          <div key={i}>
            {/* Top border for first item only */}
            {i === 0 && (
              <div className="h-px bg-[rgba(6,67,159,0.12)] w-full" />
            )}

            <button
              id={triggerId}
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center justify-between py-5 bg-transparent border-none border-b border-[rgba(6,67,159,0.12)] cursor-pointer gap-4 text-left transition-colors duration-[250ms] group"
              style={{ borderBottom: "1px solid rgba(6,67,159,0.12)" }}
            >
              <span
                className={`font-roxborough text-[18px] font-bold tracking-[-0.01em] leading-[1.3] transition-colors duration-[250ms] max-[580px]:text-[16px] ${
                  isOpen
                    ? "text-haiti-red"
                    : "text-haiti-navy group-hover:text-haiti-red"
                }`}
              >
                {item.title}
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className={`flex-shrink-0 transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? "rotate-45" : "rotate-0"
                }`}
              >
                <path
                  d="M10 4v12M4 10h12"
                  stroke="var(--color-haiti-red)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Animated panel — CSS grid rows trick */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={`grid overflow-hidden transition-[grid-template-rows,opacity,visibility] duration-[350ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100 visible"
                  : "grid-rows-[0fr] opacity-0 invisible"
              }`}
            >
              <div
                className={`min-h-0 transition-[padding] duration-[350ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? "pt-4 pb-5" : "py-0"
                }`}
              >
                <p className="font-sans text-[15px] leading-[1.6] text-[#6B7280] m-0">
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Section ─── */
const ProcessSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="w-full bg-white relative overflow-hidden px-10 max-[580px]:px-5"
      style={{
        paddingTop: "clamp(60px,8vw,100px)",
        paddingBottom: "clamp(60px,8vw,100px)",
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,67,159,0.03)_0%,transparent_70%)] pointer-events-none z-0"
      />

      {/* Inner container */}
      <div className="w-full max-w-[1240px] mx-auto relative z-10">
        {/* Grid — image left, content right (stacks on tablet) */}
        <div
          className="flex flex-row items-center w-full max-[1024px]:flex-col max-[1024px]:gap-12"
          style={{ gap: "clamp(40px,6vw,80px)" }}
        >
          <div className="flex-shrink-0 max-[1024px]:w-full">
            <img
              src="/process-section2.jpg"
              alt="Professional classroom and learner environment"
              loading="lazy"
              decoding="async"
              className="w-[580px] h-[596px] rounded-[15px] block border border-blue-700/20 shadow-xs transition-[transform,box-shadow] duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:hover:-translate-y-0.5 max-[1024px]:w-full max-[1024px]:h-auto max-[1024px]:max-h-[480px] max-[1024px]:object-cover max-[580px]:max-h-[320px]"
            />
          </div>

          {/* Content */}
          <div
            className={`flex-1 flex flex-col gap-[35px] items-start transition-[opacity,transform] duration-[700ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
            }`}
          >
            {/* Header */}
            <div className="flex flex-col gap-[25px] items-start">
              <h2
                className="font-roxborough font-bold leading-[1.15] tracking-[-0.02em] text-haiti-navy m-0"
                style={{ fontSize: "clamp(32px,4.5vw,44px)" }}
              >
                We make learning{" "}
                <em className="italic text-haiti-red">stress free</em> so you
                have the perfect control.
              </h2>
              <p className="font-sans text-base leading-[1.65] text-[#6B7280] m-0 text-left">
                Our team creates simple, effective language learning experiences that help students learn with confidence. 
                We focus on clear lessons, practical practice, and engaging activities to make learning a new language easier and more enjoyable.
              </p>
            </div>

            {/* Accordion */}
            <Accordion />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
