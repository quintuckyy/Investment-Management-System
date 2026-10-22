import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded px-3 py-2 text-sm font-medium ${
    isActive
      ? "bg-slate-700 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

function AppLayout() {
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 flex h-full w-64 flex-col bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-xl font-bold">Investment DB</h1>
          <p className="text-sm text-slate-400">Management System</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
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

        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-slate-400">
                {isStaff ? "Staff · can edit" : "Viewer · read only"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
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