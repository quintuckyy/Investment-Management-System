from decimal import Decimal

from rest_framework.exceptions import ValidationError

from investments.models import AuditLog, Order, PortfolioHolding, Transaction
from investments.services import OrderService, TransactionService

from .base import BaseAPITestCase


class TransactionServiceTests(BaseAPITestCase):
    def create(self, **overrides):
        data = {
            'account': self.account,
            'transaction_type': 'DEPOSIT',
            'amount': Decimal('200.00'),
            'reference_number': 'REF-1',
        }
        data.update(overrides)
        return TransactionService.create_transaction(**data)

    def test_deposit_increases_balance(self):
        self.create()
        self.assertEqual(self.balance_of(self.account), Decimal('1200.00'))

    def test_withdrawal_decreases_balance(self):
        self.create(transaction_type='WITHDRAWAL', amount=Decimal('300.00'))
        self.assertEqual(self.balance_of(self.account), Decimal('700.00'))

    def test_withdrawal_of_entire_balance_is_allowed(self):
        self.create(transaction_type='WITHDRAWAL', amount=Decimal('1000.00'))
        self.assertEqual(self.balance_of(self.account), Decimal('0.00'))

    def test_withdrawal_over_balance_is_rejected_and_changes_nothing(self):
        with self.assertRaisesMessage(ValidationError, 'exceeds the available balance'):
            self.create(transaction_type='WITHDRAWAL', amount=Decimal('1000.01'))

        self.assertEqual(self.balance_of(self.account), Decimal('1000.00'))
        self.assertEqual(Transaction.objects.count(), 0)
        self.assertEqual(AuditLog.objects.count(), 0)

    def test_duplicate_reference_number_is_rejected(self):
        self.create()

        with self.assertRaisesMessage(ValidationError, 'already exists'):
            self.create(amount=Decimal('50.00'))

        self.assertEqual(self.balance_of(self.account), Decimal('1200.00'))
        self.assertEqual(Transaction.objects.count(), 1)

    def test_non_positive_amount_is_rejected(self):
        for amount in (Decimal('0'), Decimal('-5.00')):
            with self.assertRaises(ValidationError):
                self.create(amount=amount)

        self.assertEqual(self.balance_of(self.account), Decimal('1000.00'))

    def test_invalid_type_and_status_are_rejected(self):
        with self.assertRaisesMessage(ValidationError, 'not a valid transaction type'):
            self.create(transaction_type='TRANSFER')

        with self.assertRaisesMessage(ValidationError, 'not a valid status'):
            self.create(status='DONE')

    def test_pending_and_failed_transactions_do_not_move_money(self):
        self.create(reference_number='REF-P', status='PENDING')
        self.create(reference_number='REF-F', status='FAILED')

        self.assertEqual(self.balance_of(self.account), Decimal('1000.00'))
        self.assertEqual(Transaction.objects.count(), 2)

    def test_audit_log_entry_is_written(self):
        record = self.create()

        log = AuditLog.objects.get()
        self.assertEqual(log.table_name, 'transactions')
        self.assertEqual(log.action, 'INSERT')
        self.assertEqual(log.record_id, record.id)
        self.assertIn('REF-1', log.description)


class OrderServiceTests(BaseAPITestCase):
    def order(self, **overrides):
        data = {
            'account': self.account,
            'stock': self.stock,
            'order_type': 'BUY',
            'quantity': 5,
            'price': Decimal('100.00'),
        }
        data.update(overrides)
        return OrderService.create_order(**data)

    def test_buy_reduces_balance_and_creates_holding(self):
        self.order()

        self.assertEqual(self.balance_of(self.account), Decimal('500.00'))
        holding = PortfolioHolding.objects.get(account=self.account, stock=self.stock)
        self.assertEqual(holding.quantity, 5)
        self.assertEqual(holding.average_price, Decimal('100.00'))

    def test_second_buy_updates_weighted_average_price(self):
        self.order(quantity=2, price=Decimal('100.00'))
        self.order(quantity=2, price=Decimal('200.00'))

        holding = PortfolioHolding.objects.get(account=self.account, stock=self.stock)
        self.assertEqual(holding.quantity, 4)
        self.assertEqual(holding.average_price, Decimal('150.00'))
        self.assertEqual(self.balance_of(self.account), Decimal('400.00'))

    def test_buy_over_balance_is_rejected(self):
        with self.assertRaisesMessage(ValidationError, 'Insufficient account balance'):
            self.order(quantity=11)

        self.assertEqual(self.balance_of(self.account), Decimal('1000.00'))
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(PortfolioHolding.objects.count(), 0)

    def test_sell_increases_balance_and_reduces_holding(self):
        self.order(quantity=5)
        self.order(order_type='SELL', quantity=2, price=Decimal('120.00'))

        self.assertEqual(self.balance_of(self.account), Decimal('740.00'))
        holding = PortfolioHolding.objects.get(account=self.account, stock=self.stock)
        self.assertEqual(holding.quantity, 3)

    def test_selling_everything_removes_the_holding(self):
        self.order(quantity=5)
        self.order(order_type='SELL', quantity=5)

        self.assertFalse(PortfolioHolding.objects.filter(account=self.account).exists())

    def test_sell_more_than_held_is_rejected(self):
        self.order(quantity=2)

        with self.assertRaisesMessage(ValidationError, 'cannot exceed current holding'):
            self.order(order_type='SELL', quantity=3)

        self.assertEqual(PortfolioHolding.objects.get().quantity, 2)

    def test_sell_without_holding_is_rejected(self):
        with self.assertRaisesMessage(ValidationError, 'No portfolio holding'):
            self.order(order_type='SELL', quantity=1)

    def test_pending_order_does_not_move_money_or_shares(self):
        self.order(status='PENDING')

        self.assertEqual(self.balance_of(self.account), Decimal('1000.00'))
        self.assertEqual(PortfolioHolding.objects.count(), 0)
        self.assertEqual(Order.objects.get().status, 'PENDING')

    def test_invalid_input_is_rejected(self):
        with self.assertRaisesMessage(ValidationError, 'not a valid order type'):
            self.order(order_type='HOLD')

        with self.assertRaisesMessage(ValidationError, 'not a valid status'):
            self.order(status='DONE')

        with self.assertRaisesMessage(ValidationError, 'Quantity must be greater than 0'):
            self.order(quantity=0)

        with self.assertRaisesMessage(ValidationError, 'Price must be greater than 0'):
            self.order(price=Decimal('0'))

        self.assertEqual(Order.objects.count(), 0)

    def test_audit_log_entry_is_written(self):
        record = self.order()

        log = AuditLog.objects.get()
        self.assertEqual(log.table_name, 'orders')
        self.assertEqual(log.record_id, record.id)
        self.assertIn('BDO', log.description)
