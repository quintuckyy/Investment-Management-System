import csv
from decimal import Decimal, InvalidOperation

from django.db import connection
from django.db import models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import status
from .services import TransactionService, OrderService
from rest_framework.parsers import MultiPartParser, FormParser

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

# Data health check endpoints

@api_view(['GET'])
def duplicate_transactions_check(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                reference_number,
                COUNT(*) AS duplicate_count
            FROM transactions
            GROUP BY reference_number
            HAVING COUNT(*) > 1;
        """)
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def negative_balances_check(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                id,
                account_number,
                balance,
                status
            FROM accounts
            WHERE balance < 0;
        """)
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def transaction_status_check(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def order_status_check(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def accounts_without_transactions_check(request):
    with connection.cursor() as cursor:
        cursor.execute("""
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
        data = dict_fetch_all(cursor)

    return Response(data)


@api_view(['GET'])
def investors_without_accounts_check(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                i.id,
                i.full_name,
                i.email,
                i.created_at
            FROM investors i
            LEFT JOIN accounts a ON i.id = a.investor_id
            WHERE a.id IS NULL;
        """)
        data = dict_fetch_all(cursor)

    return Response(data)

class CreateTransactionAPIView(APIView):
    def post(self, request):
        account_id = request.data.get('account_id')
        transaction_type = request.data.get('transaction_type')
        amount = request.data.get('amount')
        reference_number = request.data.get('reference_number')
        transaction_status = request.data.get('status', 'COMPLETED')

        if not account_id or not transaction_type or not amount or not reference_number:
            return Response(
                {"error": "account_id, transaction_type, amount, and reference_number are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            account = Account.objects.get(id=account_id)
            amount = Decimal(str(amount))  # Ensure amount is a Decimal

            transaction_record = TransactionService.create_transaction(
                account=account,
                transaction_type=transaction_type,
                amount=amount,
                reference_number=reference_number,
                status=transaction_status
            )

            return Response(
                {
                    "message": "Transaction created successfully.",
                    "transaction_id": transaction_record.id,
                    "reference_number": transaction_record.reference_number,
                    "account_number": account.account_number,
                    "new_balance": account.balance,
                },
                status=status.HTTP_201_CREATED
            )

        except Account.DoesNotExist:
            return Response(
                {"error": "Account not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

class CreateOrderAPIView(APIView):
    def post(self, request):
        account_id = request.data.get('account_id')
        stock_id = request.data.get('stock_id')
        order_type = request.data.get('order_type')
        quantity = request.data.get('quantity')
        price = request.data.get('price')
        order_status = request.data.get('status', 'COMPLETED')

        if not account_id or not stock_id or not order_type or not quantity or not price:
            return Response(
                {
                    "error": "account_id, stock_id, order_type, quantity, and price are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            account = Account.objects.get(id=account_id)
            stock = Stock.objects.get(id=stock_id)

            quantity = int(quantity)
            price = Decimal(str(price))

            order_record = OrderService.create_order(
                account=account,
                stock=stock,
                order_type=order_type,
                quantity=quantity,
                price=price,
                status=order_status
            )

            return Response(
                {
                    "message": "Order created successfully.",
                    "order_id": order_record.id,
                    "account_number": account.account_number,
                    "stock_symbol": stock.symbol,
                    "order_type": order_record.order_type,
                    "quantity": order_record.quantity,
                    "price": order_record.price,
                    "new_balance": account.balance,
                },
                status=status.HTTP_201_CREATED
            )

        except Account.DoesNotExist:
            return Response(
                {"error": "Account not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Stock.DoesNotExist:
            return Response(
                {"error": "Stock not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ImportTransactionsCSVAPIView(APIView):
    name ="Import Transactions CSV"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        csv_file = request.FILES.get('file')

        if not csv_file:
            return Response(
                {"error": "CSV file is required. Upload using field name 'file'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not csv_file.name.endswith('.csv'):
            return Response(
                {"error": "Only CSV files are allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        decoded_file = csv_file.read().decode('utf-8').splitlines()
        reader = csv.DictReader(decoded_file)

        required_columns = {
            'account_id',
            'transaction_type',
            'amount',
            'reference_number',
            'status'
        }

        if not required_columns.issubset(reader.fieldnames):
            return Response(
                {
                    "error": "Invalid CSV format.",
                    "required_columns": list(required_columns)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        total_rows = 0
        imported_rows = 0
        failed_rows = []

        for row_number, row in enumerate(reader, start=2):
            total_rows += 1

            account_id = row.get('account_id')
            transaction_type = row.get('transaction_type')
            amount_value = row.get('amount')
            reference_number = row.get('reference_number')
            transaction_status = row.get('status', 'COMPLETED')

            try:
                if not account_id or not transaction_type or not amount_value or not reference_number:
                    raise ValueError("Missing required field.")

                if transaction_type not in ['DEPOSIT', 'WITHDRAWAL']:
                    raise ValueError("Invalid transaction type.")

                if transaction_status not in ['COMPLETED', 'PENDING', 'FAILED']:
                    raise ValueError("Invalid transaction status.")

                amount = Decimal(str(amount_value))

                if amount <= 0:
                    raise ValueError("Amount must be greater than 0.")

                account = Account.objects.get(id=account_id)

                TransactionService.create_transaction(
                    account=account,
                    transaction_type=transaction_type,
                    amount=amount,
                    reference_number=reference_number,
                    status=transaction_status
                )

                imported_rows += 1

            except Account.DoesNotExist:
                failed_rows.append({
                    "row": row_number,
                    "reference_number": reference_number,
                    "error": "Account not found."
                })

            except InvalidOperation:
                failed_rows.append({
                    "row": row_number,
                    "reference_number": reference_number,
                    "error": "Invalid amount format."
                })

            except Exception as error:
                failed_rows.append({
                    "row": row_number,
                    "reference_number": reference_number,
                    "error": str(error)
                })

        return Response(
            {
                "message": "CSV import completed.",
                "total_rows": total_rows,
                "imported_rows": imported_rows,
                "failed_rows": len(failed_rows),
                "errors": failed_rows
            },
            status=status.HTTP_200_OK
        )