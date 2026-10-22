from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from investments.models import Account, Investor, Stock
from investments.services import OrderService, TransactionService

INVESTORS = [
    ('Juan Dela Cruz', 'juan.delacruz@example.com', '09171234567'),
    ('Maria Santos', 'maria.santos@example.com', '09181234567'),
    ('Pedro Reyes', 'pedro.reyes@example.com', '09191234567'),
    ('Ana Garcia', 'ana.garcia@example.com', '09201234567'),
    ('Carlo Mendoza', 'carlo.mendoza@example.com', '09211234567'),
]

# (investor email, account number, type) - Juan holds two accounts on purpose.
ACCOUNTS = [
    ('juan.delacruz@example.com', 'ACC-1001', 'INDIVIDUAL'),
    ('maria.santos@example.com', 'ACC-1002', 'INDIVIDUAL'),
    ('pedro.reyes@example.com', 'ACC-1003', 'INDIVIDUAL'),
    ('ana.garcia@example.com', 'ACC-1004', 'INDIVIDUAL'),
    ('carlo.mendoza@example.com', 'ACC-1005', 'INDIVIDUAL'),
    ('juan.delacruz@example.com', 'ACC-1006', 'RETIREMENT'),
]

STOCKS = [
    ('BDO', 'BDO Unibank Inc.', '145.50'),
    ('ALI', 'Ayala Land Inc.', '32.75'),
    ('JFC', 'Jollibee Foods Corporation', '245.00'),
    ('AC', 'Ayala Corporation', '680.00'),
    ('TEL', 'PLDT Inc.', '1320.00'),
    ('SM', 'SM Investments Corporation', '890.00'),
]

# (account number, type, amount, reference, status)
TRANSACTIONS = [
    ('ACC-1001', 'DEPOSIT', '50000.00', 'TXN-0001', 'COMPLETED'),
    ('ACC-1002', 'DEPOSIT', '75000.00', 'TXN-0002', 'COMPLETED'),
    ('ACC-1003', 'DEPOSIT', '30000.00', 'TXN-0003', 'COMPLETED'),
    ('ACC-1004', 'DEPOSIT', '100000.00', 'TXN-0004', 'COMPLETED'),
    ('ACC-1005', 'DEPOSIT', '25000.00', 'TXN-0005', 'COMPLETED'),
    ('ACC-1001', 'WITHDRAWAL', '5000.00', 'TXN-0006', 'COMPLETED'),
    ('ACC-1002', 'WITHDRAWAL', '10000.00', 'TXN-0007', 'COMPLETED'),
    ('ACC-1003', 'DEPOSIT', '15000.00', 'TXN-0008', 'PENDING'),
    ('ACC-1004', 'WITHDRAWAL', '8000.00', 'TXN-0009', 'FAILED'),
]

# (account number, stock symbol, type, quantity, price, status)
ORDERS = [
    ('ACC-1001', 'BDO', 'BUY', 100, '145.50', 'COMPLETED'),
    ('ACC-1001', 'ALI', 'BUY', 200, '32.75', 'COMPLETED'),
    ('ACC-1002', 'JFC', 'BUY', 50, '245.00', 'COMPLETED'),
    ('ACC-1003', 'AC', 'BUY', 20, '680.00', 'PENDING'),
    ('ACC-1004', 'TEL', 'BUY', 10, '1320.00', 'COMPLETED'),
    ('ACC-1005', 'SM', 'BUY', 15, '890.00', 'FAILED'),
]

DEMO_USERS = [
    # username, password, is_staff
    ('admin', 'admin12345', True),
    ('viewer', 'viewer12345', False),
]


class Command(BaseCommand):
    help = (
        'Load a small demo portfolio. Everything is created through the same services the API '
        'uses, so balances, holdings and audit logs are consistent. Skips if investors exist.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--with-demo-users',
            action='store_true',
            help="Also create demo logins: admin / admin12345 (staff) and viewer / viewer12345 (read only).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['with_demo_users']:
            self.create_demo_users()

        if Investor.objects.exists():
            self.stdout.write('Investors already exist - sample data skipped.')
            return

        investors = {
            email: Investor.objects.create(full_name=name, email=email, phone_number=phone)
            for name, email, phone in INVESTORS
        }
        accounts = {
            number: Account.objects.create(
                investor=investors[email], account_number=number, account_type=account_type
            )
            for email, number, account_type in ACCOUNTS
        }
        stocks = {
            symbol: Stock.objects.create(symbol=symbol, company_name=name, current_price=Decimal(price))
            for symbol, name, price in STOCKS
        }

        for number, kind, amount, reference, status in TRANSACTIONS:
            TransactionService.create_transaction(
                accounts[number], kind, Decimal(amount), reference, status=status
            )

        for number, symbol, kind, quantity, price, status in ORDERS:
            OrderService.create_order(
                accounts[number], stocks[symbol], kind, quantity, Decimal(price), status=status
            )

        self.stdout.write(self.style.SUCCESS(
            f'Loaded {len(investors)} investors, {len(accounts)} accounts, {len(stocks)} stocks, '
            f'{len(TRANSACTIONS)} transactions and {len(ORDERS)} orders.'
        ))

    def create_demo_users(self):
        User = get_user_model()

        for username, password, is_staff in DEMO_USERS:
            if User.objects.filter(username=username).exists():
                continue

            if is_staff:
                User.objects.create_superuser(username, password=password)
            else:
                User.objects.create_user(username, password=password)

            role = 'staff' if is_staff else 'read-only'
            self.stdout.write(f'Created demo user "{username}" ({role}).')

        if not User.objects.filter(is_staff=True).exists():
            raise CommandError('No staff user exists.')
