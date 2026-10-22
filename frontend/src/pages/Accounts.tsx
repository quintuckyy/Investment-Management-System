import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import apiClient from "../api/client";
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
import type { Account, Investor } from "../types/investment";
import type { FieldErrors } from "../utils/errors";

const ACCOUNT_TYPES = ["INDIVIDUAL", "JOINT", "RETIREMENT", "CORPORATE"];
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const emptyForm = {
  investor: "",
  account_number: "",
  account_type: "INDIVIDUAL",
  status: "ACTIVE",
};

function formatPeso(value: string | number) {
  return `₱${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Accounts() {
  const { isStaff } = useAuth();
  const { items, loading, loadError, save, remove } =
    useResource<Account>("/accounts/");

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editing, setEditing] = useState<Account | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [deleting, setDeleting] = useState<Account | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    apiClient
      .get<Investor[]>("/investors/")
      .then((response) => setInvestors(response.data))
      .catch(() => setInvestors([]));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((account) =>
      [account.account_number, account.investor_name, account.account_type].some(
        (value) => value.toLowerCase().includes(term)
      )
    );
  }, [items, search]);

  // Keep an existing, non-standard account type selectable when editing.
  const typeOptions = ACCOUNT_TYPES.includes(form.account_type)
    ? ACCOUNT_TYPES
    : [...ACCOUNT_TYPES, form.account_type];

  function openForm(account: Account | "new") {
    setForm(
      account === "new"
        ? emptyForm
        : {
            investor: String(account.investor),
            account_number: account.account_number,
            account_type: account.account_type,
            status: account.status,
          }
    );
    setFormError("");
    setFieldErrors({});
    setEditing(account);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setFormError("");
    setFieldErrors({});

    const error = await save(
      {
        investor: Number(form.investor),
        account_number: form.account_number.trim(),
        account_type: form.account_type,
        status: form.status,
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
      text:
        editing === "new"
          ? "Account created. Add funds with a deposit on the Transactions page."
          : "Account updated.",
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

    setNotice({
      type: "success",
      text: `Account ${deleting.account_number} was deleted.`,
    });
    setDeleting(null);
  }

  if (loading) {
    return <p className="text-gray-600">Loading accounts...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Investment accounts owned by investors. An investor can hold several accounts."
        action={
          isStaff && (
            <PrimaryButton onClick={() => openForm("new")}>
              Add account
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
          placeholder="Search by account number, investor or type"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID",
                "Investor",
                "Account Number",
                "Type",
                "Balance",
                "Status",
                "Created At",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  {heading}
                </th>
              ))}
              {isStaff && <th className="px-6 py-3" />}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {visible.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {account.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {account.investor_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {account.account_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {account.account_type}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatPeso(account.balance)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[account.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(account.created_at).toLocaleString()}
                </td>
                {isStaff && (
                  <td className="px-6 py-4">
                    <RowActions
                      onEdit={() => openForm(account)}
                      onDelete={() => {
                        setDeleteError("");
                        setDeleting(account);
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={isStaff ? 8 : 7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  {items.length === 0
                    ? "No accounts found."
                    : "No accounts match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === "new" ? "Add account" : "Edit account"}
          description={
            editing !== "new"
              ? `Current balance: ${formatPeso(editing.balance)}. Balances change through transactions and orders only.`
              : "New accounts start with a ₱0.00 balance."
          }
          onClose={() => !saving && setEditing(null)}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <Notice type="error" message={formError} />}

            <Field label="Investor" htmlFor="investor" error={fieldErrors.investor}>
              <select
                id="investor"
                required
                autoFocus
                className={inputClass}
                value={form.investor}
                onChange={(e) => setForm({ ...form, investor: e.target.value })}
              >
                <option value="">Select investor</option>
                {investors.map((investor) => (
                  <option key={investor.id} value={investor.id}>
                    {investor.full_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Account number"
              htmlFor="account_number"
              error={fieldErrors.account_number}
            >
              <input
                id="account_number"
                required
                maxLength={30}
                className={inputClass}
                value={form.account_number}
                onChange={(e) =>
                  setForm({ ...form, account_number: e.target.value })
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Type"
                htmlFor="account_type"
                error={fieldErrors.account_type}
              >
                <select
                  id="account_type"
                  className={inputClass}
                  value={form.account_type}
                  onChange={(e) =>
                    setForm({ ...form, account_type: e.target.value })
                  }
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status" htmlFor="status" error={fieldErrors.status}>
                <select
                  id="status"
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <FormActions
              saving={saving}
              onCancel={() => setEditing(null)}
              submitLabel={editing === "new" ? "Create account" : "Save changes"}
            />
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete account"
          message={`Delete account ${deleting.account_number}? Accounts that have transactions, orders or holdings cannot be deleted.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export default Accounts;
