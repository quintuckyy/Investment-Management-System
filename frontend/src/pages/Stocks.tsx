import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Field, { inputClass } from "../components/Field";
import Modal from "../components/Modal";
import Notice from "../components/Notice";
import PageHeader, {
  FormActions,
  PrimaryButton,
  RowActions,
  SearchBox,
} from "../components/PageHeader";
import { useResource } from "../hooks/useResource";
import type { Stock } from "../types/investment";
import type { FieldErrors } from "../utils/errors";

const emptyForm = { symbol: "", company_name: "", current_price: "" };

function Stocks() {
  const { isStaff } = useAuth();
  const { items, loading, loadError, save, remove } =
    useResource<Stock>("/stocks/");

  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editing, setEditing] = useState<Stock | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [deleting, setDeleting] = useState<Stock | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((stock) =>
      [stock.symbol, stock.company_name].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [items, search]);

  function openForm(stock: Stock | "new") {
    setForm(
      stock === "new"
        ? emptyForm
        : {
            symbol: stock.symbol,
            company_name: stock.company_name,
            current_price: stock.current_price,
          }
    );
    setFormError("");
    setFieldErrors({});
    setEditing(stock);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setFormError("");
    setFieldErrors({});

    const error = await save(
      {
        symbol: form.symbol.trim().toUpperCase(),
        company_name: form.company_name.trim(),
        current_price: form.current_price,
      },
      editing === "new" ? undefined : editing.id
    );

    setSaving(false);

    if (error) {
      setFormError(error.message);
      setFieldErrors(error.fieldErrors);
      return;
    }

    setNotice({
      type: "success",
      text: editing === "new" ? "Stock created." : "Stock updated.",
    });
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;

    setDeleteBusy(true);
    setDeleteError("");
    const error = await remove(deleting.id);
    setDeleteBusy(false);

    if (error) {
      setDeleteError(error.message);
      return;
    }

    setNotice({ type: "success", text: `${deleting.symbol} was deleted.` });
    setDeleting(null);
  }

  if (loading) {
    return <p className="text-gray-600">Loading stocks...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Stocks"
        description="Available stocks that can be used for buy and sell orders."
        action={
          isStaff && (
            <PrimaryButton onClick={() => openForm("new")}>
              Add stock
            </PrimaryButton>
          )
        }
      />

      <div className="mt-6 space-y-4">
        {loadError && <Notice type="error" message={loadError} />}
        {notice && (
          <Notice
            type={notice.type}
            message={notice.text}
            onDismiss={() => setNotice(null)}
          />
        )}
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search by symbol or company"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["ID", "Symbol", "Company Name", "Current Price", "Created At"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {heading}
                  </th>
                )
              )}
              {isStaff && <th className="px-6 py-3" />}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {visible.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{stock.id}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {stock.symbol}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {stock.company_name}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ₱
                  {Number(stock.current_price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(stock.created_at).toLocaleString()}
                </td>
                {isStaff && (
                  <td className="px-6 py-4">
                    <RowActions
                      onEdit={() => openForm(stock)}
                      onDelete={() => {
                        setDeleteError("");
                        setDeleting(stock);
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={isStaff ? 6 : 5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  {items.length === 0
                    ? "No stocks found."
                    : "No stocks match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === "new" ? "Add stock" : "Edit stock"}
          onClose={() => !saving && setEditing(null)}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <Notice type="error" message={formError} />}

            <Field label="Symbol" htmlFor="symbol" error={fieldErrors.symbol}>
              <input
                id="symbol"
                required
                autoFocus
                maxLength={10}
                className={`${inputClass} uppercase`}
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              />
            </Field>

            <Field
              label="Company name"
              htmlFor="company_name"
              error={fieldErrors.company_name}
            >
              <input
                id="company_name"
                required
                maxLength={150}
                className={inputClass}
                value={form.company_name}
                onChange={(e) =>
                  setForm({ ...form, company_name: e.target.value })
                }
              />
            </Field>

            <Field
              label="Current price (₱)"
              htmlFor="current_price"
              error={fieldErrors.current_price}
              hint="Must be greater than 0."
            >
              <input
                id="current_price"
                type="number"
                required
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className={inputClass}
                value={form.current_price}
                onChange={(e) =>
                  setForm({ ...form, current_price: e.target.value })
                }
              />
            </Field>

            <FormActions
              saving={saving}
              onCancel={() => setEditing(null)}
              submitLabel={editing === "new" ? "Create stock" : "Save changes"}
            />
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete stock"
          message={`Delete ${deleting.symbol} (${deleting.company_name})? Stocks that have orders or holdings cannot be deleted.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export default Stocks;
