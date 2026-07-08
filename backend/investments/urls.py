from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    InvestorViewSet,
    AccountViewSet,
    StockViewSet,
    TransactionViewSet,
    OrderViewSet,
    PortfolioHoldingViewSet,
    AuditLogViewSet,
    account_summary_report,
    transaction_summary_report,
    deposit_withdrawal_summary_report,
    portfolio_summary_report,
    pending_orders_report,
    failed_transactions_report,
)

router = DefaultRouter()
router.register(r'investors', InvestorViewSet, basename='investor')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'stocks', StockViewSet, basename='stock')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'portfolio-holdings', PortfolioHoldingViewSet, basename='portfolio-holding')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),

    path('reports/account-summary/', account_summary_report),
    path('reports/transaction-summary/', transaction_summary_report),
    path('reports/deposit-withdrawal-summary/', deposit_withdrawal_summary_report),
    path('reports/portfolio-summary/', portfolio_summary_report),
    path('reports/pending-orders/', pending_orders_report),
    path('reports/failed-transactions/', failed_transactions_report),
]