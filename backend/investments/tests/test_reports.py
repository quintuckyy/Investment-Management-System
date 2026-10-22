from decimal import Decimal

from investments.models import Account, Investor
from investments.services import OrderService, TransactionService

from .base import BaseAPITestCase


class ReportEndpointTests(BaseAPITestCase):
    """The reports read from SQL views created by migration 0003."""

    def setUp(self):
        self.as_viewer()

        TransactionService.create_transaction(self.account, 'DEPOSIT', Decimal('500.00'), 'R-DEP')
        TransactionService.create_transaction(self.account, 'WITHDRAWAL', Decimal('100.00'), 'R-WD')
        TransactionService.create_transaction(self.account, 'DEPOSIT', Decimal('10.00'), 'R-FAIL', status='FAILED')
        OrderService.create_order(self.account, self.stock, 'BUY', 4, Decimal('100.00'))
        OrderService.create_order(self.account, self.stock, 'BUY', 1, Decimal('100.00'), status='PENDING')

    def test_account_summary_lists_every_account_with_its_investor(self):
        response = self.client.get('/api/reports/account-summary/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)
        self.assertEqual(
            {row['account_number']: row['investor_name'] for row in response.data},
            {
                'ACC-1001': 'Juan Dela Cruz',
                'ACC-1002': 'Juan Dela Cruz',
                'ACC-2001': 'Maria Santos',
            },
        )

    def test_transaction_summary_and_failed_transactions(self):
        summary = self.client.get('/api/reports/transaction-summary/')
        failed = self.client.get('/api/reports/failed-transactions/')

        self.assertEqual(len(summary.data), 3)
        self.assertEqual([row['reference_number'] for row in failed.data], ['R-FAIL'])

    def test_deposit_withdrawal_summary_totals(self):
        response = self.client.get('/api/reports/deposit-withdrawal-summary/')
        row = next(r for r in response.data if r['account_number'] == 'ACC-1001')

        self.assertEqual(Decimal(row['total_deposits']), Decimal('500.00'))
        self.assertEqual(Decimal(row['total_withdrawals']), Decimal('100.00'))

    def test_portfolio_summary_shows_gain_and_loss(self):
        self.stock.current_price = Decimal('110.00')
        self.stock.save()

        response = self.client.get('/api/reports/portfolio-summary/')

        self.assertEqual(len(response.data), 1)
        row = response.data[0]
        self.assertEqual(row['symbol'], 'BDO')
        self.assertEqual(Decimal(row['invested_value']), Decimal('400.00'))
        self.assertEqual(Decimal(row['current_value']), Decimal('440.00'))
        self.assertEqual(Decimal(row['gain_loss']), Decimal('40.00'))

    def test_pending_orders_report(self):
        response = self.client.get('/api/reports/pending-orders/')

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'PENDING')


class ValidationEndpointTests(BaseAPITestCase):
    def setUp(self):
        self.as_viewer()

    def test_healthy_data_returns_empty_lists_for_integrity_checks(self):
        for name in ('duplicate-transactions', 'negative-balances'):
            with self.subTest(check=name):
                self.assertEqual(self.client.get(f'/api/validation/{name}/').data, [])

    def test_accounts_without_transactions(self):
        TransactionService.create_transaction(self.account, 'DEPOSIT', Decimal('1.00'), 'V-1')

        response = self.client.get('/api/validation/accounts-without-transactions/')

        self.assertEqual(
            sorted(row['account_number'] for row in response.data),
            ['ACC-1002', 'ACC-2001'],
        )

    def test_investors_without_accounts(self):
        lonely = Investor.objects.create(full_name='No Accounts', email='none@example.com')

        response = self.client.get('/api/validation/investors-without-accounts/')

        self.assertEqual([row['id'] for row in response.data], [lonely.id])

    def test_transaction_and_order_status_checks_flag_unfinished_records(self):
        TransactionService.create_transaction(self.account, 'DEPOSIT', Decimal('1.00'), 'V-OK')
        TransactionService.create_transaction(self.account, 'DEPOSIT', Decimal('1.00'), 'V-PEND', status='PENDING')
        OrderService.create_order(self.account, self.stock, 'BUY', 1, Decimal('10.00'), status='CANCELLED')

        transactions = self.client.get('/api/validation/transaction-status/')
        orders = self.client.get('/api/validation/order-status/')

        self.assertEqual([row['reference_number'] for row in transactions.data], ['V-PEND'])
        self.assertEqual(len(orders.data), 1)
        self.assertEqual(orders.data[0]['status'], 'CANCELLED')

    def test_duplicate_check_endpoint_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/validation/duplicate-transactions/').status_code, 401)


class ApiDocsTests(BaseAPITestCase):
    def test_openapi_schema_is_public_and_lists_the_endpoints(self):
        response = self.client.get('/api/schema/', HTTP_ACCEPT='application/vnd.oai.openapi+json')

        self.assertEqual(response.status_code, 200)
        paths = response.json()['paths']
        expected = ('/api/investors/', '/api/transactions/create/', '/api/etl/import-transactions/', '/api/auth/login/')
        for path in expected:
            self.assertIn(path, paths)

    def test_swagger_ui_is_served(self):
        self.assertEqual(self.client.get('/api/docs/').status_code, 200)


class CompositeAccountTests(BaseAPITestCase):
    def test_account_serializer_exposes_investor_name(self):
        self.as_viewer()

        response = self.client.get(f'/api/accounts/{self.account.id}/')

        self.assertEqual(response.data['investor_name'], 'Juan Dela Cruz')
        self.assertEqual(Account.objects.filter(investor=self.investor).count(), 2)


class BalanceReconciliationTests(BaseAPITestCase):
    URL = '/api/validation/balance-reconciliation/'

    def setUp(self):
        self.as_viewer()

    def test_balances_built_through_the_services_reconcile(self):
        clean = Account.objects.create(
            investor=self.investor, account_number='ACC-CLEAN', account_type='INDIVIDUAL'
        )

        TransactionService.create_transaction(clean, 'DEPOSIT', Decimal('500.00'), 'RC-1')
        TransactionService.create_transaction(clean, 'WITHDRAWAL', Decimal('120.00'), 'RC-2')
        TransactionService.create_transaction(clean, 'DEPOSIT', Decimal('99.00'), 'RC-3', status='FAILED')
        OrderService.create_order(clean, self.stock, 'BUY', 3, Decimal('100.00'))
        OrderService.create_order(clean, self.stock, 'SELL', 1, Decimal('110.00'))
        OrderService.create_order(clean, self.stock, 'BUY', 1, Decimal('100.00'), status='PENDING')

        # 500 - 120 - 300 + 110 = 190; failed and pending records must not count.
        self.assertEqual(self.balance_of(clean), Decimal('190.00'))

        flagged = [row['account_number'] for row in self.client.get(self.URL).data]

        self.assertNotIn('ACC-CLEAN', flagged)

    def test_tampered_balance_is_detected(self):
        TransactionService.create_transaction(self.other_account, 'DEPOSIT', Decimal('50.00'), 'RC-X')
        Account.objects.filter(id=self.other_account.id).update(balance=Decimal('999.00'))

        response = self.client.get(self.URL)

        row = next(r for r in response.data if r['account_number'] == 'ACC-2001')
        self.assertEqual(Decimal(row['recorded_balance']), Decimal('999.00'))
        self.assertEqual(Decimal(row['expected_balance']), Decimal('50.00'))
        self.assertEqual(Decimal(row['difference']), Decimal('949.00'))

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.URL).status_code, 401)


class SeedSampleDataCommandTests(BaseAPITestCase):
    def test_seed_command_builds_a_consistent_portfolio(self):
        from django.contrib.auth import get_user_model
        from django.core.management import call_command

        from investments.models import PortfolioHolding

        # Start from an empty database.
        Account.objects.all().delete()
        Investor.objects.all().delete()
        self.stock.delete()

        call_command('seed_sample_data', with_demo_users=True, stdout=__import__('io').StringIO())

        self.assertEqual(Investor.objects.count(), 5)
        self.assertEqual(Account.objects.count(), 6)
        self.assertEqual(Account.objects.get(account_number='ACC-1001').balance, Decimal('23900.00'))
        self.assertEqual(Account.objects.get(account_number='ACC-1004').balance, Decimal('86800.00'))
        self.assertEqual(PortfolioHolding.objects.count(), 4)

        # An investor with more than one account, and balances that reconcile with the ledger.
        self.assertEqual(Investor.objects.get(email='juan.delacruz@example.com').accounts.count(), 2)
        self.as_viewer()
        self.assertEqual(self.client.get('/api/validation/balance-reconciliation/').data, [])

        User = get_user_model()
        self.assertTrue(User.objects.get(username='admin').is_staff)
        self.assertFalse(User.objects.get(username='viewer').is_staff)

    def test_seed_command_is_idempotent(self):
        import io

        from django.core.management import call_command

        call_command('seed_sample_data', stdout=io.StringIO())

        self.assertEqual(Investor.objects.count(), 2)  # fixture investors only; nothing added
