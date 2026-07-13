import { useEffect, useState } from "react";
import apiClient from "../api/client";
import type { Stock } from "../types/investment";

function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadStocks() {
    try {
      const response = await apiClient.get("/stocks/");
      setStocks(response.data);
    } catch (error) {
      console.error("Failed to load stocks:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStocks();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading stocks...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Stocks</h2>
        <p className="mt-2 text-gray-600">
          Available stocks that can be used for buy and sell orders.
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
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Company Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Created At
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {stocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {stock.id}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {stock.symbol}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {stock.company_name}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ₱{Number(stock.current_price).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(stock.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {stocks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No stocks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stocks;