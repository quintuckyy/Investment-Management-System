import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { parseApiError } from "../utils/errors";
import type { Account, Order, Stock } from "../types/investment";

function Orders() {
  const { isStaff } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    account_id: "",
    stock_id: "",
    order_type: "BUY",
    quantity: "",
    price: "",
    status: "COMPLETED",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, accountsRes, stocksRes] = await Promise.all([
          apiClient.get("/orders/"),
          apiClient.get("/accounts/"),
          apiClient.get("/stocks/"),
        ]);

        setOrders(ordersRes.data);
        setAccounts(accountsRes.data);
        setStocks(stocksRes.data);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reloadKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    try {
      await apiClient.post("/orders/create/", {
        account_id: Number(formData.account_id),
        stock_id: Number(formData.stock_id),
        order_type: formData.order_type,
        quantity: Number(formData.quantity),
        price: formData.price,
        status: formData.status,
      });

      setMessage("Order created successfully.");

      setFormData({
        account_id: "",
        stock_id: "",
        order_type: "BUY",
        quantity: "",
        price: "",
        status: "COMPLETED",
      });

      setReloadKey((key) => key + 1);
    } catch (error) {
      setMessage(parseApiError(error, "Failed to create order.").message);
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading orders...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
        <p className="mt-2 text-gray-600">
          Manage stock BUY and SELL orders for investment accounts.
        </p>
      </div>

      {isStaff ? (
      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Create Order
        </h3>

        {message && (
            <div
                className={`mt-4 rounded p-3 text-sm ${
                message.toLowerCase().includes("successfully")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
            >
                {message}
            </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
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
              Stock
            </label>
            <select
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={formData.stock_id}
              onChange={(e) =>
                setFormData({ ...formData, stock_id: e.target.value })
              }
              required
            >
              <option value="">Select stock</option>
              {stocks.map((stock) => (
                <option key={stock.id} value={stock.id}>
                  {stock.symbol} - ₱{Number(stock.current_price).toLocaleString()}
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
              value={formData.order_type}
              onChange={(e) =>
                setFormData({ ...formData, order_type: e.target.value })
              }
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
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
                Investor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Account
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Price
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Value
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
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {order.investor_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.account_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.stock_symbol}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.order_type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  ₱{Number(order.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ₱{Number(order.order_value).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.status}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(order.order_date).toLocaleString()}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;