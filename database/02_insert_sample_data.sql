INSERT INTO investors (full_name, email, phone_number)
VALUES
('Juan Dela Cruz', 'juan.delacruz@example.com', '09171234567'),
('Maria Santos', 'maria.santos@example.com', '09181234567'),
('Pedro Reyes', 'pedro.reyes@example.com', '09191234567'),
('Ana Garcia', 'ana.garcia@example.com', '09201234567'),
('Carlo Mendoza', 'carlo.mendoza@example.com', '09211234567');

-- Balances equal the account's completed deposits - withdrawals - buys + sells below,
-- so the balance reconciliation check in 06_data_validation.sql returns no rows.
INSERT INTO accounts (investor_id, account_number, account_type, balance, status)
VALUES
(1, 'ACC-1001', 'INDIVIDUAL', 23900.00, 'ACTIVE'),
(2, 'ACC-1002', 'INDIVIDUAL', 52750.00, 'ACTIVE'),
(3, 'ACC-1003', 'INDIVIDUAL', 30000.00, 'ACTIVE'),
(4, 'ACC-1004', 'INDIVIDUAL', 86800.00, 'ACTIVE'),
(5, 'ACC-1005', 'INDIVIDUAL', 25000.00, 'ACTIVE');

INSERT INTO stocks (symbol, company_name, current_price)
VALUES
('BDO', 'BDO Unibank Inc.', 145.50),
('ALI', 'Ayala Land Inc.', 32.75),
('JFC', 'Jollibee Foods Corporation', 245.00),
('AC', 'Ayala Corporation', 680.00),
('TEL', 'PLDT Inc.', 1320.00),
('SM', 'SM Investments Corporation', 890.00);

INSERT INTO transactions (account_id, transaction_type, amount, reference_number, status)
VALUES
(1, 'DEPOSIT', 50000.00, 'TXN-0001', 'COMPLETED'),
(2, 'DEPOSIT', 75000.00, 'TXN-0002', 'COMPLETED'),
(3, 'DEPOSIT', 30000.00, 'TXN-0003', 'COMPLETED'),
(4, 'DEPOSIT', 100000.00, 'TXN-0004', 'COMPLETED'),
(5, 'DEPOSIT', 25000.00, 'TXN-0005', 'COMPLETED'),
(1, 'WITHDRAWAL', 5000.00, 'TXN-0006', 'COMPLETED'),
(2, 'WITHDRAWAL', 10000.00, 'TXN-0007', 'COMPLETED'),
(3, 'DEPOSIT', 15000.00, 'TXN-0008', 'PENDING'),
(4, 'WITHDRAWAL', 8000.00, 'TXN-0009', 'FAILED');

INSERT INTO orders (account_id, stock_id, order_type, quantity, price, status)
VALUES
(1, 1, 'BUY', 100, 145.50, 'COMPLETED'),
(1, 2, 'BUY', 200, 32.75, 'COMPLETED'),
(2, 3, 'BUY', 50, 245.00, 'COMPLETED'),
(3, 4, 'BUY', 20, 680.00, 'PENDING'),
(4, 5, 'BUY', 10, 1320.00, 'COMPLETED'),
(5, 6, 'BUY', 15, 890.00, 'FAILED');

INSERT INTO portfolio_holdings (account_id, stock_id, quantity, average_price)
VALUES
(1, 1, 100, 145.50),
(1, 2, 200, 32.75),
(2, 3, 50, 245.00),
(4, 5, 10, 1320.00);

INSERT INTO audit_logs (table_name, action, record_id, description)
VALUES
('investors', 'INSERT', 1, 'Created investor record for Juan Dela Cruz'),
('accounts', 'INSERT', 1, 'Created investment account ACC-1001'),
('transactions', 'INSERT', 1, 'Initial deposit transaction created'),
('orders', 'INSERT', 1, 'Buy order created for BDO shares');