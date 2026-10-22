import csv
import io
import logging

from django.db import IntegrityError
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Account, Stock
from ..services import (
    ORDER_STATUSES,
    ORDER_TYPES,
    TRANSACTION_STATUSES,
    TRANSACTION_TYPES,
    OrderService,
    TransactionService,
)
from .utils import extract_error_message, parse_amount

logger = logging.getLogger(__name__)

MAX_CSV_SIZE = 5 * 1024 * 1024

CSV_REQUIRED_COLUMNS = [
    'account_id',
    'transaction_type',
    'amount',
    'reference_number',
    'status',
]


def server_error_response():
    return Response(
        {"error": "An unexpected error occurred. Please try again."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


class CreateTransactionAPIView(APIView):
    """Create a deposit or withdrawal and update the account balance atomically."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        tags=['Actions'],
        request=inline_serializer('CreateTransactionRequest', {
            'account_id': serializers.IntegerField(),
            'transaction_type': serializers.ChoiceField(choices=TRANSACTION_TYPES),
            'amount': serializers.DecimalField(max_digits=15, decimal_places=2),
            'reference_number': serializers.CharField(),
            'status': serializers.ChoiceField(choices=TRANSACTION_STATUSES, required=False),
        }),
        responses={201: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        account_id = request.data.get('account_id')
        transaction_type = request.data.get('transaction_type')
        amount = request.data.get('amount')
        reference_number = request.data.get('reference_number')
        transaction_status = request.data.get('status') or 'COMPLETED'

        if not account_id or not transaction_type or not amount or not reference_number:
            return Response(
                {"error": "Please select an account and provide a transaction type, amount, and reference number."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            account = Account.objects.get(id=account_id)
            amount = parse_amount(amount)

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
                    "new_balance": transaction_record.account.balance,
                },
                status=status.HTTP_201_CREATED
            )

        except (Account.DoesNotExist, ValueError):
            return Response(
                {"error": f"No account found with ID {account_id}."},
                status=status.HTTP_404_NOT_FOUND
            )

        except ValidationError as error:
            return Response(
                {"error": extract_error_message(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except IntegrityError:
            return Response(
                {"error": f"A transaction with reference number '{reference_number}' already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            logger.exception("Unexpected error while creating a transaction")
            return server_error_response()


class CreateOrderAPIView(APIView):
    """Create a buy or sell order and update the balance and portfolio atomically."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        tags=['Actions'],
        request=inline_serializer('CreateOrderRequest', {
            'account_id': serializers.IntegerField(),
            'stock_id': serializers.IntegerField(),
            'order_type': serializers.ChoiceField(choices=ORDER_TYPES),
            'quantity': serializers.IntegerField(min_value=1),
            'price': serializers.DecimalField(max_digits=15, decimal_places=2),
            'status': serializers.ChoiceField(choices=ORDER_STATUSES, required=False),
        }),
        responses={201: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        account_id = request.data.get('account_id')
        stock_id = request.data.get('stock_id')
        order_type = request.data.get('order_type')
        quantity = request.data.get('quantity')
        price = request.data.get('price')
        order_status = request.data.get('status') or 'COMPLETED'

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

            try:
                quantity = int(quantity)
            except (TypeError, ValueError):
                raise ValidationError(f"'{quantity}' is not a valid quantity.")

            price = parse_amount(price)

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
                    "new_balance": order_record.account.balance,
                },
                status=status.HTTP_201_CREATED
            )

        except Stock.DoesNotExist:
            return Response(
                {"error": "Stock not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except (Account.DoesNotExist, ValueError):
            return Response(
                {"error": "Account not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except ValidationError as error:
            return Response(
                {"error": extract_error_message(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            logger.exception("Unexpected error while creating an order")
            return server_error_response()


class ImportTransactionsCSVAPIView(APIView):
    """Bulk-import transactions from a CSV file.

    Each row is validated and saved independently: a bad row is reported in the
    response and skipped, it never blocks the valid rows around it.
    """

    name = "Import Transactions CSV"
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        tags=['Actions'],
        request={
            'multipart/form-data': inline_serializer('ImportTransactionsRequest', {
                'file': serializers.FileField(),
            })
        },
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        csv_file = request.FILES.get('file')

        if not csv_file:
            return Response(
                {"error": "CSV file is required. Upload using field name 'file'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not csv_file.name.lower().endswith('.csv'):
            return Response(
                {"error": "Only CSV files are allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if csv_file.size > MAX_CSV_SIZE:
            return Response(
                {"error": f"File is too large. The maximum size is {MAX_CSV_SIZE // (1024 * 1024)} MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # utf-8-sig also accepts files saved by Excel with a byte-order mark.
            text = csv_file.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            return Response(
                {"error": "The file could not be read. Save it as a UTF-8 encoded CSV."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reader = csv.DictReader(io.StringIO(text))
        fieldnames = [name.strip() for name in (reader.fieldnames or [])]
        reader.fieldnames = fieldnames

        if not fieldnames:
            return Response(
                {"error": "The file is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        missing_columns = [column for column in CSV_REQUIRED_COLUMNS if column not in fieldnames]

        if missing_columns:
            return Response(
                {
                    "error": f"Invalid CSV format. Missing column(s): {', '.join(missing_columns)}.",
                    "required_columns": CSV_REQUIRED_COLUMNS,
                    "missing_columns": missing_columns,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        total_rows = 0
        imported_rows = 0
        failed_rows = []

        for row_number, row in enumerate(reader, start=2):
            # Skip fully blank lines instead of reporting them as errors.
            if not any((value or '').strip() for value in row.values() if not isinstance(value, list)):
                continue

            total_rows += 1

            account_id = (row.get('account_id') or '').strip()
            transaction_type = (row.get('transaction_type') or '').strip().upper()
            amount_value = (row.get('amount') or '').strip()
            reference_number = (row.get('reference_number') or '').strip()
            transaction_status = (row.get('status') or '').strip().upper() or 'COMPLETED'

            try:
                if not account_id or not transaction_type or not amount_value or not reference_number:
                    raise ValidationError("Row is missing account_id, transaction_type, amount, or reference_number.")

                amount = parse_amount(amount_value)

                try:
                    account = Account.objects.get(id=account_id)
                except (Account.DoesNotExist, ValueError):
                    raise ValidationError(f"No account found with ID {account_id}.")

                TransactionService.create_transaction(
                    account=account,
                    transaction_type=transaction_type,
                    amount=amount,
                    reference_number=reference_number,
                    status=transaction_status
                )

                imported_rows += 1

            except ValidationError as error:
                failed_rows.append({
                    "row": row_number,
                    "reference_number": reference_number,
                    "error": extract_error_message(error)
                })

            except IntegrityError:
                failed_rows.append({
                    "row": row_number,
                    "reference_number": reference_number,
                    "error": f"A transaction with reference number '{reference_number}' already exists."
                })

            except Exception:
                logger.exception("Unexpected error importing CSV row %s", row_number)
                failed_rows.append({
                    "row": row_number,
                    "reference_number": reference_number,
                    "error": "Unexpected error while saving this row."
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
