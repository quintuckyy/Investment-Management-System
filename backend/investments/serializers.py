from rest_framework import serializers
from .models import (
    Investor,
    Account,
    Stock,
    Transaction,
    Order,
    PortfolioHolding,
    AuditLog,
)

class InvestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investor
        fields = '__all__'


class AccountSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)

    class Meta:
        model = Account
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)
    investor_name = serializers.CharField(source='account.investor.full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Transaction amount must be greater than 0.")
        return value

    def validate(self, data):
        transaction_type = data.get('transaction_type')
        amount = data.get('amount')
        account = data.get('account')

        if transaction_type == 'WITHDRAWAL' and account and amount:
            if amount > account.balance:
                raise serializers.ValidationError("Withdrawal amount cannot exceed account balance.")

        return data


class OrderSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)
    investor_name = serializers.CharField(source='account.investor.full_name', read_only=True)
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    order_value = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'

    def get_order_value(self, obj):
        return obj.quantity * obj.price

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value


class PortfolioHoldingSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)
    investor_name = serializers.CharField(source='account.investor.full_name', read_only=True)
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    current_price = serializers.DecimalField(
        source='stock.current_price',
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    current_value = serializers.SerializerMethodField()
    gain_loss = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioHolding
        fields = '__all__'

    def get_current_value(self, obj):
        return obj.quantity * obj.stock.current_price

    def get_gain_loss(self, obj):
        invested_value = obj.quantity * obj.average_price
        current_value = obj.quantity * obj.stock.current_price
        return current_value - invested_value


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'