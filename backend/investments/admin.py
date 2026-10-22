from django.contrib import admin

from .models import (
    Account,
    AuditLog,
    Investor,
    Order,
    PortfolioHolding,
    Stock,
    Transaction,
)


@admin.register(Investor)
class InvestorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone_number', 'created_at')
    search_fields = ('full_name', 'email')


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'investor', 'account_type', 'balance', 'status')
    list_filter = ('status', 'account_type')
    search_fields = ('account_number', 'investor__full_name')


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'company_name', 'current_price')
    search_fields = ('symbol', 'company_name')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'account', 'transaction_type', 'amount', 'status', 'transaction_date')
    list_filter = ('transaction_type', 'status')
    search_fields = ('reference_number',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'stock', 'order_type', 'quantity', 'price', 'status', 'order_date')
    list_filter = ('order_type', 'status')


@admin.register(PortfolioHolding)
class PortfolioHoldingAdmin(admin.ModelAdmin):
    list_display = ('account', 'stock', 'quantity', 'average_price', 'updated_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'table_name', 'action', 'record_id', 'description')
    list_filter = ('table_name', 'action')
    # The audit trail is append-only, even for admins.
    readonly_fields = ('table_name', 'action', 'record_id', 'description', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
