import { useEffect, useState } from "react";
import apiClient from "../api/client";
import type { Investor } from "../types/investment";

function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvestors() {
      try {
        const response = await apiClient.get("/investors/");
        setInvestors(response.data);
      } catch (error) {
        console.error("Failed to load investors:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInvestors();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading investors...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Investors</h2>
        <p className="mt-2 text-gray-600">
          List of registered investors in the system.
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
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Created At
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {investors.map((investor) => (
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
              </tr>
            ))}

            {investors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No investors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Investors;