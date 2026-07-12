import { useEffect, useState } from "react";
import apiClient from "../api/client";

type ValidationResult = Record<string, any>;

function DataValidation() {
  const [duplicateTransactions, setDuplicateTransactions] = useState<ValidationResult[]>([]);
  const [negativeBalances, setNegativeBalances] = useState<ValidationResult[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<ValidationResult[]>([]);
  const [orderStatus, setOrderStatus] = useState<ValidationResult[]>([]);
  const [accountsWithoutTransactions, setAccountsWithoutTransactions] = useState<ValidationResult[]>([]);
  const [investorsWithoutAccounts, setInvestorsWithoutAccounts] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadValidationData() {
    try {
      const [
        duplicateTransactionsRes,
        negativeBalancesRes,
        transactionStatusRes,
        orderStatusRes,
        accountsWithoutTransactionsRes,
        investorsWithoutAccountsRes,
      ] = await Promise.all([
        apiClient.get("/validation/duplicate-transactions/"),
        apiClient.get("/validation/negative-balances/"),
        apiClient.get("/validation/transaction-status/"),
        apiClient.get("/validation/order-status/"),
        apiClient.get("/validation/accounts-without-transactions/"),
        apiClient.get("/validation/investors-without-accounts/"),
      ]);

      setDuplicateTransactions(duplicateTransactionsRes.data);
      setNegativeBalances(negativeBalancesRes.data);
      setTransactionStatus(transactionStatusRes.data);
      setOrderStatus(orderStatusRes.data);
      setAccountsWithoutTransactions(accountsWithoutTransactionsRes.data);
      setInvestorsWithoutAccounts(investorsWithoutAccountsRes.data);
    } catch (error) {
      console.error("Failed to load validation data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadValidationData();
  }, []);

  function renderResultTable(title: string, data: ValidationResult[]) {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              data.length > 0
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {data.length > 0 ? `${data.length} found` : "No issues"}
          </span>
        </div>

        {data.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No records found for this validation check.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="px-4 py-3 text-sm text-gray-700"
                      >
                        {String(row[column] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (loading) {
    return <p className="text-gray-600">Loading validation checks...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Data Validation</h2>
        <p className="mt-2 text-gray-600">
          Database quality checks for duplicate records, invalid balances, pending records, and missing relationships.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        {renderResultTable("Duplicate Transactions", duplicateTransactions)}
        {renderResultTable("Negative Account Balances", negativeBalances)}
        {renderResultTable("Pending / Failed Transactions", transactionStatus)}
        {renderResultTable("Pending / Failed / Cancelled Orders", orderStatus)}
        {renderResultTable("Accounts Without Transactions", accountsWithoutTransactions)}
        {renderResultTable("Investors Without Accounts", investorsWithoutAccounts)}
      </div>
    </div>
  );
}

export default DataValidation;