CREATE INDEX idx_accounts_investor_id
ON accounts(investor_id);

CREATE INDEX idx_transactions_account_id
ON transactions(account_id);

CREATE INDEX idx_transactions_reference_number
ON transactions(reference_number);

CREATE INDEX idx_transactions_status
ON transactions(status);

CREATE INDEX idx_transactions_type
ON transactions(transaction_type);

CREATE INDEX idx_orders_account_id
ON orders(account_id);

CREATE INDEX idx_orders_stock_id
ON orders(stock_id);

CREATE INDEX idx_orders_status
ON orders(status);

CREATE INDEX idx_portfolio_holdings_account_id
ON portfolio_holdings(account_id);

CREATE INDEX idx_portfolio_holdings_stock_id
ON portfolio_holdings(stock_id);

CREATE INDEX idx_stocks_symbol
ON stocks(symbol);