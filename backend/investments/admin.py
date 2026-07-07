from django.contrib import admin
from .models import (
    Investor,
    Account,
    Stock,
    Transaction,
    Order,
    PortfolioHolding,
    AuditLog,
)


admin.site.register(Investor)
admin.site.register(Account)
admin.site.register(Stock)
admin.site.register(Transaction)
admin.site.register(Order)
admin.site.register(PortfolioHolding)
admin.site.register(AuditLog)