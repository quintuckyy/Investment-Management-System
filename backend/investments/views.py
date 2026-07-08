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