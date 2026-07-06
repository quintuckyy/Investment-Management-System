-- Account Balance Report
SELECT
    investor_name,
    account_number,
    account_type,
    balance,
    status,
    created_at
FROM view_account_summary
ORDER BY investor_name;

-- Transaction Summary Report
SELECT
    reference_number,
    investor_name,
    account_number,
    transaction_type,
    amount,
    status,
    transaction_date
FROM view_transaction_summary
ORDER BY transaction_date DESC;

-- Total Deposits and Withdrawals Per Account
SELECT
    investor_name,
    account_number,
    total_deposits,
    total_withdrawals,
    total_transactions
FROM view_deposit_withdrawal_summary
ORDER BY investor_name;

-- Portfolio Value Report
SELECT
    investor_name,
    account_number,
    symbol,
    company_name,
    quantity,
    average_price,
    current_price,
    invested_value,
    current_value,
    gain_loss
FROM view_portfolio_summary
ORDER BY investor_name, symbol;

-- Pending Orders Report
SELECT
    investor_name,
    account_number,
    symbol,
    order_type,
    quantity,
    price,
    order_value,
    status,
    order_date
FROM view_order_summary
WHERE status = 'PENDING'
ORDER BY order_date DESC;

-- Failed Transactions Report
SELECT
    reference_number,
    investor_name,
    account_number,
    transaction_type,
    amount,
    status,
    transaction_date
FROM view_transaction_summary
WHERE status = 'FAILED'
ORDER BY transaction_date DESC;

-- Completed Orders Report
SELECT
    investor_name,
    account_number,
    symbol,
    company_name,
    order_type,
    quantity,
    price,
    order_value,
    status,
    order_date
FROM view_order_summary
WHERE status = 'COMPLETED'
ORDER BY order_date DESC;

-- Total Portfolio Value Per Investor
SELECT
    investor_name,
    account_number,
    SUM(current_value) AS total_portfolio_value,
    SUM(invested_value) AS total_invested_value,
    SUM(gain_loss) AS total_gain_loss
FROM view_portfolio_summary
GROUP BY investor_name, account_number
ORDER BY total_portfolio_value DESC;