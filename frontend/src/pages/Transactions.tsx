import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { parseApiError } from "../utils/errors";
import type { Account, Transaction } from "../types/investment";

function Transactions() {
  const { isStaff } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [formData, setFormData] = useState({
    account_id: "",
    transaction_type: "DEPOSIT",
    amount: "",
    reference_number: "",
    status: "COMPLETED",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [transactionsRes, accountsRes] = await Promise.all([
          apiClient.get("/transactions/"),
          apiClient.get("/accounts/"),
        ]);

        setTransactions(transactionsRes.data);
        setAccounts(accountsRes.data);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reloadKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    try {
      const response = await apiClient.post("/transactions/create/", {
        account_id: Number(formData.account_id),
        transaction_type: formData.transaction_type,
        amount: formData.amount,
        reference_number: formData.reference_number,
        status: formData.status,
      });

      const newBalance = Number(response.data.new_balance).toLocaleString(
        undefined,
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      );

      setMessage(
        `${formData.transaction_type === "WITHDRAWAL" ? "Withdrawal" : "Deposit"} of ${formData.reference_number} completed. New balance: ₱${newBalance}.`
      );
      setMessageType("success");

      setFormData({
        account_id: "",
        transaction_type: "DEPOSIT",
        amount: "",
        reference_number: "",
        status: "COMPLETED",
      });

      setReloadKey((key) => key + 1);
    } catch (error) {
      setMessage(
        parseApiError(error, "Failed to create transaction. Please try again.").message
      );
      setMessageType("error");
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading transactions...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Transactions</h2>
        <p className="mt-2 text-gray-600">
          Manage deposits and withdrawals for investment accounts.
        </p>
      </div>

      {isStaff ? (
      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Create Transaction
        </h3>

        {message && (
          <div
            className={`mt-4 rounded border p-3 text-sm ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account
            </label>
            <select
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={formData.account_id}
              onChange={(e) =>
                setFormData({ ...formData, account_id: e.target.value })
              }
              required
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.investor_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={formData.transaction_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transaction_type: e.target.value,
                })
              }
            >
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reference No.
            </label>
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              type="text"
              value={formData.reference_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reference_number: e.target.value,
                })
              }
              placeholder="TXN-1001"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create
            </button>
          </div>
        </div>
      </form>
      ) : (
        <p className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
          You have read-only access. Ask a staff user to create records.
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Ref No.
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Investor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Account
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {transaction.reference_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {transaction.investor_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {transaction.account_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {transaction.transaction_type}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ₱{Number(transaction.amount).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {transaction.status}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(transaction.transaction_date).toLocaleString()}
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transactions;