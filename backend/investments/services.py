from django.db import transaction as db_transaction
from rest_framework.exceptions import ValidationError

from .models import Account, Transaction, AuditLog


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