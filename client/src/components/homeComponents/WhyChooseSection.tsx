import { useEffect, useRef, useState } from "react";

interface FeatureCardData {
  headline: string;
  body: string;
  point1Title: string;
  point1Body: string;
  point2Title: string;
  point2Body: string;
  top: string;
  imagePosition: "left" | "right";
  image: string;
  imageAlt: string;
}

const features: FeatureCardData[] = [
  // This part is not needed - Deleting for better readability - Rae
  // {
  //   headline: "Designed for ease, built for real learning outcomes.",
  //   body: "Skip the confusion and experience structured language learning that works anytime, anywhere. Whether you're starting Kreyòl from scratch, improving English fluency, or helping your child, our programs adapt to your goals.",
  //   point1Title: "Safe, seamless, and always certified",
  //   point1Body:
  //     "All lessons are built by bilingual educators and certified translators. Your learning path is always guided, clear, and designed to last.",
  //   point2Title: "Track every milestone in real time",
  //   point2Body:
  //     "Instant progress tracking so you always know where you stand and what's coming next on your journey.",
  //   top: "130px",
  //   imagePosition: "left",
  //   image: "/choose-us-pictures/first-card.jpg",
  //   imageAlt:
  //     "Student studying language courses on a laptop with interactive lesson panels",
  // },
  {
    headline: "Every document is translated with precision and clarity.",
    body: "Get your documents professionally translated with accuracy and care. From legal papers to everyday forms, every translation is handled with precision, confidentiality, and attention to detail.",
    point1Title: "Built with advanced, certified expertise",
    point1Body:
      "Your translations are handled by native speakers using rigorous review standards. Every word carries accuracy and cultural nuance.",
    point2Title: "Stay updated on every translation instantly",
    point2Body:
      "Get live notifications on your document's progress from submission to final delivery.",
    top: "170px",
    imagePosition: "right",
    image: "/choose-us-pictures/second-card (1).jpg",
    imageAlt:
      "Document translation preview with professional verification checkmarks",
  },
  {
    headline: "Monitor your progress, strengthen your skills, and achieve your learning goals.",
    body: "See your progress clearly and stay motivated throughout your language journey. From skill development to everyday practice, we help you keep moving forward.",
    point1Title: "Clear progress insights, so you always know where you stand.",
    point1Body:
      "Understand what's happening at a glance. Focus on what matters most and make informed decisions without getting lost in unnecessary complexity.",
    point2Title: "Track every session in real time easily",
    point2Body:
      "Understand your progress at a glance. Focus on the skills that matter most and continue learning with confidence.",
    top: "210px",
    imagePosition: "left", 
    image: "/choose-us-pictures/third-card (3).jpg",
    imageAlt:
      "Student learning dashboard displaying completed lessons and milestones",
  },
];

/* ── Small checkmark SVG ── */
const PointCheck = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    style={{ flexShrink: 0, marginTop: "2px" }}
  >
    <circle cx="10" cy="10" r="10" fill="rgba(206, 17, 38, 0.08)" />
    <path
      d="M6 10l2.8 2.8 5-5"
      stroke="var(--color-haiti-red)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Feature Card ── */
const FeatureCard = ({
  f,
  visible,
  delay,
}: {
  f: FeatureCardData;
  visible: boolean;
  delay: number;
}) => {
  const isRight = f.imagePosition === "right";

  return (
    <div
      className={[
        "w-full bg-white border-[1.5px] border-[rgba(6,67,159,0.12)] rounded-[20px] overflow-hidden",
        "shadow-[0_4px_28px_rgba(6,67,159,0.05)] will-change-transform",
        "transition-[opacity,transform,box-shadow] duration-[650ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        "[@media(hover:hover)]:hover:shadow-[0_20px_48px_rgba(6,67,159,0.12)] [@media(hover:hover)]:hover:-translate-y-1",
        "sticky",
        // Responsive: stack vertically below 960px
        "max-[960px]:relative max-[960px]:flex-col max-[960px]:items-stretch",
        "flex items-center",
        isRight
          ? "max-[960px]:flex-col min-[961px]:flex-row-reverse"
          : "max-[960px]:flex-col min-[961px]:flex-row",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        top: f.top,
        padding: "clamp(24px,4vw,56px)",
        gap: "clamp(32px,5vw,60px)",
        transitionDelay: visible ? `${delay}ms` : "0ms",
      }}
    >
      {/* Image container */}
      <div className="rounded-[15px] overflow-hidden bg-[rgba(6,67,159,0.03)] flex items-center justify-center relative z-10 border border-[rgba(6,67,159,0.08)] flex-shrink-0 w-[490px] h-[400px] max-[1024px]:w-[400px] max-[1024px]:h-[340px] max-[960px]:w-full max-[960px]:h-[280px] max-[580px]:h-[200px]">
        <img
          src={f.image}
          alt={f.imageAlt}
          loading="lazy"
          className="w-full h-full opacity-[0.95] transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] object-cover [@media(hover:hover)]:group-hover:scale-[1.04]"
        />
      </div>

      {/* Content block */}
      <div className="flex-1 flex flex-col gap-6 relative z-10">
        <h3
          className="font-roxborough font-bold leading-[1.2] tracking-[-0.02em] text-haiti-navy m-0"
          style={{ fontSize: "clamp(24px,3vw,32px)" }}
        >
          {f.headline}
        </h3>

        <p className="font-sans text-base leading-[1.65] text-[#6B7280] m-0">
          {f.body}
        </p>

        {/* Bullet points */}
        <div className="flex flex-col gap-5">
          {[
            { title: f.point1Title, body: f.point1Body },
            { title: f.point2Title, body: f.point2Body },
          ].map((pt, j) => (
            <div key={j} className="flex gap-[14px] items-start">
              <PointCheck />
              <div>
                <h4 className="font-roxborough text-[18px] font-bold tracking-[-0.01em] text-haiti-navy m-0 mb-1 leading-[1.3]">
                  {pt.title}
                </h4>
                <p className="font-sans text-[14px] leading-[1.5] text-[#6B7280] m-0">
                  {pt.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Section ─── */
const WhyChooseSection = () => {
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
      id="why-choose"
      ref={sectionRef}
      className="w-full bg-white relative overflow-hidden"
      style={{
        paddingTop: "clamp(10px,2vw,12px)",
        paddingBottom: "clamp(64px,8vw,112px)",
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(6,67,159,0.04)_0%,transparent_70%)] pointer-events-none z-0"
      />

      {/* Container */}
      <div
        className="w-full max-w-[1400px] mx-auto flex flex-col items-center relative z-10"
        style={{
          paddingLeft: "clamp(20px,5vw,40px)",
          paddingRight: "clamp(20px,5vw,40px)",
          gap: "clamp(40px,6vw,64px)",
        }}
      >
        {/* Headline */}
        <div
          className={`flex flex-col items-center gap-[15px] max-w-[650px] text-center transition-[opacity,transform] duration-[650ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
          }`}
        >
          <span className="inline-flex items-center gap-2 bg-[rgba(6,67,159,0.06)] border border-[rgba(6,67,159,0.15)] text-haiti-navy px-[14px] py-1 rounded-full font-sans text-[12px] font-bold tracking-[0.1em] uppercase">
            Why Choose Nee's?
          </span>
          <h2
            className="font-roxborough font-bold leading-[1.15] tracking-[-0.02em] text-haiti-navy m-0"
            style={{ fontSize: "clamp(32px,4.5vw,48px)" }}
          >
            A few reasons{" "}
            <em className="italic text-haiti-red">why</em> our clients choose us
            first.
          </h2>
        </div>

        {/* Feature cards list */}
        <div className="flex flex-col gap-10 w-full max-w-[1140px]">
          {features.map((f, i) => (
            <FeatureCard key={i} f={f} visible={visible} delay={i * 150} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
