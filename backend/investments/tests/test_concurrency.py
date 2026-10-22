import threading
from decimal import Decimal

from django.db import connection
from django.test import TransactionTestCase
from rest_framework.exceptions import ValidationError

from investments.models import Account, Investor, Transaction
from investments.services import TransactionService


class ConcurrentWithdrawalTests(TransactionTestCase):
    """Two requests racing for the same money must not both succeed.

    This needs real database transactions (not the rolled-back ones of a normal
    TestCase) and real threads, so it exercises the row lock taken by
    select_for_update() in TransactionService.
    """

    def test_simultaneous_withdrawals_cannot_overdraw_the_account(self):
        investor = Investor.objects.create(full_name='Racer', email='racer@example.com')
        account = Account.objects.create(
            investor=investor,
            account_number='ACC-RACE',
            account_type='INDIVIDUAL',
            balance=Decimal('1000.00'),
        )

        attempts = 6
        barrier = threading.Barrier(attempts)
        outcomes = []

        def withdraw(index):
            try:
                barrier.wait()
                TransactionService.create_transaction(
                    account, 'WITHDRAWAL', Decimal('400.00'), f'RACE-{index}'
                )
                outcomes.append('ok')
            except ValidationError:
                outcomes.append('rejected')
            finally:
                connection.close()

        threads = [threading.Thread(target=withdraw, args=(i,)) for i in range(attempts)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        account.refresh_from_db()

        # 1000 / 400 -> exactly two withdrawals fit, the rest must be refused.
        self.assertEqual(outcomes.count('ok'), 2)
        self.assertEqual(outcomes.count('rejected'), attempts - 2)
        self.assertEqual(account.balance, Decimal('200.00'))
        self.assertEqual(Transaction.objects.count(), 2)
