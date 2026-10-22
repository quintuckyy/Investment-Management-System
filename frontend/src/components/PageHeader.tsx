import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-gray-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {children}
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
    />
  );
}

export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}

export function FormActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

export default PageHeader;
