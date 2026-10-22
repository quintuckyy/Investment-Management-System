import { useCallback, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  MAX_FILE_SIZE,
  REQUIRED_COLUMNS,
  SAMPLE_CSV,
  buildPreview,
  downloadTextFile,
  escapeCsvValue,
  formatFileSize,
} from "../utils/csv";
import type { Preview } from "../utils/csv";

type ImportError = {
  row: number;
  reference_number: string;
  error: string;
};

type ImportResult = {
  message: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  errors: ImportError[];
};

type Banner = {
  type: "success" | "warning" | "error";
  title: string;
  text?: string;
};

function Icon({
  path,
  className = "h-5 w-5",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  upload: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zm0 0v5h5",
  download: "M12 4v12m0 0 5-5m-5 5-5-5M4 20h16",
  check: "m5 13 4 4L19 7",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  x: "M6 6l12 12M18 6 6 18",
  info: "M12 8h.01M11 12h1v4h1m8-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

function ImportTransactions() {
  const { isStaff } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setBanner(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const selectFile = useCallback(async (selected: File | null) => {
    setResult(null);
    setBanner(null);

    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setPreview(null);
      setBanner({
        type: "error",
        title: "Unsupported file type",
        text: "Only .csv files can be imported.",
      });
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setPreview(null);
      setBanner({
        type: "error",
        title: "File is too large",
        text: `The maximum file size is ${formatFileSize(MAX_FILE_SIZE)}.`,
      });
      return;
    }

    setFile(selected);

    try {
      setPreview(buildPreview(await selected.text()));
    } catch {
      setPreview(null);
      setBanner({
        type: "error",
        title: "Could not read the file",
        text: "Make sure it is a valid, UTF-8 encoded CSV file.",
      });
    }
  }, []);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0] || null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!file) {
      setBanner({
        type: "error",
        title: "No file selected",
        text: "Choose a CSV file to import.",
      });
      return;
    }

    setLoading(true);
    setBanner(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post<ImportResult>(
        "/etl/import-transactions/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const data = response.data;
      setResult(data);

      if (data.failed_rows === 0) {
        setBanner({
          type: "success",
          title: "Import completed",
          text: `All ${data.imported_rows} rows were imported successfully.`,
        });
      } else if (data.imported_rows === 0) {
        setBanner({
          type: "error",
          title: "Import failed",
          text: "No rows could be imported. Review the errors below.",
        });
      } else {
        setBanner({
          type: "warning",
          title: "Import completed with errors",
          text: `${data.imported_rows} rows imported, ${data.failed_rows} rows need attention.`,
        });
      }
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      const required: string[] | undefined = data?.required_columns;

      setBanner({
        type: "error",
        title: data?.error || data?.detail || "Failed to import CSV file.",
        text: required
          ? `Required columns: ${required.join(", ")}`
          : response
          ? undefined
          : "Could not reach the server. Check that the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  }

  function downloadErrors() {
    if (!result) return;

    const lines = [
      "row,reference_number,error",
      ...result.errors.map(
        (item) =>
          `${item.row},${escapeCsvValue(item.reference_number)},${escapeCsvValue(
            item.error
          )}`
      ),
    ];

    downloadTextFile("import_errors.csv", lines.join("\n"));
  }

  const bannerStyles = {
    success: {
      wrapper: "border-green-200 bg-green-50 text-green-800",
      icon: ICONS.check,
    },
    warning: {
      wrapper: "border-amber-200 bg-amber-50 text-amber-800",
      icon: ICONS.alert,
    },
    error: {
      wrapper: "border-red-200 bg-red-50 text-red-800",
      icon: ICONS.alert,
    },
  };

  const headerProblem = preview && preview.missingColumns.length > 0;
  const emptyFile = preview && preview.totalRows === 0 && !headerProblem;
  const canImport = !!file && !!preview && !headerProblem && !emptyFile;

  const successRate =
    result && result.total_rows > 0
      ? Math.round((result.imported_rows / result.total_rows) * 100)
      : 0;

  if (!isStaff) {
    return (
      <div className="max-w-5xl">
        <h2 className="text-3xl font-bold text-gray-900">CSV Import</h2>
        <p className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
          You have read-only access. Importing transactions requires a staff
          account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">CSV Import</h2>
          <p className="mt-2 text-gray-600">
            Bulk import transaction records. Each valid row is saved to the
            database and updates the related account balance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => downloadTextFile("transactions_template.csv", SAMPLE_CSV)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <Icon path={ICONS.download} className="h-4 w-4" />
          Download template
        </button>
      </div>

      {banner && (
        <div
          role="alert"
          className={`mt-6 flex items-start gap-3 rounded-lg border p-4 ${
            bannerStyles[banner.type].wrapper
          }`}
        >
          <Icon
            path={bannerStyles[banner.type].icon}
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">{banner.title}</p>
            {banner.text && <p className="mt-1 text-sm">{banner.text}</p>}
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded p-1 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss message"
          >
            <Icon path={ICONS.x} className="h-4 w-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            1. Upload your file
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            CSV only, UTF-8 encoded, up to {formatFileSize(MAX_FILE_SIZE)}.
          </p>
        </div>

        <div className="p-6">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => selectFile(event.target.files?.[0] || null)}
          />

          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                dragging
                  ? "border-slate-700 bg-slate-50"
                  : "border-gray-300 bg-gray-50 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <div className="rounded-full bg-white p-3 text-slate-700 shadow-sm ring-1 ring-gray-200">
                <Icon path={ICONS.upload} className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-900">
                <span className="text-slate-900 underline">Click to browse</span>{" "}
                or drag and drop your CSV file here
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Need a starting point? Download the template above.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="rounded-lg bg-white p-2.5 text-slate-700 ring-1 ring-gray-200">
                <Icon path={ICONS.file} className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                  {preview && ` · ${preview.totalRows} data row${preview.totalRows === 1 ? "" : "s"}`}
                </p>
              </div>

              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                aria-label="Remove file"
              >
                <Icon path={ICONS.x} className="h-4 w-4" />
              </button>
            </div>
          )}

          {headerProblem && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <Icon path={ICONS.alert} className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Missing required column
                {preview!.missingColumns.length > 1 ? "s" : ""}:{" "}
                <span className="font-mono font-semibold">
                  {preview!.missingColumns.join(", ")}
                </span>
                . Fix the header row and select the file again.
              </p>
            </div>
          )}

          {emptyFile && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <Icon path={ICONS.alert} className="mt-0.5 h-4 w-4 shrink-0" />
              <p>This file has a header row but no data rows to import.</p>
            </div>
          )}

          {preview && !headerProblem && preview.totalRows > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  Preview
                </h4>
                <p className="text-xs text-gray-500">
                  Showing {preview.rows.length} of {preview.totalRows} rows
                </p>
              </div>

              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.headers.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {preview.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {preview.headers.map((_, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="whitespace-nowrap px-4 py-2.5 text-gray-700"
                          >
                            {row[cellIndex] || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={reset}
            disabled={loading || (!file && !result)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={loading || !canImport}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                  />
                </svg>
                Importing…
              </>
            ) : (
              <>
                <Icon path={ICONS.upload} className="h-4 w-4" />
                Import{preview && preview.totalRows > 0 ? ` ${preview.totalRows} rows` : ""}
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                2. Import summary
              </h3>
              <p className="mt-1 text-sm text-gray-500">{result.message}</p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                result.failed_rows === 0
                  ? "bg-green-100 text-green-800"
                  : result.imported_rows === 0
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {successRate}% successful
            </span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total rows</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {result.total_rows}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-green-700">Imported</p>
                <p className="mt-1 text-3xl font-bold text-green-800">
                  {result.imported_rows}
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">Failed</p>
                <p className="mt-1 text-3xl font-bold text-red-800">
                  {result.failed_rows}
                </p>
              </div>
            </div>

            <div
              className="mt-5 h-2 w-full overflow-hidden rounded-full bg-red-100"
              role="progressbar"
              aria-valuenow={successRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Import success rate"
            >
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${successRate}%` }}
              />
            </div>

            {result.errors.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Rows that need attention ({result.errors.length})
                  </h4>
                  <button
                    type="button"
                    onClick={downloadErrors}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Icon path={ICONS.download} className="h-3.5 w-3.5" />
                    Export errors
                  </button>
                </div>

                <div className="mt-3 max-h-96 overflow-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="w-20 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Row
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Reference
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {result.errors.map((item, index) => (
                        <tr key={`${item.row}-${index}`} className="align-top">
                          <td className="px-4 py-3 font-mono text-gray-700">
                            {item.row}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.reference_number || "—"}
                          </td>
                          <td className="px-4 py-3 text-red-700">
                            {item.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Row numbers match the line in your file (the header is row 1).
                  Fix these rows and import the file again; rows that already
                  imported will be rejected as duplicates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
          <Icon path={ICONS.info} className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            File format guide
          </h3>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Column
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Requirement
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {REQUIRED_COLUMNS.map((column) => (
                  <tr key={column.name}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono font-medium text-gray-900">
                      {column.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {column.description}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-gray-700">
                      {column.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-900">Sample</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
            {SAMPLE_CSV}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ImportTransactions;
