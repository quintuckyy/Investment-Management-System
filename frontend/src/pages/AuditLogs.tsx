import { useEffect, useState } from "react";
import apiClient from "../api/client";
import type { AuditLog } from "../types/investment";

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const response = await apiClient.get("/audit-logs/");
        setLogs(response.data);
      } catch (error) {
        console.error("Failed to load audit logs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading audit logs...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
        <p className="mt-2 text-gray-600">
          Track transaction, order, import, and database-related activity.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Table
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Action
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Record ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Description
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Created At
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {log.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {log.table_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {log.record_id || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {log.description || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;