from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .utils import run_query

# Read-only reports backed by the SQL views created in migration 0003
# (defined in database/04_create_views.sql).
REPORT_SCHEMA = extend_schema(
    tags=['Reports'],
    responses={200: {'type': 'array', 'items': {'type': 'object'}}},
)


@REPORT_SCHEMA
@api_view(['GET'])
def account_summary_report(request):
    data = run_query("""
            SELECT
                investor_name,
                account_number,
                account_type,
                balance,
                status,
                created_at
            FROM view_account_summary
            ORDER BY investor_name;
    """)

    return Response(data)


@REPORT_SCHEMA
@api_view(['GET'])
def transaction_summary_report(request):
    data = run_query("""
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
    """)

    return Response(data)


@REPORT_SCHEMA
@api_view(['GET'])
def deposit_withdrawal_summary_report(request):
    data = run_query("""
            SELECT
                investor_name,
                account_number,
                total_deposits,
                total_withdrawals,
                total_transactions
            FROM view_deposit_withdrawal_summary
            ORDER BY investor_name;
    """)

    return Response(data)


@REPORT_SCHEMA
@api_view(['GET'])
def portfolio_summary_report(request):
    data = run_query("""
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
    """)

    return Response(data)


@REPORT_SCHEMA
@api_view(['GET'])
def pending_orders_report(request):
    data = run_query("""
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
    """)

    return Response(data)


@REPORT_SCHEMA
@api_view(['GET'])
def failed_transactions_report(request):
    data = run_query("""
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
    """)

    return Response(data)
