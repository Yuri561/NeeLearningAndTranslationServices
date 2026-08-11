import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { navLinks } from "../../../variables/variables";
import type { NavLink } from "../../../type/types";
import GetInTouchButton from "./GetInTouchButton";
import Logo from "./Logo";
import { HiMenu, HiX } from "react-icons/hi";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      <nav className="w-full border rounded-full bg-white/90 backdrop-blur-md border-blue-400/20 flex items-center justify-between py-2.5 px-3 md:px-7 shadow-sm transition-all duration-300">
        {/* Logo */}
        <Logo />

        {/* Desktop Nav Links */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link: NavLink) => {
            const isActive = location.pathname === link.url;
            return (
              <li key={link.id}>
                <a
                  href={link.url}
                  className={`font-sans text-[14px] font-semibold tracking-wider uppercase transition-colors duration-200 ${
                    isActive ? "text-accent" : "text-primary hover:text-accent"
                  }`}
                >
                  {link.title}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <GetInTouchButton />
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-primary hover:text-accent transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border border-blue-400/10 rounded-3xl p-6 shadow-xl z-40 animate-fade-in">
          <ul className="flex flex-col gap-5 text-center mb-6">
            {navLinks.map((link: NavLink) => (
              <li key={link.id}>
                <Link
                  to={link.url}
                  onClick={() => setIsOpen(false)}
                  className="font-sans text-[16px] font-semibold uppercase tracking-wider text-primary hover:text-accent block py-2"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
          <div onClick={() => setIsOpen(false)} className="flex justify-center">
            <GetInTouchButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default NavBar;