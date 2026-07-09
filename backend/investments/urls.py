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
    duplicate_transactions_check,
    negative_balances_check,
    transaction_status_check,
    order_status_check,
    accounts_without_transactions_check,
    investors_without_accounts_check,
    CreateTransactionAPIView,
    CreateOrderAPIView,
    ImportTransactionsCSVAPIView,
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
    path('transactions/create/', CreateTransactionAPIView.as_view()),
    path('orders/create/', CreateOrderAPIView.as_view()),
    path('etl/import-transactions/', ImportTransactionsCSVAPIView.as_view()),

    path('reports/account-summary/', account_summary_report),
    path('reports/transaction-summary/', transaction_summary_report),
    path('reports/deposit-withdrawal-summary/', deposit_withdrawal_summary_report),
    path('reports/portfolio-summary/', portfolio_summary_report),
    path('reports/pending-orders/', pending_orders_report),
    path('reports/failed-transactions/', failed_transactions_report),

    path('validation/duplicate-transactions/', duplicate_transactions_check),
    path('validation/negative-balances/', negative_balances_check),
    path('validation/transaction-status/', transaction_status_check),
    path('validation/order-status/', order_status_check),
    path('validation/accounts-without-transactions/', accounts_without_transactions_check),
    path('validation/investors-without-accounts/', investors_without_accounts_check),
    
    path('', include(router.urls)),
]