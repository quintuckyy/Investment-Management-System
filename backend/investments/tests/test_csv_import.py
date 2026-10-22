from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile

from investments.models import Transaction

from .base import BaseAPITestCase

HEADER = 'account_id,transaction_type,amount,reference_number,status\n'


class ImportTransactionsCSVTests(BaseAPITestCase):
    URL = '/api/etl/import-transactions/'

    def setUp(self):
        self.as_staff()

    def upload(self, content, name='transactions.csv'):
        if isinstance(content, str):
            content = content.encode('utf-8')

        return self.client.post(
            self.URL,
            {'file': SimpleUploadedFile(name, content, content_type='text/csv')},
            format='multipart',
        )

    # ---- happy path

    def test_valid_file_is_fully_imported(self):
        response = self.upload(
            HEADER
            + f'{self.account.id},DEPOSIT,500.00,CSV-1,COMPLETED\n'
            + f'{self.account.id},WITHDRAWAL,200.00,CSV-2,COMPLETED\n'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_rows'], 2)
        self.assertEqual(response.data['imported_rows'], 2)
        self.assertEqual(response.data['failed_rows'], 0)
        self.assertEqual(self.balance_of(self.account), Decimal('1300.00'))

    def test_excel_style_bom_whitespace_case_and_blank_status_are_tolerated(self):
        response = self.upload(
            '﻿ account_id , transaction_type ,amount,reference_number,status\n'
            f' {self.account.id} ,deposit, 50.00 , CSV-BOM ,\n'
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['imported_rows'], 1)
        self.assertEqual(Transaction.objects.get().status, 'COMPLETED')

    def test_blank_lines_are_ignored(self):
        response = self.upload(HEADER + f'{self.account.id},DEPOSIT,5,CSV-1,COMPLETED\n\n\n')

        self.assertEqual(response.data['total_rows'], 1)
        self.assertEqual(response.data['failed_rows'], 0)

    # ---- bad rows: valid rows still import, bad rows are reported with their line number

    def test_bad_rows_are_reported_and_good_rows_still_import(self):
        response = self.upload(
            HEADER
            + f'{self.account.id},DEPOSIT,100.00,CSV-OK,COMPLETED\n'
            + f'{self.account.id},DEPOSIT,abc,CSV-BAD-AMOUNT,COMPLETED\n'
            + f'{self.account.id},TRANSFER,100.00,CSV-BAD-TYPE,COMPLETED\n'
            + f'{self.account.id},DEPOSIT,-5,CSV-NEGATIVE,COMPLETED\n'
            + '999999,DEPOSIT,100.00,CSV-NO-ACCOUNT,COMPLETED\n'
            + f'{self.account.id},WITHDRAWAL,99999.00,CSV-OVERDRAFT,COMPLETED\n'
            + f'{self.account.id},DEPOSIT,100.00,CSV-OK,COMPLETED\n'
            + f'{self.account.id},DEPOSIT,100.00,CSV-BAD-STATUS,DONE\n'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_rows'], 8)
        self.assertEqual(response.data['imported_rows'], 1)
        self.assertEqual(response.data['failed_rows'], 7)

        errors = {item['row']: item for item in response.data['errors']}
        self.assertEqual(sorted(errors), [3, 4, 5, 6, 7, 8, 9])
        self.assertIn('not a valid amount', errors[3]['error'])
        self.assertIn('not a valid transaction type', errors[4]['error'])
        self.assertIn('greater than', errors[5]['error'])
        self.assertIn('No account found', errors[6]['error'])
        self.assertIn('exceeds the available balance', errors[7]['error'])
        self.assertIn('already exists', errors[8]['error'])
        self.assertIn('not a valid status', errors[9]['error'])

        self.assertEqual(Transaction.objects.count(), 1)
        self.assertEqual(self.balance_of(self.account), Decimal('1100.00'))

    def test_rows_with_missing_values_are_reported(self):
        response = self.upload(
            HEADER
            + f'{self.account.id},DEPOSIT,,CSV-NO-AMOUNT,COMPLETED\n'
            + ',DEPOSIT,10,CSV-NO-ACCOUNT,COMPLETED\n'
            + f'{self.account.id},DEPOSIT\n'  # row cut short: trailing columns missing entirely
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['failed_rows'], 3)
        self.assertTrue(all('missing' in item['error'] for item in response.data['errors']))

    def test_rows_with_extra_columns_do_not_crash(self):
        response = self.upload(HEADER + f'{self.account.id},DEPOSIT,10,CSV-EXTRA,COMPLETED,unexpected,values\n')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['imported_rows'], 1)

    def test_quoted_values_with_commas_are_parsed(self):
        response = self.upload(HEADER + f'{self.account.id},DEPOSIT,10,"CSV,COMMA",COMPLETED\n')

        self.assertEqual(response.data['imported_rows'], 1)
        self.assertTrue(Transaction.objects.filter(reference_number='CSV,COMMA').exists())

    def test_reimporting_the_same_file_rejects_every_row_as_duplicate(self):
        content = HEADER + f'{self.account.id},DEPOSIT,100,CSV-1,COMPLETED\n'

        self.upload(content)
        response = self.upload(content)

        self.assertEqual(response.data['imported_rows'], 0)
        self.assertEqual(response.data['failed_rows'], 1)
        self.assertEqual(self.balance_of(self.account), Decimal('1100.00'))

    # ---- wrong format: the whole file is rejected with a 400 and nothing is imported

    def test_missing_columns_are_named_in_the_error(self):
        response = self.upload('account_id,amount\n1,10\n')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data['missing_columns'],
            ['transaction_type', 'reference_number', 'status'],
        )
        self.assertEqual(response.data['required_columns'][0], 'account_id')
        self.assertIn('Missing column', response.data['error'])
        self.assertEqual(Transaction.objects.count(), 0)

    def test_empty_file_returns_400_not_500(self):
        response = self.upload('')

        self.assertEqual(response.status_code, 400)
        self.assertIn('empty', response.data['error'])

    def test_header_only_file_imports_nothing(self):
        response = self.upload(HEADER)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_rows'], 0)

    def test_binary_file_returns_400_not_500(self):
        response = self.upload(b'\xff\xfe\x00\x01\x80\x81binary', name='data.csv')

        self.assertEqual(response.status_code, 400)
        self.assertIn('UTF-8', response.data['error'])

    def test_non_csv_extension_is_rejected(self):
        response = self.upload(HEADER, name='transactions.txt')

        self.assertEqual(response.status_code, 400)
        self.assertIn('Only CSV', response.data['error'])

    def test_missing_file_is_rejected(self):
        response = self.client.post(self.URL, {}, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('required', response.data['error'])

    def test_oversized_file_is_rejected(self):
        response = self.upload(HEADER + ('1,DEPOSIT,1,X,COMPLETED\n' * 300_000))

        self.assertEqual(response.status_code, 400)
        self.assertIn('too large', response.data['error'])

    # ---- access control

    def test_viewer_cannot_import(self):
        self.as_viewer()
        self.assertEqual(self.upload(HEADER).status_code, 403)

    def test_anonymous_cannot_import(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.upload(HEADER).status_code, 401)
