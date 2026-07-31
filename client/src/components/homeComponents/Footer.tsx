import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa6";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import Logo from "./navbar/Logo";

/* ─── Module-level constant — never re-computed on render ─── */
const CURRENT_YEAR = new Date().getFullYear();

/* ─── Link data ─── */
const serviceLinks = [
  { label: "Language Learning",    href: "/#courses" },
  { label: "Translation Services", href: "/#courses" },
  { label: "Cultural Integration", href: "/#courses" },
];

const companyLinks = [
  { label: "About Us",   href: "/about"   },
  { label: "Pricing",    href: "/#pricing" },
  { label: "Contact Us", href: "/#contact" },
  { label: "FAQ",        href: "/#faq"     },
];

const socialLinks = [
  {
    icon: <FaFacebookF aria-hidden="true" />,
    href: "https://facebook.com",
    label: "Follow us on Facebook",
  },
  {
    icon: <FaXTwitter aria-hidden="true" />,
    href: "https://x.com",
    label: "Follow us on X (Twitter)",
  },
  {
    icon: <FaInstagram aria-hidden="true" />,
    href: "https://instagram.com",
    label: "Follow us on Instagram",
  },
  {
    icon: <FaLinkedinIn aria-hidden="true" />,
    href: "https://linkedin.com",
    label: "Connect on LinkedIn",
  },
];

/* ─── Footer ─── */
const Footer = () => {
  return (
    <footer
      className="w-full relative overflow-hidden bg-gradient-to-br from-[#080c18] via-[#0b1245] to-[#06439f]"
      style={{
        paddingTop: "clamp(64px,8vw,96px)",
        paddingBottom: "clamp(32px,4vw,48px)",
      }}
      aria-label="Site footer"
    >
      {/* Decorative radial glows */}
      <div
        aria-hidden="true"
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0 -bottom-[200px] -left-[100px] bg-[radial-gradient(circle,rgba(6,67,159,0.25)_0%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0 -top-[100px] -right-[100px] bg-[radial-gradient(circle,rgba(206,17,38,0.10)_0%,transparent_70%)]"
      />

      {/* Inner container */}
      <div
        className="w-full max-w-[1400px] mx-auto relative z-10 flex flex-col"
        style={{
          paddingLeft: "clamp(20px,5vw,40px)",
          paddingRight: "clamp(20px,5vw,40px)",
          gap: "clamp(40px,5vw,56px)",
        }}
      >
        {/* ── Top row ── */}
        <div
          className="flex flex-row items-start w-full max-[900px]:flex-col max-[900px]:gap-12"
          style={{ gap: "clamp(40px,6vw,80px)" }}
        >
          {/* Brand block */}
          <div className="flex flex-col gap-5 max-w-[280px] flex-shrink-0 max-[900px]:max-w-full">
            <Logo variant="light" />

            <p className="font-sans text-[17px] leading-[1.65] text-white/70 m-0">
              Empowering learners through structured Haitian Kreyòl and
              certified translation services.
            </p>

            {/* Social icons */}
            <div
              className="flex flex-row gap-2.5 items-center flex-wrap"
              role="list"
              aria-label="Social media links"
            >
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  role="listitem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border-[1.5px] border-white/[0.18] flex items-center justify-center text-white/70 text-[14px] no-underline flex-shrink-0 transition-[background,border-color,color,transform] duration-[250ms] [@media(hover:hover)]:hover:bg-haiti-red [@media(hover:hover)]:hover:border-haiti-red [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-[3px] focus-visible:rounded-full"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div
            className="flex-1 flex flex-row flex-wrap items-start justify-end gap-[clamp(32px,5vw,64px)] max-[900px]:justify-start max-[580px]:flex-col max-[580px]:gap-8"
          >
            {/* Services column */}
            <nav aria-label="Services links" className="flex flex-col gap-4 min-w-[120px]">
              <h3 className="font-sans text-[17px] font-bold tracking-[0.12em] uppercase text-white/50 m-0 leading-[1.4]">
                Services
              </h3>
              <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
                {serviceLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="font-sans text-[17px] text-white/65 no-underline leading-[1.4] transition-colors duration-200 [@media(hover:hover)]:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-[2px] focus-visible:rounded-[2px] focus-visible:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Company column */}
            <nav aria-label="Company links" className="flex flex-col gap-4 min-w-[120px]">
              <h3 className="font-sans text-[17px] font-bold tracking-[0.12em] uppercase text-white/50 m-0 leading-[1.4]">
                Company
              </h3>
              <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
                {companyLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="font-sans text-[17px] text-white/65 no-underline leading-[1.4] transition-colors duration-200 [@media(hover:hover)]:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-[2px] focus-visible:rounded-[2px] focus-visible:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact column */}
            <div aria-label="Contact information" className="flex flex-col gap-4 min-w-[120px]">
              <h3 className="font-sans text-[17px] font-bold tracking-[0.12em] uppercase text-white/50 m-0 leading-[1.4]">
                Get in Touch
              </h3>
              <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
                <li>
                  <a
                    href="mailto:info@neeslearning.com"
                    className="flex items-center gap-2 font-sans text-[17px] text-white/65 no-underline leading-[1.4] transition-colors duration-200 [@media(hover:hover)]:hover:text-white"
                    aria-label="Email us at info@neeslearning.com"
                  >
                    <IoMailOutline aria-hidden="true" className="text-[20px] flex-shrink-0 opacity-80" />
                    Neeslearning@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+15551234567"
                    className="flex items-center gap-2 font-sans text-[17px] text-white/65 no-underline leading-[1.4] transition-colors duration-200 [@media(hover:hover)]:hover:text-white"
                    aria-label="Call us at +1 555 123 4567"
                  >
                    <IoCallOutline aria-hidden="true" className="text-[16px] flex-shrink-0 opacity-80" />
                    +1 (555) 123-4567
                  </a>
                </li>
              </ul>

              {/* CTA pill */}
              <Link
                to="/#contact"
                aria-label="Book a free consultation"
                className="inline-flex items-center justify-center mt-2 px-[22px] py-[10px] rounded-full bg-white/[0.10] border-[1.5px] border-white/[0.22] font-sans text-[12px] font-bold tracking-[0.08em] uppercase text-white/85 no-underline whitespace-nowrap transition-[background,border-color,color,transform] duration-[250ms] [@media(hover:hover)]:hover:bg-haiti-red [@media(hover:hover)]:hover:border-haiti-red [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-[3px]"
              >
                Book a Free Consultation
              </Link>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          aria-hidden="true"
          className="w-full h-px bg-white/[0.10] flex-shrink-0"
        />

        {/* ── Bottom row ── */}
        <div className="flex flex-row items-center justify-between flex-wrap gap-4 max-[580px]:flex-col max-[580px]:items-start max-[580px]:gap-3">
          <p className="font-sans text-[17px] text-white/40 m-0 leading-[1.5]">
            &copy; {CURRENT_YEAR} Nee&apos;s Learning &amp; Translation Services.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
