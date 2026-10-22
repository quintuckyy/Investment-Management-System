from decimal import Decimal, InvalidOperation

from django.db import connection
from rest_framework.exceptions import ValidationError

MAX_AMOUNT_DIGITS = 15
MAX_DECIMAL_PLACES = 2


def extract_error_message(error):
    """Pull a single human-readable string out of a DRF ValidationError.

    str(ValidationError(...)) renders as "[ErrorDetail(string='...', code='...')]",
    which is not something to show a user - this unwraps it to the plain message.
    """
    detail = error.detail

    if isinstance(detail, list):
        return str(detail[0]) if detail else "Invalid input."

    if isinstance(detail, dict):
        first_value = next(iter(detail.values()), None)
        if isinstance(first_value, list) and first_value:
            return str(first_value[0])
        return str(first_value) if first_value is not None else "Invalid input."

    return str(detail)


def parse_amount(value):
    """Convert user input to a Decimal money amount, or raise a ValidationError."""
    try:
        amount = Decimal(str(value).strip())
    except InvalidOperation:
        raise ValidationError(f"'{value}' is not a valid amount.")

    if not amount.is_finite():
        raise ValidationError(f"'{value}' is not a valid amount.")

    if amount.as_tuple().exponent < -MAX_DECIMAL_PLACES:
        raise ValidationError(f"Amount '{value}' can have at most {MAX_DECIMAL_PLACES} decimal places.")

    if len(amount.as_tuple().digits) > MAX_AMOUNT_DIGITS:
        raise ValidationError(f"Amount '{value}' is too large.")

    return amount


def dict_fetch_all(cursor):
    columns = [col[0] for col in cursor.description]

    return [
        dict(zip(columns, row, strict=True))
        for row in cursor.fetchall()
    ]


def run_query(sql):
    """Run a read-only SQL query and return the rows as a list of dicts."""
    with connection.cursor() as cursor:
        cursor.execute(sql)
        return dict_fetch_all(cursor)
