from django.db import transaction as db_transaction
from rest_framework.exceptions import ValidationError

from .models import Account, AuditLog, Order, PortfolioHolding, Transaction

TRANSACTION_TYPES = ('DEPOSIT', 'WITHDRAWAL')
TRANSACTION_STATUSES = ('COMPLETED', 'PENDING', 'FAILED')
ORDER_TYPES = ('BUY', 'SELL')
ORDER_STATUSES = ('COMPLETED', 'PENDING', 'CANCELLED', 'FAILED')


class TransactionService:
    @staticmethod
    @db_transaction.atomic
    def create_transaction(account, transaction_type, amount, reference_number, status='COMPLETED'):
        # Lock the account row so concurrent requests cannot both pass the balance check.
        account = Account.objects.select_for_update().get(id=account.id)

        if amount <= 0:
            raise ValidationError(f"Amount must be greater than ₱0 (got ₱{amount:,.2f}).")

        if Transaction.objects.filter(reference_number=reference_number).exists():
            raise ValidationError(f"A transaction with reference number '{reference_number}' already exists.")

        if transaction_type not in TRANSACTION_TYPES:
            raise ValidationError(f"'{transaction_type}' is not a valid transaction type; use DEPOSIT or WITHDRAWAL.")

        if status not in TRANSACTION_STATUSES:
            raise ValidationError(f"'{status}' is not a valid status; use COMPLETED, PENDING, or FAILED.")

        if transaction_type == 'WITHDRAWAL' and amount > account.balance:
            raise ValidationError(
                f"Withdrawal of ₱{amount:,.2f} exceeds the available balance of ₱{account.balance:,.2f}."
            )

        transaction_record = Transaction.objects.create(
            account=account,
            transaction_type=transaction_type,
            amount=amount,
            reference_number=reference_number,
            status=status
        )

        # Only completed transactions move money.
        if status == 'COMPLETED':
            if transaction_type == 'DEPOSIT':
                account.balance = account.balance + amount

            if transaction_type == 'WITHDRAWAL':
                account.balance = account.balance - amount

            account.save(update_fields=['balance'])

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
        # Lock the account row so concurrent orders cannot overspend the balance.
        account = Account.objects.select_for_update().get(id=account.id)

        if order_type not in ORDER_TYPES:
            raise ValidationError(f"'{order_type}' is not a valid order type; use BUY or SELL.")

        if status not in ORDER_STATUSES:
            raise ValidationError(f"'{status}' is not a valid status; use COMPLETED, PENDING, CANCELLED, or FAILED.")

        if quantity <= 0:
            raise ValidationError("Quantity must be greater than 0.")

        if price <= 0:
            raise ValidationError("Price must be greater than 0.")

        order_value = quantity * price

        if order_type == 'BUY':
            if order_value > account.balance:
                raise ValidationError("Insufficient account balance for this buy order.")

        if order_type == 'SELL':
            holding = PortfolioHolding.objects.select_for_update().filter(
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

        # Only completed orders move money and shares.
        if status == 'COMPLETED':
            if order_type == 'BUY':
                account.balance -= order_value
                account.save(update_fields=['balance'])

                holding, created = PortfolioHolding.objects.select_for_update().get_or_create(
                    account=account,
                    stock=stock,
                    defaults={
                        'quantity': quantity,
                        'average_price': price
                    }
                )

                if not created:
                    # Weighted average cost of the old and new shares.
                    total_old_value = holding.quantity * holding.average_price
                    total_new_value = quantity * price
                    new_quantity = holding.quantity + quantity

                    holding.average_price = (total_old_value + total_new_value) / new_quantity
                    holding.quantity = new_quantity
                    holding.save()

            elif order_type == 'SELL':
                account.balance += order_value
                account.save(update_fields=['balance'])

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
