#!/bin/sh
set -e

# Create / update the schema (tables, constraints and SQL views) from the migrations.
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Optional demo data and demo logins for evaluating the project. Never enable in production.
if [ "$SEED_SAMPLE_DATA" = "true" ]; then
    python manage.py seed_sample_data --with-demo-users
fi

exec gunicorn investment_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${WEB_CONCURRENCY:-3}" \
    --access-logfile -
