import { useState } from "react";
import apiClient from "../api/client";

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

function ImportTransactions() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post(
        "/etl/import-transactions/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);
      setMessage("CSV import completed.");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to import CSV file.";

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">CSV Import</h2>
        <p className="mt-2 text-gray-600">
          Upload a CSV file to import transaction records into PostgreSQL.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Import Transactions
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Required columns: account_id, transaction_type, amount,
          reference_number, status
        </p>

        {message && (
          <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            CSV File
          </label>

          <input
            type="file"
            accept=".csv"
            className="mt-2 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] || null;
              setFile(selectedFile);
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            Import Summary
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {result.total_rows}
              </p>
            </div>

            <div className="rounded bg-green-50 p-4">
              <p className="text-sm text-green-700">Imported Rows</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {result.imported_rows}
              </p>
            </div>

            <div className="rounded bg-red-50 p-4">
              <p className="text-sm text-red-700">Failed Rows</p>
              <p className="mt-1 text-2xl font-bold text-red-800">
                {result.failed_rows}
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-semibold text-gray-900">
                Row Errors
              </h4>

              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Row
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Reference No.
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Error
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {result.errors.map((error, index) => (
                      <tr key={`${error.row}-${index}`}>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {error.row}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {error.reference_number || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-700">
                          {error.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Sample CSV Format
        </h3>

        <pre className="mt-4 overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-100">
{`account_id,transaction_type,amount,reference_number,status
1,DEPOSIT,5000.00,CSV-TXN-0001,COMPLETED
1,WITHDRAWAL,2000.00,CSV-TXN-0002,COMPLETED
2,DEPOSIT,10000.00,CSV-TXN-0003,COMPLETED`}
        </pre>
      </div>
    </div>
  );
}

export default ImportTransactions;