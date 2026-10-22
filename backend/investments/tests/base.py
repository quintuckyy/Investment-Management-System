from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from investments.models import Account, Investor, Stock


class BaseAPITestCase(APITestCase):
    """Shared fixtures: two users (staff / viewer) and a small investment portfolio."""

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.staff = User.objects.create_user('staff', password='pass-12345', is_staff=True)
        cls.viewer = User.objects.create_user('viewer', password='pass-12345')

        cls.investor = Investor.objects.create(full_name='Juan Dela Cruz', email='juan@example.com')
        cls.other_investor = Investor.objects.create(full_name='Maria Santos', email='maria@example.com')

        cls.account = Account.objects.create(
            investor=cls.investor,
            account_number='ACC-1001',
            account_type='INDIVIDUAL',
            balance=Decimal('1000.00'),
        )
        cls.second_account = Account.objects.create(
            investor=cls.investor,
            account_number='ACC-1002',
            account_type='RETIREMENT',
            balance=Decimal('500.00'),
        )
        cls.other_account = Account.objects.create(
            investor=cls.other_investor,
            account_number='ACC-2001',
            account_type='INDIVIDUAL',
            balance=Decimal('250.00'),
        )

        cls.stock = Stock.objects.create(
            symbol='BDO',
            company_name='BDO Unibank Inc.',
            current_price=Decimal('100.00'),
        )

    def as_staff(self):
        self.client.force_authenticate(self.staff)

    def as_viewer(self):
        self.client.force_authenticate(self.viewer)

    def balance_of(self, account):
        account.refresh_from_db()
        return account.balance
