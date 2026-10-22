from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .utils import run_query

# Data-health checks: each endpoint returns the rows that break a rule,
# so an empty list means the data is healthy.
CHECK_SCHEMA = extend_schema(
    tags=['Data validation'],
    responses={200: {'type': 'array', 'items': {'type': 'object'}}},
)


@CHECK_SCHEMA
@api_view(['GET'])
def duplicate_transactions_check(request):
    data = run_query("""
            SELECT
                reference_number,
                COUNT(*) AS duplicate_count
            FROM transactions
            GROUP BY reference_number
            HAVING COUNT(*) > 1;
    """)

    return Response(data)


@CHECK_SCHEMA
@api_view(['GET'])
def negative_balances_check(request):
    data = run_query("""
            SELECT
                id,
                account_number,
                balance,
                status
            FROM accounts
            WHERE balance < 0;
    """)

    return Response(data)


@CHECK_SCHEMA
@api_view(['GET'])
def transaction_status_check(request):
    data = run_query("""
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
    """)

    return Response(data)


@CHECK_SCHEMA
@api_view(['GET'])
def order_status_check(request):
    data = run_query("""
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
    """)

    return Response(data)


@CHECK_SCHEMA
@api_view(['GET'])
def accounts_without_transactions_check(request):
    data = run_query("""
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
    """)

    return Response(data)


@CHECK_SCHEMA
@api_view(['GET'])
def investors_without_accounts_check(request):
    data = run_query("""
            SELECT
                i.id,
                i.full_name,
                i.email,
                i.created_at
            FROM investors i
            LEFT JOIN accounts a ON i.id = a.investor_id
            WHERE a.id IS NULL;
    """)

    return Response(data)

@CHECK_SCHEMA
@api_view(['GET'])
def balance_reconciliation_check(request):
    # An account's balance must equal its completed deposits minus withdrawals,
    # minus completed buy orders plus completed sell orders.
    data = run_query("""
        SELECT
            a.id,
            a.account_number,
            a.balance AS recorded_balance,
            COALESCE(tx.net_amount, 0) + COALESCE(ord.net_amount, 0) AS expected_balance,
            a.balance - (COALESCE(tx.net_amount, 0) + COALESCE(ord.net_amount, 0)) AS difference
        FROM accounts a
        LEFT JOIN (
            SELECT
                account_id,
                SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN amount ELSE -amount END) AS net_amount
            FROM transactions
            WHERE status = 'COMPLETED'
            GROUP BY account_id
        ) tx ON tx.account_id = a.id
        LEFT JOIN (
            SELECT
                account_id,
                SUM(CASE WHEN order_type = 'SELL' THEN quantity * price ELSE -(quantity * price) END) AS net_amount
            FROM orders
            WHERE status = 'COMPLETED'
            GROUP BY account_id
        ) ord ON ord.account_id = a.id
        WHERE a.balance <> COALESCE(tx.net_amount, 0) + COALESCE(ord.net_amount, 0)
        ORDER BY a.account_number;
    """)

    return Response(data)
