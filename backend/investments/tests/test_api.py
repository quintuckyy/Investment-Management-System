from decimal import Decimal

from investments.models import Account, AuditLog, Investor, Order, PortfolioHolding, Stock, Transaction

from .base import BaseAPITestCase


class AuthenticationTests(BaseAPITestCase):
    def test_endpoints_reject_anonymous_requests(self):
        for url in (
            '/api/investors/',
            '/api/accounts/',
            '/api/transactions/',
            '/api/reports/account-summary/',
            '/api/validation/negative-balances/',
        ):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 401)

    def test_login_returns_token_that_authenticates_requests(self):
        response = self.client.post('/api/auth/login/', {'username': 'viewer', 'password': 'pass-12345'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'viewer')
        self.assertFalse(response.data['is_staff'])

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        self.assertEqual(self.client.get('/api/investors/').status_code, 200)
        self.assertEqual(self.client.get('/api/auth/me/').data['username'], 'viewer')

    def test_login_with_wrong_password_fails(self):
        response = self.client.post('/api/auth/login/', {'username': 'viewer', 'password': 'wrong'})
        self.assertEqual(response.status_code, 400)

    def test_logout_invalidates_the_token(self):
        login = self.client.post('/api/auth/login/', {'username': 'staff', 'password': 'pass-12345'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")

        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 204)
        self.assertEqual(self.client.get('/api/investors/').status_code, 401)


class PermissionTests(BaseAPITestCase):
    def test_viewer_can_read_but_not_write(self):
        self.as_viewer()

        self.assertEqual(self.client.get('/api/investors/').status_code, 200)

        response = self.client.post('/api/investors/', {'full_name': 'New', 'email': 'new@example.com'})
        self.assertEqual(response.status_code, 403)

        self.assertEqual(self.client.delete(f'/api/investors/{self.investor.id}/').status_code, 403)
        self.assertTrue(Investor.objects.filter(id=self.investor.id).exists())

    def test_viewer_cannot_use_action_endpoints(self):
        self.as_viewer()

        response = self.client.post('/api/transactions/create/', {
            'account_id': self.account.id,
            'transaction_type': 'DEPOSIT',
            'amount': '100',
            'reference_number': 'REF-V',
        })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Transaction.objects.count(), 0)

    def test_staff_can_create_update_and_delete_investors(self):
        self.as_staff()

        created = self.client.post('/api/investors/', {'full_name': 'New Person', 'email': 'new@example.com'})
        self.assertEqual(created.status_code, 201)

        url = f"/api/investors/{created.data['id']}/"
        self.assertEqual(self.client.patch(url, {'phone_number': '0917'}).status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)

    def test_ledger_resources_are_read_only_even_for_staff(self):
        self.as_staff()
        self.client.post('/api/transactions/create/', {
            'account_id': self.account.id,
            'transaction_type': 'DEPOSIT',
            'amount': '100',
            'reference_number': 'REF-RO',
        })
        transaction = Transaction.objects.get()
        log = AuditLog.objects.get()

        for url in (
            '/api/transactions/',
            '/api/orders/',
            '/api/portfolio-holdings/',
            '/api/audit-logs/',
        ):
            with self.subTest(url=url):
                self.assertEqual(self.client.post(url, {}).status_code, 405)

        self.assertEqual(self.client.patch(f'/api/transactions/{transaction.id}/', {'amount': '1'}).status_code, 405)
        self.assertEqual(self.client.delete(f'/api/audit-logs/{log.id}/').status_code, 405)


class FilteringAndPaginationTests(BaseAPITestCase):
    def setUp(self):
        self.as_viewer()

    def test_list_is_a_plain_array_by_default(self):
        response = self.client.get('/api/accounts/')

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 3)

    def test_pagination_is_opt_in(self):
        response = self.client.get('/api/accounts/', {'page_size': 2})

        self.assertEqual(response.data['count'], 3)
        self.assertEqual(len(response.data['results']), 2)
        self.assertIsNotNone(response.data['next'])

        second_page = self.client.get('/api/accounts/', {'page_size': 2, 'page': 2})
        self.assertEqual(len(second_page.data['results']), 1)

    def test_filter_by_investor(self):
        response = self.client.get('/api/accounts/', {'investor_id': self.investor.id})

        self.assertEqual(
            sorted(a['account_number'] for a in response.data),
            ['ACC-1001', 'ACC-1002'],
        )

    def test_investor_can_have_multiple_accounts(self):
        self.assertEqual(self.investor.accounts.count(), 2)

    def test_invalid_filter_value_returns_400(self):
        response = self.client.get('/api/accounts/', {'investor_id': 'abc'})
        self.assertEqual(response.status_code, 400)

    def test_search(self):
        response = self.client.get('/api/investors/', {'search': 'maria'})

        self.assertEqual([i['email'] for i in response.data], ['maria@example.com'])

    def test_ordering(self):
        response = self.client.get('/api/accounts/', {'ordering': '-balance'})

        self.assertEqual(
            [a['account_number'] for a in response.data],
            ['ACC-1001', 'ACC-1002', 'ACC-2001'],
        )

    def test_transactions_can_be_filtered_by_status_and_account(self):
        self.as_staff()
        for reference, status, account in (
            ('R1', 'COMPLETED', self.account),
            ('R2', 'FAILED', self.account),
            ('R3', 'FAILED', self.other_account),
        ):
            self.client.post('/api/transactions/create/', {
                'account_id': account.id,
                'transaction_type': 'DEPOSIT',
                'amount': '10',
                'reference_number': reference,
                'status': status,
            })

        response = self.client.get('/api/transactions/', {'status': 'FAILED', 'account_id': self.account.id})

        self.assertEqual([t['reference_number'] for t in response.data], ['R2'])


class CreateTransactionEndpointTests(BaseAPITestCase):
    URL = '/api/transactions/create/'

    def post(self, **overrides):
        data = {
            'account_id': self.account.id,
            'transaction_type': 'DEPOSIT',
            'amount': '250.50',
            'reference_number': 'REF-API-1',
        }
        data.update(overrides)
        data = {key: value for key, value in data.items() if value is not None}
        return self.client.post(self.URL, data)

    def setUp(self):
        self.as_staff()

    def test_deposit_returns_new_balance(self):
        response = self.post()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(str(response.data['new_balance'])), Decimal('1250.50'))
        self.assertEqual(self.balance_of(self.account), Decimal('1250.50'))

    def test_missing_fields_return_400(self):
        self.assertEqual(self.post(reference_number=None).status_code, 400)

    def test_unknown_account_returns_404(self):
        self.assertEqual(self.post(account_id=999999).status_code, 404)

    def test_non_numeric_account_returns_404_not_500(self):
        self.assertEqual(self.post(account_id='abc').status_code, 404)

    def test_bad_amounts_return_400(self):
        for amount in ('abc', 'NaN', 'Infinity', '-5', '0', '10.123', '1' * 20):
            with self.subTest(amount=amount):
                response = self.post(amount=amount, reference_number=f'REF-{amount}')
                self.assertEqual(response.status_code, 400, response.data)

        self.assertEqual(Transaction.objects.count(), 0)

    def test_overdraft_returns_400_with_message(self):
        response = self.post(transaction_type='WITHDRAWAL', amount='5000')

        self.assertEqual(response.status_code, 400)
        self.assertIn('exceeds the available balance', response.data['error'])

    def test_duplicate_reference_returns_400(self):
        self.post()
        response = self.post()

        self.assertEqual(response.status_code, 400)
        self.assertIn('already exists', response.data['error'])


class CreateOrderEndpointTests(BaseAPITestCase):
    URL = '/api/orders/create/'

    def setUp(self):
        self.as_staff()

    def post(self, **overrides):
        data = {
            'account_id': self.account.id,
            'stock_id': self.stock.id,
            'order_type': 'BUY',
            'quantity': 3,
            'price': '100.00',
        }
        data.update(overrides)
        return self.client.post(self.URL, data)

    def test_buy_order_updates_balance_and_holding(self):
        response = self.post()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(str(response.data['new_balance'])), Decimal('700.00'))
        self.assertEqual(PortfolioHolding.objects.get().quantity, 3)
        self.assertEqual(Order.objects.count(), 1)

    def test_unknown_account_and_stock_return_404(self):
        self.assertEqual(self.post(account_id=999999).status_code, 404)
        self.assertEqual(self.post(stock_id=999999).status_code, 404)
        self.assertEqual(self.post(account_id='abc').status_code, 404)

    def test_invalid_values_return_400(self):
        self.assertEqual(self.post(quantity='abc').status_code, 400)
        self.assertEqual(self.post(price='abc').status_code, 400)
        self.assertEqual(self.post(order_type='HOLD').status_code, 400)
        self.assertEqual(self.post(status='DONE').status_code, 400)
        self.assertEqual(self.post(quantity=1000).status_code, 400)
        self.assertEqual(Order.objects.count(), 0)


class DatabaseConstraintTests(BaseAPITestCase):
    """The database itself must refuse bad data, even if application code is bypassed."""

    def assert_rejected(self, create):
        from django.db import IntegrityError, transaction

        with self.assertRaises(IntegrityError), transaction.atomic():
            create()

    def test_negative_balance_is_rejected(self):
        self.assert_rejected(lambda: Account.objects.filter(id=self.account.id).update(balance=Decimal('-1')))

    def test_non_positive_stock_price_is_rejected(self):
        self.assert_rejected(lambda: Stock.objects.create(symbol='X', company_name='X', current_price=Decimal('0')))

    def test_non_positive_transaction_amount_is_rejected(self):
        self.assert_rejected(lambda: Transaction.objects.create(
            account=self.account, transaction_type='DEPOSIT', amount=Decimal('0'), reference_number='C1'
        ))

    def test_duplicate_account_number_is_rejected(self):
        self.assert_rejected(lambda: Account.objects.create(
            investor=self.investor, account_number='ACC-1001', account_type='X'
        ))

    def test_zero_quantity_order_is_rejected(self):
        self.assert_rejected(lambda: Order.objects.create(
            account=self.account, stock=self.stock, order_type='BUY', quantity=0, price=Decimal('1')
        ))


class DataSafetyTests(BaseAPITestCase):
    def setUp(self):
        self.as_staff()

    def test_investor_with_accounts_cannot_be_deleted(self):
        response = self.client.delete(f'/api/investors/{self.investor.id}/')

        self.assertEqual(response.status_code, 409)
        self.assertIn('accounts', response.data['error'])
        self.assertTrue(Investor.objects.filter(id=self.investor.id).exists())
        self.assertEqual(Account.objects.filter(investor=self.investor).count(), 2)

    def test_account_with_transactions_cannot_be_deleted(self):
        self.client.post('/api/transactions/create/', {
            'account_id': self.account.id,
            'transaction_type': 'DEPOSIT',
            'amount': '10',
            'reference_number': 'REF-KEEP',
        })

        response = self.client.delete(f'/api/accounts/{self.account.id}/')

        self.assertEqual(response.status_code, 409)
        self.assertEqual(Transaction.objects.count(), 1)

    def test_stock_used_by_orders_cannot_be_deleted(self):
        self.client.post('/api/orders/create/', {
            'account_id': self.account.id,
            'stock_id': self.stock.id,
            'order_type': 'BUY',
            'quantity': 1,
            'price': '10',
        })

        self.assertEqual(self.client.delete(f'/api/stocks/{self.stock.id}/').status_code, 409)

    def test_unreferenced_records_can_be_deleted(self):
        lonely = Investor.objects.create(full_name='Lonely', email='lonely@example.com')

        self.assertEqual(self.client.delete(f'/api/investors/{lonely.id}/').status_code, 204)

    def test_balance_cannot_be_set_through_the_accounts_api(self):
        response = self.client.patch(f'/api/accounts/{self.account.id}/', {'balance': '999999.00'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.balance_of(self.account), Decimal('1000.00'))

        created = self.client.post('/api/accounts/', {
            'investor': self.investor.id,
            'account_number': 'ACC-NEW',
            'account_type': 'JOINT',
            'balance': '5000.00',
        })

        self.assertEqual(created.status_code, 201)
        self.assertEqual(Decimal(created.data['balance']), Decimal('0.00'))

    def test_duplicate_values_return_field_errors(self):
        response = self.client.post('/api/investors/', {'full_name': 'Dup', 'email': self.investor.email})

        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)

        response = self.client.post('/api/stocks/', {'symbol': 'BDO', 'company_name': 'Dup', 'current_price': '1'})

        self.assertEqual(response.status_code, 400)
        self.assertIn('symbol', response.data)
