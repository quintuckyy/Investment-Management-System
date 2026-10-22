import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Investors from "./pages/Investors";
import Accounts from "./pages/Accounts";
import Stocks from "./pages/Stocks";
import Transactions from "./pages/Transactions";
import Orders from "./pages/Orders";
import Portfolio from "./pages/Portfolio";
import Reports from "./pages/Reports";
import DataValidation from "./pages/DataValidation";
import AuditLogs from "./pages/AuditLogs";
import ImportTransactions from "./pages/ImportTransactions";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/validation" element={<DataValidation />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/import" element={<ImportTransactions />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
