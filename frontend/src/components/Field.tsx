import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-gray-100";

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default Field;
