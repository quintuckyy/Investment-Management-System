import { useEffect, useState } from "react";
import apiClient from "../api/client";

type AccountSummary = {
  investor_name: string;
  account_number: string;
  account_type: string;
  balance: string;
  status: string;
  created_at: string;
};

type PortfolioSummary = {
  investor_name: string;
  account_number: string;
  symbol: string;
  company_name: string;
  quantity: number;
  average_price: string;
  current_price: string;
  invested_value: string;
  current_value: string;
  gain_loss: string;
};

type TransactionStatus = {
  reference_number: string;
  investor_name: string;
  account_number: string;
  transaction_type: string;
  amount: string;
  status: string;
  transaction_date: string;
};

function Reports() {
  const [accountSummary, setAccountSummary] = useState<AccountSummary[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary[]>([]);
  const [failedTransactions, setFailedTransactions] = useState<TransactionStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [accountsRes, portfolioRes, failedTransactionsRes] =
          await Promise.all([
            apiClient.get("/reports/account-summary/"),
            apiClient.get("/reports/portfolio-summary/"),
            apiClient.get("/reports/failed-transactions/"),
          ]);

        setAccountSummary(accountsRes.data);
        setPortfolioSummary(portfolioRes.data);
        setFailedTransactions(failedTransactionsRes.data);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading reports...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
        <p className="mt-2 text-gray-600">
          SQL-based reports generated from PostgreSQL views.
        </p>
      </div>

      <section className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Account Summary Report
        </h3>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {accountSummary.map((item) => (
                <tr key={item.account_number} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.investor_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.account_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.account_type}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₱{Number(item.balance).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.status}
                  </td>
                </tr>
              ))}

              {accountSummary.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No account summary records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-xl font-semibold text-gray-900">
          Portfolio Summary Report
        </h3>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Invested Value
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Gain/Loss
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {portfolioSummary.map((item) => {
                const gainLoss = Number(item.gain_loss);

                return (
                  <tr
                    key={`${item.account_number}-${item.symbol}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.investor_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.account_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.symbol}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ₱{Number(item.invested_value).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₱{Number(item.current_value).toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-semibold ${
                        gainLoss >= 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      ₱{gainLoss.toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {portfolioSummary.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No portfolio summary records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-xl font-semibold text-gray-900">
          Failed Transactions Report
        </h3>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {failedTransactions.map((item) => (
                <tr key={item.reference_number} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.reference_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.investor_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.account_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.transaction_type}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₱{Number(item.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-700">
                    {item.status}
                  </td>
                </tr>
              ))}

              {failedTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No failed transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Reports;