import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoIosArrowRoundForward } from "react-icons/io";

/* ─── Types ─── */
interface Service {
  id: string;
  title: string;
  desc: string;
  link: string;
  dark: boolean;
  icon: string;
}

/* ─── Service data — module-level constant, never re-allocated ─── */
const services: Service[] = [
  {
    id: "language-learning",
    title: "Language Learning",
    desc: "Structured Haitian Kreyòl and language courses designed for beginners to advanced learners of all ages.",
    link: "/services",
    dark: true,
    icon: "/servicesSection-icons/language-learning.png",
  },
  {
    id: "translation-services",
    title: "Translation Services",
    desc: "Professional Kreyòl–English translation for documents, legal papers, medical records, and business content.",
    link: "/services",
    dark: false,
    icon: "/servicesSection-icons/translation-service.png",
  },
  {
    id: "cultural-integration",
    title: "Cultural Integration",
    desc: "Workshops to help individuals and families navigate cultural transitions with confidence.",
    link: "/services",
    dark: true,
    icon: "/servicesSection-icons/cultural-integration.png",
  },
];

/* ─── Service Card ─── */
const ServiceCard = ({
  title,
  desc,
  link,
  dark,
  icon,
  visible,
  delay,
}: Service & { visible: boolean; delay: number }) => (
  <div
    className={[
      "rounded-[20px] flex flex-col gap-[22px] relative overflow-hidden cursor-pointer will-change-transform",
      "transition-[opacity,transform,box-shadow] duration-[650ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      dark
        ? "bg-gradient-to-br from-[#080c18] via-[#0d1f7a] to-[#06439f] border-none shadow-[0_16px_56px_rgba(6,67,159,0.30),0_4px_16px_rgba(8,12,24,0.20)] [@media(hover:hover)]:hover:shadow-[0_24px_70px_rgba(6,67,159,0.42),0_6px_24px_rgba(8,12,24,0.28)] [@media(hover:hover)]:hover:-translate-y-1.5"
        : "bg-white border-[1.5px] border-[rgba(6,67,159,0.12)] shadow-[0_4px_28px_rgba(6,67,159,0.07)] [@media(hover:hover)]:hover:shadow-[0_12px_48px_rgba(6,67,159,0.14)] [@media(hover:hover)]:hover:-translate-y-1.5",
    ]
      .filter(Boolean)
      .join(" ")}
    style={{
      padding: "clamp(28px,4vw,44px) clamp(24px,3vw,36px)",
      transitionDelay: visible ? `${delay}ms` : "0ms",
    }}
  >
    {/* Glow blob — dark cards only */}
    {dark && (
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(26,58,255,0.18)_0%,transparent_70%)] pointer-events-none"
      />
    )}

    {/* Icon */}
    <div className="w-[62px] h-[62px] flex-shrink-0 relative z-10">
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain block"
      />
    </div>

    {/* Title */}
    <h3
      className={`font-roxborough font-bold tracking-[-0.01em] leading-[1.2] m-0 relative z-10 ${
        dark ? "text-white" : "text-haiti-navy"
      }`}
      style={{ fontSize: "clamp(20px,2.5vw,24px)" }}
    >
      {title}
    </h3>

    {/* Description */}
    <p
      className={`font-sans text-base leading-[1.65] flex-1 m-0 relative z-10 ${
        dark ? "text-white/[0.72]" : "text-[#6B7280]"
      }`}
    >
      {desc}
    </p>

    {/* Learn More link */}
    <Link
      to={link}
      className={`inline-flex items-center gap-1.5 font-sans text-[14px] font-bold tracking-[0.08em] uppercase no-underline transition-[gap,color] duration-200 hover:gap-3 relative z-10 ${
        dark
          ? "text-white/85 hover:text-white"
          : "text-haiti-navy hover:text-[#080c18]"
      }`}
      aria-label={`Learn more about ${title}`}
    >
      Learn More
      <IoIosArrowRoundForward
        aria-hidden="true"
        className="w-5 h-5 flex-shrink-0"
      />
    </Link>
  </div>
);

/* ─── Section ─── */
const ServicesSection = () => {
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
      id="services"
      ref={sectionRef}
      className="w-full bg-white relative overflow-hidden"
      style={{
        paddingTop: "clamp(64px,8vw,112px)",
        paddingBottom: "clamp(64px,8vw,112px)",
      }}
    >
      {/* Radial glow backdrop */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(6,67,159,0.06)_0%,transparent_70%)] pointer-events-none z-0"
      />

      {/* Section container */}
      <div
        className="w-full max-w-[1400px] mx-auto flex flex-col items-center relative z-10"
        style={{
          paddingLeft: "clamp(20px,5vw,40px)",
          paddingRight: "clamp(20px,5vw,40px)",
          gap: "clamp(40px,6vw,64px)",
        }}
      >
        {/* ── Headline block ── */}
        <div
          className={`flex flex-col items-center gap-4 max-w-[680px] text-center transition-[opacity,transform] duration-[650ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
          }`}
        >
          <span className="font-sans text-[15px] font-bold tracking-[0.08em] uppercase text-haiti-navy opacity-60">
            What We Offer
          </span>
          <h2
            className="font-roxborough font-bold leading-[1.1] tracking-[-0.02em] text-haiti-navy m-0"
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            Our services are{" "}
            <em className="italic text-haiti-red">specifically</em>{" "}
            designed to meet your needs.
          </h2>
        </div>

        {/* ── Service Cards — responsive grid ── */}
        <div className="grid grid-cols-1 min-[581px]:grid-cols-2 min-[901px]:grid-cols-3 gap-4 min-[581px]:gap-6 min-[901px]:gap-8 w-full">
          {services.map((s, i) => (
            <ServiceCard key={s.id} {...s} visible={visible} delay={i * 120} />
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div
          className={`flex flex-col items-center gap-5 text-center transition-[opacity,transform] duration-[650ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
          style={{ transitionDelay: visible ? "450ms" : "0ms" }}
        >
          <p
            className="font-sans text-[#6B7280] m-0"
            style={{ fontSize: "clamp(15px,2vw,18px)" }}
          >
            Build real language skills, one conversation at a time.
          </p>

          {/* "View All Services" pill */}
          <Link
            to="/services"
            aria-label="View all services"
            className="group relative inline-flex items-center gap-[14px] bg-gradient-to-br from-[#080c18] via-[#0d1f7a] to-[#00209F] text-white rounded-full font-sans text-[13px] font-bold tracking-[0.12em] uppercase no-underline whitespace-nowrap overflow-hidden shadow-[0_4px_20px_rgba(0,32,159,0.40),0_1px_6px_rgba(8,12,24,0.30),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-[transform,box-shadow] duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,32,159,0.55),0_4px_12px_rgba(8,12,24,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.3)] active:-translate-y-[1px]"
            style={{ padding: "16px 28px 16px 36px" }}
          >
            {/* Smooth Hover Gradient Overlay */}
            <span className="absolute inset-0 bg-gradient-to-br from-[#001278] via-[#00209F] to-[#1a3aff] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full z-0" />

            {/* Shimmer / Glint Effect on Hover */}
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-[1000ms] ease-out pointer-events-none z-0" />

            <span className="relative z-10">View All Services</span>
            
            {/* Sliding Arrow Micro-Animation */}
            <span className="relative overflow-hidden rounded-full w-[34px] h-[34px] bg-white/[0.14] group-hover:bg-white/[0.24] group-hover:scale-105 flex items-center justify-center flex-shrink-0 transition-[background-color,transform] duration-300 z-10">
              <IoIosArrowRoundForward
                aria-hidden="true"
                className="absolute w-5 h-5 text-white transition-transform duration-300 ease-in-out translate-x-0 group-hover:translate-x-10"
              />
              <IoIosArrowRoundForward
                aria-hidden="true"
                className="absolute w-5 h-5 text-white transition-transform duration-300 ease-in-out -translate-x-10 group-hover:translate-x-0"
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
