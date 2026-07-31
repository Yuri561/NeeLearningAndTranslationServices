import { useEffect, useRef, useState } from "react";
import { FaCheck, FaQuoteLeft } from "react-icons/fa";

export const AboutFounder = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
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
      className="w-full bg-[#f8fafc] relative overflow-hidden border-y border-slate-100"
      style={{
        paddingTop: "clamp(60px, 8vw, 100px)",
        paddingBottom: "clamp(60px, 8vw, 100px)"
      }}
    >
      <div 
        className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center"
        style={{
          paddingLeft: "clamp(20px, 5vw, 40px)",
          paddingRight: "clamp(20px, 5vw, 40px)",
        }}
      >
        {/* Founder Image Frame */}
        <div
          className={`lg:col-span-5 relative flex flex-col items-center transition-all duration-[800ms] ease-out ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Background glowing rings */}
          <div className="absolute inset-0 bg-radial-gradient from-haiti-red/10 to-transparent rounded-full blur-3xl scale-110 pointer-events-none" />

          <div className="relative w-full max-w-[390px] aspect-[1/1.22] rounded-[32px] overflow-hidden border-[6px] border-white shadow-2xl bg-slate-200">
            <img
              src="/about-page-picture/card-image-2.webp"
              alt="Founder Nee - Certified Translator & Educator"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
           
          </div>

          {/* Stylized Signature Testimonial Block */}
          <div className="absolute -bottom-6 -right-6 bg-white border border-blue-400/10 p-6 rounded-2xl shadow-xl max-w-[310px] hidden xl:block transition-all duration-300 hover:shadow-2xl">
            <FaQuoteLeft className="text-haiti-red/15 w-8 h-8 absolute top-3 left-4 pointer-events-none" />
            <p className="font-roxborough italic text-sm text-haiti-navy leading-relaxed relative z-10 pt-2">
              "Language is the gateway to understanding a culture, a people, and a heritage. At Nee's, we don't just translate words—we preserve the heart and soul behind them."
            </p>
            <div className="w-full h-px bg-slate-100 my-3" />
            <p className="text-right text-[11px] font-bold text-haiti-red tracking-wider uppercase">
              Needo, Translator
            </p>
          </div>
        </div>

        {/* Founder Content */}
        <div
          className={`lg:col-span-7 flex flex-col gap-6 md:gap-8 transition-all duration-[800ms] ease-out delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
      
          <h2 className="font-roxborough font-bold text-3xl sm:text-4xl md:text-5xl text-haiti-navy leading-[1.2] tracking-[-0.02em]">
            Guided by expertise, <br />
            anchored in <em className="italic text-haiti-red font-medium">cultural roots</em>.
          </h2>

          <p className="text-[#6B7280] leading-relaxed text-base sm:text-lg font-sans">
            As a bilingual educator, certified translator, and native speaker, Nee founded this agency to deliver the highest standard of instruction and professional document translation. By building custom academic materials, Nee bridges generational boundaries and equips professionals to navigate official communications with confidence.
          </p>

          {/* List with styled checks */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-haiti-red/10 flex items-center justify-center text-haiti-red mt-1">
                <FaCheck className="w-2.5 h-2.5" />
              </div>
              <div>
                <h4 className="font-roxborough text-[17px] font-bold text-haiti-navy">Bilingual Curriculum</h4>
                <p className="text-sm text-[#6B7280] mt-0.5 leading-relaxed">
                  Custom learning paths designed around conversational fluency, practical grammar, and deep cultural immersion.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-haiti-navy/10 flex items-center justify-center text-haiti-navy mt-1">
                <FaCheck className="w-2.5 h-2.5" />
              </div>
              <div>
                <h4 className="font-roxborough text-[17px] font-bold text-haiti-navy">Cultural Insights</h4>
                <p className="text-sm text-[#6B7280] mt-0.5 leading-relaxed">
                  Understand the culture behind the language and communicate more naturally in real-world situations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder;
