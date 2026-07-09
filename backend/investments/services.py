from django.db import transaction as db_transaction
from rest_framework.exceptions import ValidationError

from .models import Account, Transaction, AuditLog, Order, Stock, PortfolioHolding


class TransactionService:
    @staticmethod
    @db_transaction.atomic
    def create_transaction(account, transaction_type, amount, reference_number, status='COMPLETED'):
        if amount <= 0:
            raise ValidationError("Amount must be greater than 0.")

        if Transaction.objects.filter(reference_number=reference_number).exists():
            raise ValidationError("Reference number already exists.")

        if transaction_type == 'WITHDRAWAL' and amount > account.balance:
            raise ValidationError("Withdrawal amount cannot exceed account balance.")

        transaction_record = Transaction.objects.create(
            account=account,
            transaction_type=transaction_type,
            amount=amount,
            reference_number=reference_number,
            status=status
        )

        if status == 'COMPLETED':
            if transaction_type == 'DEPOSIT':
                account.balance += amount
            elif transaction_type == 'WITHDRAWAL':
                account.balance -= amount

            account.save()

        AuditLog.objects.create(
            table_name='transactions',
            action='INSERT',
            record_id=transaction_record.id,
            description=f'{transaction_type} transaction created with reference {reference_number}'
        )

        return transaction_record

class OrderService:
    @staticmethod
    @db_transaction.atomic
    def create_order(account, stock, order_type, quantity, price, status='COMPLETED'):
        if quantity <= 0:
            raise ValidationError("Quantity must be greater than 0.")

        if price <= 0:
            raise ValidationError("Price must be greater than 0.")

        order_value = quantity * price

        if order_type == 'BUY':
            if order_value > account.balance:
                raise ValidationError("Insufficient account balance for this buy order.")

        if order_type == 'SELL':
            holding = PortfolioHolding.objects.filter(
                account=account,
                stock=stock
            ).first()

            if not holding:
                raise ValidationError("No portfolio holding found for this stock.")

            if quantity > holding.quantity:
                raise ValidationError("Sell quantity cannot exceed current holding quantity.")

        order_record = Order.objects.create(
            account=account,
            stock=stock,
            order_type=order_type,
            quantity=quantity,
            price=price,
            status=status
        )

        if status == 'COMPLETED':
            if order_type == 'BUY':
                account.balance -= order_value
                account.save()

                holding, created = PortfolioHolding.objects.get_or_create(
                    account=account,
                    stock=stock,
                    defaults={
                        'quantity': quantity,
                        'average_price': price
                    }
                )

                if not created:
                    total_old_value = holding.quantity * holding.average_price
                    total_new_value = quantity * price
                    new_quantity = holding.quantity + quantity

                    holding.average_price = (total_old_value + total_new_value) / new_quantity
                    holding.quantity = new_quantity
                    holding.save()

            elif order_type == 'SELL':
                holding = PortfolioHolding.objects.get(
                    account=account,
                    stock=stock
                )

                account.balance += order_value
                account.save()

                holding.quantity -= quantity

                if holding.quantity == 0:
                    holding.delete()
                else:
                    holding.save()

        AuditLog.objects.create(
            table_name='orders',
            action='INSERT',
            record_id=order_record.id,
            description=f'{order_type} order created for {quantity} shares of {stock.symbol}'
        )

        return order_record