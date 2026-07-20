import { useEffect, useRef, useState } from "react";
import { FaGraduationCap, FaAward, FaGlobe, FaUsers } from "react-icons/fa";
import type { IconType } from "react-icons";

// 1. Defined types clearly
interface CoreValue {
  Icon: IconType;
  title: string;
  description: string;
  badge: string;
  colorClass: string;
  bgLightClass: string;
}

// 2. Moved static data outside the component to prevent re-creation on render
const CORE_VALUES: CoreValue[] = [
  {
    Icon: FaGlobe,
    title: "Cultural Authenticity",
    description: "Our courses are built around real communication goals, combining expert instruction with interactive exercises that make learning effective and enjoyable.",
    badge: "Heritage",
    colorClass: "text-haiti-red",
    bgLightClass: "bg-haiti-red/[0.04]",
  },
  {
    Icon: FaGraduationCap,
    title: "Structured Excellence",
    description: "Our courses are built around real communication goals, combining expert instruction with interactive exercises that make learning effective and enjoyable.",
    badge: "Education",
    colorClass: "text-haiti-navy",
    bgLightClass: "bg-haiti-navy/[0.04]",
  },
  {
    Icon: FaAward,
    title: "Rigorous Precision",
    description: "For translations, every detail matters. We follow a rigorous review process to ensure accuracy, reliability, and certified documents that meet professional standards.",
    badge: "Accuracy",
    colorClass: "text-haiti-red",
    bgLightClass: "bg-haiti-red/[0.04]",
  },
  {
    Icon: FaUsers,
    title: "Diaspora Empowerment",
    description: "We bridge language gaps, helping generations reconnect, professionals advance, and families strengthen their cultural connections.",
    badge: "Community",
    colorClass: "text-haiti-navy",
    bgLightClass: "bg-haiti-navy/[0.04]",
  },
];

// 3. Extracted Card into its own functional component for readability
const ValueCard = ({ value, index, isVisible }: { value: CoreValue; index: number; isVisible: boolean }) => {
  const { Icon, title, description, badge, colorClass, bgLightClass } = value;

  return (
    <div
      className={`p-8 bg-white border border-blue-700/15 rounded-3xl shadow-xs hover:-translate-y-1.5 transition-all duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group flex flex-col justify-between ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div>
        <div className="flex justify-between items-center mb-8">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100/50 group-hover:bg-haiti-navy transition-all duration-[450ms] ${bgLightClass}`}
          >
            <Icon
              className={`w-6 h-6 transition-all duration-[450ms] group-hover:scale-110 group-hover:text-white ${colorClass}`}
            />
          </div>
          <span className="text-[10px] tracking-[0.12em] uppercase font-bold text-gray-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            {badge}
          </span>
        </div>

        <h3 className="font-roxborough font-bold text-xl sm:text-2xl text-haiti-navy mb-4 group-hover:text-haiti-red transition-colors duration-300">
          {title}
        </h3>

        <p className="text-sm leading-[1.7] text-[#6B7280] font-sans">
          {description}
        </p>
      </div>
    </div>
  );
};

// 4. Main Component is now much simpler and focused on layout/logic
export const AboutValues = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="w-full bg-white relative overflow-hidden py-[clamp(40px,8vw,60px)]"
    >
      <div className="w-full max-w-[1400px] mx-auto flex flex-col relative z-10 px-[clamp(20px,5vw,40px)]">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center gap-4 mb-16 md:mb-20">
          <span className="text-xs uppercase tracking-[0.15em] font-bold text-haiti-red">
            How We Stand Apart
          </span>
          <h2 className="font-roxborough font-bold text-3xl sm:text-4xl md:text-5xl text-haiti-navy leading-[1.2] tracking-[-0.02em] max-w-2xl">
            Our Core Values
          </h2>
          <p className="text-[#6B7280] max-w-lg font-sans">
            Principles that guide our classes, protect our translations, and support our community.
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-[1140px] mx-auto w-full">
          {CORE_VALUES.map((val, index) => (
            <ValueCard 
              key={index} 
              value={val} 
              index={index} 
              isVisible={isVisible} 
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default AboutValues;