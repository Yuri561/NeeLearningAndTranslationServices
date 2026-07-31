type LanguageIconProp = {
  name: string;
  label: string;
  path: string;
};

const languagesIconPaths: LanguageIconProp[] = [
  {
    name: "French",
    label: "French",
    path: "/language-icons/france.png",
  },
  {
    name: "Haitian Creole",
    label: "Kreyol Ayisyen",
    path: "/language-icons/haiti.png",
  },
  {
    name: "Spanish",
    label: "Spanish",
    path: "/language-icons/spain.png",
  },
  {
    name: "English",
    label: "English",
    path: "/language-icons/united-kingdom.png",
  },
  {
    name: "Portuguese",
    label: "Portuguese",
    path: "/language-icons/portugal.png",
  },
];

const tickerItems = [...languagesIconPaths, ...languagesIconPaths];

const TickerForLanguage = () => {
  return (
    <section className="relative overflow-hidden border-[rgba(6,67,159,0.10)] py-5 sm:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0)_100%)] sm:w-24"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-[linear-gradient(270deg,#ffffff_0%,rgba(255,255,255,0)_100%)] sm:w-24"
      />

      <div className="mx-auto flex max-w-8xl flex-col gap-4 px-4 sm:px-6 lg:px-20">
        <div className="flex flex-col items-center justify-between gap-3 text-center lg:flex-row lg:text-left">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.39em] text-[var(--color-accent)]">
            Languages We Teach
          </p>
          <p className="max-w-2xl text-sm font-medium tracking-[0.09em] text-slate-600 uppercase sm:text-[15px]">
            Learn, translate, and communicate with confidence across every step.
          </p>
        </div>

        <div className="overflow-hidden   py-3">
          <div className="flex min-w-max animate-marquee items-center gap-4 px-4 sm:gap-5 sm:px-5">
            {tickerItems.map((language, index) => (
              <article
                key={`${language.name}-${index}`}
                className="flex min-w-[190px] items-center gap-3 rounded-full border border-[rgba(6,67,159,0.10)] px-4 py-3  transition-transform duration-300"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                  <img
                    src={language.path}
                    alt={`${language.name} flag`}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Language
                  </span>
                  <span className="font-sans text-base font-bold text-[var(--color-haiti-navy)]">
                    {language.label}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TickerForLanguage;