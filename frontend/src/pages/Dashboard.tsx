import { useEffect, useState } from "react";
import apiClient from "../api/client";
import StatCard from "../components/StatCard";

type DashboardCounts = {
  investors: number;
  accounts: number;
  stocks: number;
  transactions: number;
  orders: number;
  portfolioHoldings: number;
};

function Dashboard() {
  const [counts, setCounts] = useState<DashboardCounts>({
    investors: 0,
    accounts: 0,
    stocks: 0,
    transactions: 0,
    orders: 0,
    portfolioHoldings: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [
          investorsRes,
          accountsRes,
          stocksRes,
          transactionsRes,
          ordersRes,
          portfolioRes,
        ] = await Promise.all([
          apiClient.get("/investors/"),
          apiClient.get("/accounts/"),
          apiClient.get("/stocks/"),
          apiClient.get("/transactions/"),
          apiClient.get("/orders/"),
          apiClient.get("/portfolio-holdings/"),
        ]);

        setCounts({
          investors: investorsRes.data.length,
          accounts: accountsRes.data.length,
          stocks: stocksRes.data.length,
          transactions: transactionsRes.data.length,
          orders: ordersRes.data.length,
          portfolioHoldings: portfolioRes.data.length,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading dashboard...</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Overview of investors, accounts, transactions, orders, and portfolio records.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Investors"
          value={counts.investors}
          description="Registered investors"
        />
        <StatCard
          title="Total Accounts"
          value={counts.accounts}
          description="Investment accounts"
        />
        <StatCard
          title="Total Stocks"
          value={counts.stocks}
          description="Available stocks"
        />
        <StatCard
          title="Total Transactions"
          value={counts.transactions}
          description="Deposits and withdrawals"
        />
        <StatCard
          title="Total Orders"
          value={counts.orders}
          description="Buy and sell orders"
        />
        <StatCard
          title="Portfolio Holdings"
          value={counts.portfolioHoldings}
          description="Current stock holdings"
        />
      </div>
    </div>
  );
}

export default Dashboard;