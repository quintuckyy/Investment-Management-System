from pathlib import Path

from django.db import migrations

# database/04_create_views.sql is the single definition of the reporting views.
# It only uses CREATE OR REPLACE VIEW, so it is safe to run on a database where
# the views were already created by hand with the SQL scripts.
VIEWS_SQL_PATH = Path(__file__).resolve().parents[3] / 'database' / '04_create_views.sql'

VIEW_NAMES = [
    'view_account_summary',
    'view_transaction_summary',
    'view_deposit_withdrawal_summary',
    'view_portfolio_summary',
    'view_order_summary',
]


def create_views(apps, schema_editor):
    schema_editor.execute(VIEWS_SQL_PATH.read_text(encoding='utf-8'))


def drop_views(apps, schema_editor):
    for name in VIEW_NAMES:
        schema_editor.execute(f'DROP VIEW IF EXISTS {name};')


class Migration(migrations.Migration):

    dependencies = [
        ('investments', '0002_data_integrity_constraints'),
    ]

    operations = [
        migrations.RunPython(create_views, drop_views),
    ]
