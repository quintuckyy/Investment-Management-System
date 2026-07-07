from django.db import models


class Investor(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'investors'
        ordering = ['full_name']

    def __str__(self):
        return self.full_name


class Account(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]

    investor = models.ForeignKey(
        Investor,
        on_delete=models.CASCADE,
        related_name='accounts'
    )
    account_number = models.CharField(max_length=30, unique=True)
    account_type = models.CharField(max_length=30)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts'
        ordering = ['account_number']

    def __str__(self):
        return self.account_number


class Stock(models.Model):
    symbol = models.CharField(max_length=10, unique=True)
    company_name = models.CharField(max_length=150)
    current_price = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stocks'
        ordering = ['symbol']

    def __str__(self):
        return self.symbol


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
    ]

    STATUS_CHOICES = [
        ('COMPLETED', 'Completed'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
    ]

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reference_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    transaction_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-transaction_date']

    def __str__(self):
        return self.reference_number


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    STATUS_CHOICES = [
        ('COMPLETED', 'Completed'),
        ('PENDING', 'Pending'),
        ('CANCELLED', 'Cancelled'),
        ('FAILED', 'Failed'),
    ]

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    order_type = models.CharField(max_length=10, choices=ORDER_TYPE_CHOICES)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    order_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-order_date']

    def __str__(self):
        return f'{self.order_type} {self.stock.symbol}'


class PortfolioHolding(models.Model):
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='portfolio_holdings'
    )
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name='portfolio_holdings'
    )
    quantity = models.PositiveIntegerField(default=0)
    average_price = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'portfolio_holdings'
        unique_together = ('account', 'stock')
        ordering = ['account', 'stock']

    def __str__(self):
        return f'{self.account.account_number} - {self.stock.symbol}'


class AuditLog(models.Model):
    table_name = models.CharField(max_length=50)
    action = models.CharField(max_length=20)
    record_id = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} on {self.table_name}'