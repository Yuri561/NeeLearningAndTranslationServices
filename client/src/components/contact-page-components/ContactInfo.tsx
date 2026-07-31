import { FaEnvelope, FaClock, FaPhoneAlt, FaCheck } from "react-icons/fa";

export const ContactInfo = () => {
  return (
    <div className="flex flex-col justify-between gap-8 h-full">
      <div className="flex flex-col gap-6">
       

        {/* Detail Items */}
        <div className="flex flex-col gap-4 mt-4">
          
          {/* Email Address */}
          <a 
            href="mailto:NeesLearning@gmail.com"
            className="flex gap-4 items-center p-5 rounded-2xl border border-blue-400/10 bg-slate-50/50 hover:bg-white hover:border-blue-400/20 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-haiti-red/5 flex items-center justify-center text-haiti-red group-hover:bg-haiti-red group-hover:text-white transition-all duration-300">
              <FaEnvelope className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-roxborough text-sm font-bold text-haiti-navy">Email Support</h4>
              <p className="text-sm text-haiti-red font-semibold mt-0.5 font-mono">Neeslearning@gmail.com</p>
            </div>
          </a>

          {/* Office Hours */}
          <div className="flex gap-4 items-center p-5 rounded-2xl border border-blue-400/10 bg-slate-50/50">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-haiti-navy/5 flex items-center justify-center text-haiti-navy">
              <FaClock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-roxborough text-sm font-bold text-haiti-navy">Operating Hours</h4>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monday – Friday: 9:00 AM – 6:00 PM EST</p>
            </div>
          </div>

          {/* Telephone */}
          <div className="flex gap-4 items-center p-5 rounded-2xl border border-blue-400/10 bg-slate-50/50">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-haiti-red/5 flex items-center justify-center text-haiti-red">
              <FaPhoneAlt className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-roxborough text-sm font-bold text-haiti-navy">Response Guarantee</h4>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">All inquiries answered within 24 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Panel (Aesthetic Background Card) */}
      <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-[#080c18] via-[#0d1f7a] to-[#00209F] p-8 text-white shadow-xl mt-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(206,17,38,0.15),transparent_60%)] pointer-events-none" />
        <h3 className="font-roxborough text-blue-500 font-bold text-xl mb-4 relative z-10">Our Guarantees</h3>
        
        <ul className="flex flex-col gap-3.5 relative z-10">
          <li className="flex gap-3 items-start text-sm text-white/90">
            <div className="shrink-0 w-5 h-5 rounded-full bg-haiti-red/20 border border-haiti-red/35 flex items-center justify-center mt-0.5 text-haiti-red">
              <FaCheck className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Every lesson is tailored to your experience.</span>
          </li>
          <li className="flex gap-3 items-start text-sm text-white/90">
            <div className="shrink-0 w-5 h-5 rounded-full bg-haiti-red/20 border border-haiti-red/35 flex items-center justify-center mt-0.5 text-haiti-red">
              <FaCheck className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Your documents and personal information are handled with care.</span>
          </li>
          <li className="flex gap-3 items-start text-sm text-white/90">
            <div className="shrink-0 w-5 h-5 rounded-full bg-haiti-red/20 border border-haiti-red/35 flex items-center justify-center mt-0.5 text-haiti-red">
              <FaCheck className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Learn from knowledgeable tutors dedicated to your success.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ContactInfo;
