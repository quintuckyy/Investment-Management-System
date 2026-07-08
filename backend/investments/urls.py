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
]