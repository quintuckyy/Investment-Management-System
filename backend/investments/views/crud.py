from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter

from ..models import (
    Account,
    AuditLog,
    Investor,
    Order,
    PortfolioHolding,
    Stock,
    Transaction,
)
from ..permissions import IsStaffOrReadOnly
from ..serializers import (
    AccountSerializer,
    AuditLogSerializer,
    InvestorSerializer,
    OrderSerializer,
    PortfolioHoldingSerializer,
    StockSerializer,
    TransactionSerializer,
)


class QueryParamFilterMixin:
    """Exact-match filtering from query parameters.

    `filter_params` maps a query parameter name to an ORM lookup, for example
    {'status': 'status'} allows ?status=FAILED.
    """

    filter_params = {}

    def get_queryset(self):
        queryset = super().get_queryset()

        for param, lookup in self.filter_params.items():
            value = self.request.query_params.get(param)

            if value in (None, ''):
                continue

            try:
                queryset = queryset.filter(**{lookup: value})
            except (ValueError, TypeError, DjangoValidationError):
                raise ValidationError({param: f"'{value}' is not a valid value."})

        return queryset


class InvestorViewSet(viewsets.ModelViewSet):
    queryset = Investor.objects.all()
    serializer_class = InvestorSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone_number']
    ordering_fields = ['full_name', 'email', 'created_at']


class AccountViewSet(QueryParamFilterMixin, viewsets.ModelViewSet):
    queryset = Account.objects.select_related('investor').all()
    serializer_class = AccountSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    filter_params = {
        'investor_id': 'investor_id',
        'status': 'status',
        'account_type': 'account_type',
    }
    search_fields = ['account_number', 'investor__full_name']
    ordering_fields = ['account_number', 'balance', 'created_at']


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['symbol', 'company_name']
    ordering_fields = ['symbol', 'current_price', 'created_at']


# The ledger-style resources below are read-only through the generic API. Writes go
# through the dedicated endpoints in actions.py so that balance and holding updates
# and audit logging always happen together with the record itself.

class TransactionViewSet(QueryParamFilterMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.select_related('account', 'account__investor').all()
    serializer_class = TransactionSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    filter_params = {
        'account_id': 'account_id',
        'status': 'status',
        'transaction_type': 'transaction_type',
    }
    search_fields = ['reference_number', 'account__account_number', 'account__investor__full_name']
    ordering_fields = ['transaction_date', 'amount', 'reference_number']


class OrderViewSet(QueryParamFilterMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.select_related('account', 'account__investor', 'stock').all()
    serializer_class = OrderSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    filter_params = {
        'account_id': 'account_id',
        'stock_id': 'stock_id',
        'status': 'status',
        'order_type': 'order_type',
    }
    search_fields = ['stock__symbol', 'account__account_number', 'account__investor__full_name']
    ordering_fields = ['order_date', 'quantity', 'price']


class PortfolioHoldingViewSet(QueryParamFilterMixin, viewsets.ReadOnlyModelViewSet):
    queryset = PortfolioHolding.objects.select_related('account', 'account__investor', 'stock').all()
    serializer_class = PortfolioHoldingSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    filter_params = {
        'account_id': 'account_id',
        'stock_id': 'stock_id',
    }
    search_fields = ['stock__symbol', 'account__account_number', 'account__investor__full_name']
    ordering_fields = ['quantity', 'average_price', 'updated_at']


class AuditLogViewSet(QueryParamFilterMixin, viewsets.ReadOnlyModelViewSet):
    # An audit trail must never be editable through the API.
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    filter_params = {
        'table_name': 'table_name',
        'action': 'action',
    }
    search_fields = ['description', 'table_name']
    ordering_fields = ['created_at']
