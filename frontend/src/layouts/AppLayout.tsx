import { Link, Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-xl font-bold">Investment DB</h1>
          <p className="text-sm text-slate-400">Database System</p>
        </div>

        <nav className="space-y-1 px-4 py-4">
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/">
            Dashboard
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/investors">
            Investors
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/accounts">
            Accounts
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/transactions">
            Transactions
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/orders">
            Orders
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/portfolio">
            Portfolio
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/reports">
            Reports
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/validation">
            Data Validation
          </Link>
          <Link className="block rounded px-3 py-2 hover:bg-slate-800" to="/import">
            CSV Import
          </Link>
        </nav>
      </aside>

      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;