import { useEffect, useState } from "react";
import apiClient from "../api/client";
import type { PortfolioHolding } from "../types/investment";

function Portfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPortfolio() {
    try {
      const response = await apiClient.get("/portfolio-holdings/");
      setHoldings(response.data);
    } catch (error) {
      console.error("Failed to load portfolio holdings:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading portfolio...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Portfolio</h2>
        <p className="mt-2 text-gray-600">
          Current stock holdings, market value, and gain/loss per account.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
                Avg Price
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Current Price
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
            {holdings.map((holding) => {
              const gainLoss = Number(holding.gain_loss);

              return (
                <tr key={holding.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {holding.investor_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {holding.account_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {holding.stock_symbol}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {holding.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ₱{Number(holding.average_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ₱{Number(holding.current_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₱{Number(holding.current_value).toLocaleString()}
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

            {holdings.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No portfolio holdings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Portfolio;