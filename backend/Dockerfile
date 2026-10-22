# Build from the repository root:  docker build -f backend/Dockerfile .
# The SQL views migration reads ../database/04_create_views.sql, so both folders are copied.
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY database/ /app/database/

RUN chmod +x docker-entrypoint.sh \
    && adduser --disabled-password --no-create-home appuser \
    && chown -R appuser /app
USER appuser

EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]
