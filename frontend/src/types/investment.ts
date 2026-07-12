export interface Investor {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  created_at: string;
}

export interface Account {
  id: number;
  investor: number;
  investor_name: string;
  account_number: string;
  account_type: string;
  balance: string;
  status: string;
  created_at: string;
}

export interface Stock {
  id: number;
  symbol: string;
  company_name: string;
  current_price: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  account: number;
  account_number: string;
  investor_name: string;
  transaction_type: string;
  amount: string;
  reference_number: string;
  status: string;
  transaction_date: string;
}

export interface Order {
  id: number;
  account: number;
  stock: number;
  account_number: string;
  investor_name: string;
  stock_symbol: string;
  order_type: string;
  quantity: number;
  price: string;
  order_value: string;
  status: string;
  order_date: string;
}

export interface PortfolioHolding {
  id: number;
  account: number;
  stock: number;
  account_number: string;
  investor_name: string;
  stock_symbol: string;
  quantity: number;
  average_price: string;
  current_price: string;
  current_value: string;
  gain_loss: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  table_name: string;
  action: string;
  record_id?: number;
  description?: string;
  created_at: string; 
}