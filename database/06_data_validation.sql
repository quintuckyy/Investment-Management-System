-- 1. Check duplicate transaction reference numbers
SELECT
    reference_number,
    COUNT(*) AS duplicate_count
FROM transactions
GROUP BY reference_number
HAVING COUNT(*) > 1;

-- 2. Check accounts with negative balance
SELECT
    id,
    account_number,
    balance,
    status
FROM accounts
WHERE balance < 0;

-- 3. Check transactions with missing accounts
SELECT
    t.id,
    t.reference_number,
    t.account_id,
    t.transaction_type,
    t.amount,
    t.status
FROM transactions t
LEFT JOIN accounts a ON t.account_id = a.id
WHERE a.id IS NULL;

-- 4. Check orders with missing accounts
SELECT
    o.id,
    o.account_id,
    o.stock_id,
    o.order_type,
    o.quantity,
    o.price,
    o.status
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE a.id IS NULL;

-- 5. Check orders with missing stocks
SELECT
    o.id,
    o.account_id,
    o.stock_id,
    o.order_type,
    o.quantity,
    o.price,
    o.status
FROM orders o
LEFT JOIN stocks s ON o.stock_id = s.id
WHERE s.id IS NULL;

-- 6. Check pending or failed transactions
SELECT
    reference_number,
    account_id,
    transaction_type,
    amount,
    status,
    transaction_date
FROM transactions
WHERE status IN ('PENDING', 'FAILED')
ORDER BY transaction_date DESC;

-- 7. Check pending, failed, or cancelled orders
SELECT
    id,
    account_id,
    stock_id,
    order_type,
    quantity,
    price,
    status,
    order_date
FROM orders
WHERE status IN ('PENDING', 'FAILED', 'CANCELLED')
ORDER BY order_date DESC;

-- 8. Check accounts with no transactions
SELECT
    a.id,
    a.account_number,
    i.full_name AS investor_name,
    a.balance,
    a.status
FROM accounts a
JOIN investors i ON a.investor_id = i.id
LEFT JOIN transactions t ON a.id = t.account_id
WHERE t.id IS NULL;

-- 9. Check investors with no accounts
SELECT
    i.id,
    i.full_name,
    i.email,
    i.created_at
FROM investors i
LEFT JOIN accounts a ON i.id = a.investor_id
WHERE a.id IS NULL;

-- 10. Check portfolio holdings with zero quantity
SELECT
    ph.id,
    a.account_number,
    s.symbol,
    ph.quantity,
    ph.average_price
FROM portfolio_holdings ph
JOIN accounts a ON ph.account_id = a.id
JOIN stocks s ON ph.stock_id = s.id
WHERE ph.quantity = 0;