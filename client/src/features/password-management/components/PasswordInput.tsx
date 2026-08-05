import { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
};

export const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide text-haiti-navy/70">
        {label}
      </label>
      <div className="relative">
        <FiLock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border bg-slate-50/40 pl-11 pr-12 text-sm font-semibold text-slate-800 transition placeholder:text-slate-400 focus:bg-white focus:outline-none ${
            error ? "border-red-300" : "border-blue-700/15 hover:border-slate-300 focus:border-haiti-navy"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-haiti-navy"
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {error ? <p id={`${id}-error`} className="text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
};

