import { useEffect, useRef, useState } from "react";
import { FaGlobe, FaHeart } from "react-icons/fa";

export const AboutStory = () => {
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
      className="w-full bg-white relative overflow-hidden z-10"
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
        {/* Left Text Column */}
        <div
          className={`lg:col-span-7 flex flex-col gap-6 md:gap-8 transition-all duration-[800ms] ease-out ${
            visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
          }`}
        >      
          <h2 className="font-roxborough font-bold text-3xl sm:text-4xl md:text-5xl text-haiti-navy leading-[1.2] tracking-[-0.02em]">
            Bridging Haitian heritage <br />
            with <em className="italic text-haiti-red font-medium">global communication</em>.
          </h2>
          
          <p className="text-[#18181B] leading-relaxed text-base sm:text-lg font-sans">
            Nee’s Learning & Translation Services was founded with a heartfelt mission: to help students, professionals, and families connect through the beauty, history, and richness of Haitian Creole.
            What began as a passion for sharing the language and culture has grown into a trusted service where people can learn, communicate, and feel connected. 
            </p>

          {/* Structured point grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div className="p-6 border border-blue-700/15 rounded-2xl bg-slate-50/40 hover:bg-white hover:border-blue-400/20 shadow-xs transition-all duration-300 group flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-haiti-red/5 flex items-center justify-center text-haiti-red group-hover:bg-haiti-red group-hover:text-white transition-colors duration-300">
                <FaHeart className="w-4 h-4" />
              </div>
              <h4 className="font-roxborough text-lg font-bold text-haiti-navy">Linguistic Pride</h4>
              <p className="text-xs sm:text-sm text-[#18181B] leading-relaxed">
                We support students gain confidence, understanding cultural traditions, and connecting with their language through authentic language instruction.
              </p>
            </div>

            <div className="p-6 border border-blue-400/30 rounded-2xl bg-slate-50/40 hover:bg-white hover:border-blue-400/20 hover:shadow-[0_12px_32px_rgba(6,67,159,0.06)] transition-all duration-300 group flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-haiti-navy/5 flex items-center justify-center text-haiti-navy group-hover:bg-haiti-navy group-hover:text-white transition-colors duration-300">
                <FaGlobe className="w-4 h-4" />
              </div>
              <h4 className="font-roxborough text-lg font-bold text-haiti-navy">Certified Integrity</h4>
              <p className="text-xs sm:text-sm text-[#18181B] leading-relaxed">
                We provide accurate, certified translations for essential documents, supporting legal, medical, and administrative needs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Image Layout */}
        <div
          className={`lg:col-span-5 relative flex items-center justify-center transition-all duration-[800ms] ease-out delay-200 ${
            visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}
        >
          {/* Background design elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,67,159,0.06)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-haiti-red/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-haiti-navy/5 rounded-full blur-2xl pointer-events-none" />

          {/* Premium overlapping stacked images */}
          <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
            
            {/* Back Image (Offset and styled) */}
            <div className="absolute -left-6 -bottom-6 w-4/5 h-4/5 rounded-[24px] overflow-hidden border border-blue-400/10 shadow-lg scale-95 opacity-50 bg-slate-100">
              <img
                src="/about-page-picture/card-image.jpg"
                alt="Student study board"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Front Primary Image */}
            <div className="relative rounded-[24px] overflow-hidden border border-blue-400/15 shadow-2xl w-full h-full bg-slate-100 group">
              <img
                src="/about-page-picture/card-image.jpg"
                alt="Interactive learning collage"
                className="w-full h-full object-cover opacity-95 transition-transform duration-[800ms] group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Visual Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-haiti-navy/60 via-haiti-navy/10 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                <span className="text-[10px] uppercase tracking-[0.12em] font-bold bg-white/15 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-xs">
                  Diaspora Connection
                </span>
                <p className="font-roxborough text-xl font-semibold mt-2.5">Honoring Haitian Kreyòl & Culture</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
