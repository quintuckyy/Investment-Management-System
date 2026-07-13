import { NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded px-3 py-2 text-sm font-medium ${
    isActive
      ? "bg-slate-700 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-xl font-bold">Investment DB</h1>
          <p className="text-sm text-slate-400">Database System</p>
        </div>

        <nav className="space-y-1 px-4 py-4">
          <NavLink className={navLinkClass} to="/">
            Dashboard
          </NavLink>

          <NavLink className={navLinkClass} to="/investors">
            Investors
          </NavLink>

          <NavLink className={navLinkClass} to="/accounts">
            Accounts
          </NavLink>

          <NavLink className={navLinkClass} to="/stocks">
            Stocks
          </NavLink>

          <NavLink className={navLinkClass} to="/transactions">
            Transactions
          </NavLink>

          <NavLink className={navLinkClass} to="/orders">
            Orders
          </NavLink>

          <NavLink className={navLinkClass} to="/portfolio">
            Portfolio
          </NavLink>

          <NavLink className={navLinkClass} to="/reports">
            Reports
          </NavLink>

          <NavLink className={navLinkClass} to="/validation">
            Data Validation
          </NavLink>

          <NavLink className={navLinkClass} to="/audit-logs">
            Audit Logs
          </NavLink>

          <NavLink className={navLinkClass} to="/import">
            CSV Import
          </NavLink>
        </nav>
      </aside>

      <main className="ml-64 min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;