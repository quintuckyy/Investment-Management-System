import { useEffect, useState } from "react";
import apiClient from "../api/client";
import type { Account } from "../types/investment";

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const response = await apiClient.get("/accounts/");
        setAccounts(response.data);
      } catch (error) {
        console.error("Failed to load accounts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading accounts...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Accounts</h2>
        <p className="mt-2 text-gray-600">
          Investment accounts with balances and account status.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Investor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Account Number</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Balance</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created At</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{account.id}</td>
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
                  ₱{Number(account.balance).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(account.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Accounts;