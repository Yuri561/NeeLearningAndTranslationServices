import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";

export const ContactForm = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Haitian Creole Lessons",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) errors.name = "Full name is required";
    if (!formState.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formState.message.trim()) errors.message = "Message cannot be empty";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    // Simulate premium API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormState({
        name: "",
        email: "",
        phone: "",
        service: "Haitian Creole Lessons",
        message: "",
      });
    }, 1500);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-white border border-blue-600/15 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-center overflow-hidden">
      
      {/* Submission Success Screen */}
      {submitSuccess ? (
        <div className="flex flex-col items-center justify-center text-center gap-6 py-12 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-haiti-red/10 border border-haiti-red/20 flex items-center justify-center text-haiti-red shadow-lg animate-bounce">
            <FaCheck className="w-8 h-8" />
          </div>
          <h3 className="font-roxborough font-bold text-3xl text-haiti-navy">Message Received!</h3>
          <p className="max-w-md text-sm text-gray-500 leading-relaxed">
            Mèsi! Thank you for reaching out to Nee's. We've received your request and will contact you via email within the next 24 hours.
          </p>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-haiti-navy hover:text-haiti-red transition-colors duration-300 mt-4 cursor-pointer"
          >
            Send Another Message <HiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
          
          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs uppercase tracking-wider font-bold text-haiti-navy/70">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              className={`w-full px-5 py-3.5 rounded-xl border font-sans text-sm focus:outline-none transition-all duration-300 bg-slate-50/30 hover:bg-slate-50/50 focus:bg-white ${
                formErrors.name 
                  ? "border-haiti-red focus:border-haiti-red focus:ring-4 focus:ring-haiti-red/5" 
                  : "border-blue-400/15 focus:border-haiti-navy focus:ring-4 focus:ring-haiti-navy/5"
              }`}
              placeholder="e.g. John Doe"
            />
            {formErrors.name && (
              <span className="text-[11px] text-haiti-red font-semibold mt-0.5">{formErrors.name}</span>
            )}
          </div>

          {/* Two columns for Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wider font-bold text-haiti-navy/70">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleInputChange}
                className={`w-full px-5 py-3.5 rounded-xl border font-sans text-sm focus:outline-none transition-all duration-300 bg-slate-50/30 hover:bg-slate-50/50 focus:bg-white ${
                  formErrors.email 
                    ? "border-haiti-red focus:border-haiti-red focus:ring-4 focus:ring-haiti-red/5" 
                    : "border-blue-400/15 focus:border-haiti-navy focus:ring-4 focus:ring-haiti-navy/5"
                }`}
                placeholder="e.g. name@example.com"
              />
              {formErrors.email && (
                <span className="text-[11px] text-haiti-red font-semibold mt-0.5">{formErrors.email}</span>
              )}
            </div>

            {/* Phone field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs uppercase tracking-wider font-bold text-haiti-navy/70">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formState.phone}
                onChange={handleInputChange}
                className="w-full px-5 py-3.5 rounded-xl border border-blue-400/15 bg-slate-50/30 hover:bg-slate-50/50 focus:bg-white font-sans text-sm focus:outline-none focus:border-haiti-navy focus:ring-4 focus:ring-haiti-navy/5 transition-all duration-300"
                placeholder="e.g. +1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Dropdown for Service Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="service" className="text-xs uppercase tracking-wider font-bold text-haiti-navy/70">
              Service Requested
            </label>
            <select
              id="service"
              name="service"
              value={formState.service}
              onChange={handleInputChange}
              className="w-full px-5 py-3.5 rounded-xl border border-blue-400/15 bg-slate-50/30 hover:bg-slate-50/50 focus:bg-white font-sans text-sm focus:outline-none focus:border-haiti-navy focus:ring-4 focus:ring-haiti-navy/5 transition-all duration-300 cursor-pointer"
            >
              <option value="Haitian Creole Lessons">Haitian Creole Lessons (Private/Group)</option>
              <option value="Translation Services">Certified Translation Quote</option>
              <option value="Cultural Consultations">Cultural Consultation & workshops</option>
              <option value="General Inquiry">General Question / Other</option>
            </select>
          </div>

          {/* Message textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs uppercase tracking-wider font-bold text-haiti-navy/70">
              Your Message *
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formState.message}
              onChange={handleInputChange}
              className={`w-full px-5 py-3.5 rounded-xl border font-sans text-sm focus:outline-none resize-none transition-all duration-300 bg-slate-50/30 hover:bg-slate-50/50 focus:bg-white ${
                formErrors.message 
                  ? "border-haiti-red focus:border-haiti-red focus:ring-4 focus:ring-haiti-red/5" 
                  : "border-blue-400/15 focus:border-haiti-navy focus:ring-4 focus:ring-haiti-navy/5"
              }`}
              placeholder="Tell us about your learning goals or outline details for document translation..."
            />
            {formErrors.message && (
              <span className="text-[11px] text-haiti-red font-semibold mt-0.5">{formErrors.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full relative inline-flex items-center justify-center gap-3 bg-linear-to-br from-[#080c18] via-[#0d1f7a] to-[#00209F] text-white py-4 px-8 rounded-full font-sans text-xs font-bold tracking-[0.12em] uppercase cursor-pointer border-none shadow-[0_4px_20px_rgba(0,32,159,0.4),0_1px_6px_rgba(8,12,24,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,32,159,0.4)] disabled:opacity-75 disabled:cursor-not-allowed group mt-2"
          >
            {isSubmitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Message</span>
                <HiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>

          {/* Note about file uploads */}
          {formState.service === "Translation Services" && (
            <p className="text-[11px] text-gray-500 leading-relaxed text-center mt-2.5">
              💡 Need to upload documents? Submit this form and we'll reply with a link to upload your files securely, or you can email them to us directly at <a href="mailto:Neeslearning@gmail.com" className="text-haiti-red underline">Neeslearning@gmail.com</a>.
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default ContactForm;
