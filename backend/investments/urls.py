from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountViewSet,
    AuditLogViewSet,
    CreateOrderAPIView,
    CreateTransactionAPIView,
    ImportTransactionsCSVAPIView,
    InvestorViewSet,
    LoginView,
    LogoutView,
    MeView,
    OrderViewSet,
    PortfolioHoldingViewSet,
    StockViewSet,
    TransactionViewSet,
    account_summary_report,
    accounts_without_transactions_check,
    balance_reconciliation_check,
    deposit_withdrawal_summary_report,
    duplicate_transactions_check,
    failed_transactions_report,
    investors_without_accounts_check,
    negative_balances_check,
    order_status_check,
    pending_orders_report,
    portfolio_summary_report,
    transaction_status_check,
    transaction_summary_report,
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
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),

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
    path('validation/balance-reconciliation/', balance_reconciliation_check),

    path('', include(router.urls)),
]
