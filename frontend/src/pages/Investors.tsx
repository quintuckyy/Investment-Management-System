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
import type { Investor } from "../types/investment";
import type { FieldErrors } from "../utils/errors";

const emptyForm = { full_name: "", email: "", phone_number: "" };

function Investors() {
  const { isStaff } = useAuth();
  const { items, loading, loadError, save, remove } =
    useResource<Investor>("/investors/");

  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editing, setEditing] = useState<Investor | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [deleting, setDeleting] = useState<Investor | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((investor) =>
      [investor.full_name, investor.email, investor.phone_number ?? ""].some(
        (value) => value.toLowerCase().includes(term)
      )
    );
  }, [items, search]);

  function openForm(investor: Investor | "new") {
    setForm(
      investor === "new"
        ? emptyForm
        : {
            full_name: investor.full_name,
            email: investor.email,
            phone_number: investor.phone_number ?? "",
          }
    );
    setFormError("");
    setFieldErrors({});
    setEditing(investor);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setFormError("");
    setFieldErrors({});

    const error = await save(
      {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || null,
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
      text: editing === "new" ? "Investor created." : "Investor updated.",
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

    setNotice({ type: "success", text: `${deleting.full_name} was deleted.` });
    setDeleting(null);
  }

  if (loading) {
    return <p className="text-gray-600">Loading investors...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Investors"
        description="List of registered investors in the system."
        action={
          isStaff && (
            <PrimaryButton onClick={() => openForm("new")}>
              Add investor
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
          placeholder="Search by name, email or phone"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["ID", "Full Name", "Email", "Phone Number", "Created At"].map(
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
            {visible.map((investor) => (
              <tr key={investor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {investor.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {investor.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {investor.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {investor.phone_number || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(investor.created_at).toLocaleString()}
                </td>
                {isStaff && (
                  <td className="px-6 py-4">
                    <RowActions
                      onEdit={() => openForm(investor)}
                      onDelete={() => {
                        setDeleteError("");
                        setDeleting(investor);
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
                    ? "No investors found."
                    : "No investors match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === "new" ? "Add investor" : "Edit investor"}
          onClose={() => !saving && setEditing(null)}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <Notice type="error" message={formError} />}

            <Field label="Full name" htmlFor="full_name" error={fieldErrors.full_name}>
              <input
                id="full_name"
                required
                autoFocus
                maxLength={100}
                className={inputClass}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>

            <Field label="Email" htmlFor="email" error={fieldErrors.email}>
              <input
                id="email"
                type="email"
                required
                maxLength={100}
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            <Field
              label="Phone number (optional)"
              htmlFor="phone_number"
              error={fieldErrors.phone_number}
            >
              <input
                id="phone_number"
                maxLength={20}
                className={inputClass}
                value={form.phone_number}
                onChange={(e) =>
                  setForm({ ...form, phone_number: e.target.value })
                }
              />
            </Field>

            <FormActions
              saving={saving}
              onCancel={() => setEditing(null)}
              submitLabel={editing === "new" ? "Create investor" : "Save changes"}
            />
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete investor"
          message={`Delete ${deleting.full_name}? This cannot be undone. Investors who still have accounts cannot be deleted.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export default Investors;
