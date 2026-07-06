CREATE OR REPLACE VIEW view_account_summary AS
SELECT
    a.id AS account_id,
    a.account_number,
    i.full_name AS investor_name,
    i.email,
    a.account_type,
    a.balance,
    a.status,
    a.created_at
FROM accounts a
JOIN investors i ON a.investor_id = i.id;

CREATE OR REPLACE VIEW view_transaction_summary AS
SELECT
    t.id AS transaction_id,
    t.reference_number,
    i.full_name AS investor_name,
    a.account_number,
    t.transaction_type,
    t.amount,
    t.status,
    t.transaction_date
FROM transactions t
JOIN accounts a ON t.account_id = a.id
JOIN investors i ON a.investor_id = i.id;

CREATE OR REPLACE VIEW view_deposit_withdrawal_summary AS
SELECT
    a.id AS account_id,
    a.account_number,
    i.full_name AS investor_name,
    SUM(CASE WHEN t.transaction_type = 'DEPOSIT' THEN t.amount ELSE 0 END) AS total_deposits,
    SUM(CASE WHEN t.transaction_type = 'WITHDRAWAL' THEN t.amount ELSE 0 END) AS total_withdrawals,
    COUNT(t.id) AS total_transactions
FROM accounts a
JOIN investors i ON a.investor_id = i.id
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.account_number, i.full_name;

CREATE OR REPLACE VIEW view_portfolio_summary AS
SELECT
    ph.id AS holding_id,
    i.full_name AS investor_name,
    a.account_number,
    s.symbol,
    s.company_name,
    ph.quantity,
    ph.average_price,
    s.current_price,
    ph.quantity * ph.average_price AS invested_value,
    ph.quantity * s.current_price AS current_value,
    (ph.quantity * s.current_price) - (ph.quantity * ph.average_price) AS gain_loss
FROM portfolio_holdings ph
JOIN accounts a ON ph.account_id = a.id
JOIN investors i ON a.investor_id = i.id
JOIN stocks s ON ph.stock_id = s.id;

CREATE OR REPLACE VIEW view_order_summary AS
SELECT
    o.id AS order_id,
    i.full_name AS investor_name,
    a.account_number,
    s.symbol,
    s.company_name,
    o.order_type,
    o.quantity,
    o.price,
    o.quantity * o.price AS order_value,
    o.status,
    o.order_date
FROM orders o
JOIN accounts a ON o.account_id = a.id
JOIN investors i ON a.investor_id = i.id
JOIN stocks s ON o.stock_id = s.id;