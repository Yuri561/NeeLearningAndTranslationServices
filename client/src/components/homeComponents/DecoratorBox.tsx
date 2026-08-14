import React from "react";

const DEFAULT_USERS = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=12",
  "https://i.pravatar.cc/150?img=32",
  "https://i.pravatar.cc/150?img=47",
];

export interface DecoratorBoxProps {
  /** Additional styling/positioning classes (e.g., 'absolute bottom-[-16px] left-1/2 -translate-x-1/2') */
  className?: string;
  /** Rating text (defaults to "4.9 / 5.0") */
  rating?: string;
  /** Reviews count text (defaults to "from 2,400+ reviews") */
  reviewsCount?: string;
  /** Tagline text (defaults to "Trusted Worldwide") */
  tagline?: string;
  /** Array of avatar image URLs (defaults to DEFAULT_USERS) */
  avatars?: string[];
}

const DecoratorBox: React.FC<DecoratorBoxProps> = ({
  className = "",
  rating = "4.9 / 5.0",
  reviewsCount = "from 2,400+ reviews",
  tagline = "Trusted Worldwide",
  avatars = DEFAULT_USERS,
}) => {
  return (
    <div
      className={`
        flex items-center gap-3 sm:gap-5 py-1 sm:py-[18px] px-2 sm:px-3
        bg-white/95 backdrop-blur-[12px]
        border border-[#06439f]/10 rounded-[16px] sm:rounded-[20px]
        shadow-[0_4px_24px_rgba(6,67,159,0.08),0_1px_3px_rgba(0,0,0,0.04)]
        whitespace-nowrap
        ${className}
      `}
      aria-label="Learner ratings and testimonials summary"
    >
      {/* ── Avatar stack ── */}
      <div
        className="flex items-center"
        aria-label={`Learner profiles (${avatars.length} shown)`}
      >
        {avatars.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-8 h-8 sm:w-[42px] sm:h-[42px] rounded-full border-[2px] sm:border-[2.5px] border-white object-cover -ml-2.5 sm:-ml-3 first:ml-0 shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition-transform duration-200 hover:scale-[1.12] hover:z-[2]"
            style={{ zIndex: avatars.length - i }}
          />
        ))}
 
        
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-[1px] h-[38px] bg-gradient-to-b from-transparent via-[#06439f]/15 to-transparent" aria-hidden="true" />

      {/* Stars */}
      <div
        className="hidden sm:flex gap-0.5 sm:gap-1"
        aria-label="Rating: 5 stars out of 5"
      >
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="w-4.5 h-4.5 sm:w-[22px] sm:h-[22px] text-[#f59e0b] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>

      {/* Rating info */}
      <div className="flex flex-col gap-[1px] sm:gap-[3px]">
        <span className="font-sans font-bold text-sm sm:text-[17px] text-primary tracking-[-0.01em] leading-none flex items-center gap-1">
          <span className="sm:hidden text-[#f59e0b]">★</span>
          <span>{rating}</span>
        </span>
        <span className="font-sans font-medium text-[10px] sm:text-[13px] text-[#7a8599] tracking-wider leading-none">
          {reviewsCount}
        </span>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-[1px] h-[38px] bg-gradient-to-b from-transparent via-[#06439f]/15 to-transparent" aria-hidden="true" />

      {/* Tagline */}
      <span className="hidden md:block font-sans font-semibold text-xs sm:text-sm text-primary tracking-[0.06em] uppercase opacity-70">
        {tagline}
      </span>
    </div>
  );
};

export default DecoratorBox;
