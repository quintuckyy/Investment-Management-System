from django.db import connection
from django.db import models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from .models import (
    Investor,
    Account,
    Stock,
    Transaction,
    Order,
    PortfolioHolding,
    AuditLog,
)
from .serializers import (
    InvestorSerializer,
    AccountSerializer,
    StockSerializer,
    TransactionSerializer,
    OrderSerializer,
    PortfolioHoldingSerializer,
    AuditLogSerializer,
)


class InvestorViewSet(viewsets.ModelViewSet):
    queryset = Investor.objects.all()
    serializer_class = InvestorSerializer


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.select_related('investor').all()
    serializer_class = AccountSerializer


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('account', 'account__investor').all()
    serializer_class = TransactionSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('account', 'account__investor', 'stock').all()
    serializer_class = OrderSerializer


class PortfolioHoldingViewSet(viewsets.ModelViewSet):
    queryset = PortfolioHolding.objects.select_related('account', 'account__investor', 'stock').all()
    serializer_class = PortfolioHoldingSerializer


class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer

def dict_fetch_all(cursor):
    columns = [col[0] for col in cursor.description]

    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]

@api_view(['GET'])
def account_summary_report(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def transaction_summary_report(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def deposit_withdrawal_summary_report(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                investor_name,
                account_number,
                total_deposits,
                total_withdrawals,
                total_transactions
            FROM view_deposit_withdrawal_summary
            ORDER BY investor_name;
        """)
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def portfolio_summary_report(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def pending_orders_report(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def failed_transactions_report(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)