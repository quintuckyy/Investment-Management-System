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

type FinancialTotals = {
  totalBalance: number;
  totalPortfolioValue: number;
  totalGainLoss: number;
  failedTransactions: number;
  pendingOrders: number;
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

  const [totals, setTotals] = useState<FinancialTotals>({
    totalBalance: 0,
    totalPortfolioValue: 0,
    totalGainLoss: 0,
    failedTransactions: 0,
    pendingOrders: 0,
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
          accountSummaryRes,
          portfolioSummaryRes,
          failedTransactionsRes,
          pendingOrdersRes,
        ] = await Promise.all([
          apiClient.get("/investors/"),
          apiClient.get("/accounts/"),
          apiClient.get("/stocks/"),
          apiClient.get("/transactions/"),
          apiClient.get("/orders/"),
          apiClient.get("/portfolio-holdings/"),
          apiClient.get("/reports/account-summary/"),
          apiClient.get("/reports/portfolio-summary/"),
          apiClient.get("/reports/failed-transactions/"),
          apiClient.get("/reports/pending-orders/"),
        ]);

        const totalBalance = accountSummaryRes.data.reduce(
          (sum: number, item: any) => sum + Number(item.balance),
          0
        );

        const totalPortfolioValue = portfolioSummaryRes.data.reduce(
          (sum: number, item: any) => sum + Number(item.current_value),
          0
        );

        const totalGainLoss = portfolioSummaryRes.data.reduce(
          (sum: number, item: any) => sum + Number(item.gain_loss),
          0
        );

        setCounts({
          investors: investorsRes.data.length,
          accounts: accountsRes.data.length,
          stocks: stocksRes.data.length,
          transactions: transactionsRes.data.length,
          orders: ordersRes.data.length,
          portfolioHoldings: portfolioRes.data.length,
        });

        setTotals({
          totalBalance,
          totalPortfolioValue,
          totalGainLoss,
          failedTransactions: failedTransactionsRes.data.length,
          pendingOrders: pendingOrdersRes.data.length,
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
          Overview of investors, accounts, transactions, orders, portfolio value, and data status.
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

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Account Balance"
          value={`₱${totals.totalBalance.toLocaleString()}`}
          description="Cash balance across accounts"
        />
        <StatCard
          title="Total Portfolio Value"
          value={`₱${totals.totalPortfolioValue.toLocaleString()}`}
          description="Current market value"
        />
        <StatCard
          title="Total Gain/Loss"
          value={`₱${totals.totalGainLoss.toLocaleString()}`}
          description="Portfolio unrealized gain/loss"
        />
        <StatCard
          title="Failed Transactions"
          value={totals.failedTransactions}
          description="Transactions requiring review"
        />
        <StatCard
          title="Pending Orders"
          value={totals.pendingOrders}
          description="Orders not yet completed"
        />
      </div>
    </div>
  );
}

export default Dashboard;