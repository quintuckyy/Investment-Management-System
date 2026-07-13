# Investment Database System

A full-stack database-focused application for managing investors, accounts, stocks, transactions, buy/sell orders, portfolio holdings, reports, validation checks, audit logs, and CSV transaction imports.

This project demonstrates database development skills using PostgreSQL, Django REST Framework, SQL views, ETL processing, data validation, and React TypeScript.

## Tech Stack

- PostgreSQL
- SQL
- Django REST Framework
- Python
- React
- TypeScript
- Tailwind CSS
- Axios
- React Router

## Features

- Investor, account, stock, transaction, order, and portfolio management
- Deposit and withdrawal processing with account balance updates
- BUY and SELL order processing with portfolio holding updates
- SQL views and report endpoints
- Data validation endpoints for duplicate transactions, failed records, and missing relationships
- CSV import / ETL for transaction records
- Audit log tracking
- React dashboard and admin-style frontend pages

## Database Tables

- investors
- accounts
- stocks
- transactions
- orders
- portfolio_holdings
- audit_logs

## Main API Endpoints

### Resources

- `/api/investors/`
- `/api/accounts/`
- `/api/stocks/`
- `/api/transactions/`
- `/api/orders/`
- `/api/portfolio-holdings/`
- `/api/audit-logs/`

### Custom Endpoints

- `POST /api/transactions/create/`
- `POST /api/orders/create/`
- `POST /api/etl/import-transactions/`

### Reports

- `/api/reports/account-summary/`
- `/api/reports/transaction-summary/`
- `/api/reports/deposit-withdrawal-summary/`
- `/api/reports/portfolio-summary/`
- `/api/reports/pending-orders/`
- `/api/reports/failed-transactions/`

### Data Validation

- `/api/validation/duplicate-transactions/`
- `/api/validation/negative-balances/`
- `/api/validation/transaction-status/`
- `/api/validation/order-status/`
- `/api/validation/accounts-without-transactions/`
- `/api/validation/investors-without-accounts/`

## Frontend Pages

- Dashboard
- Investors
- Accounts
- Stocks
- Transactions
- Orders
- Portfolio
- Reports
- Data Validation
- Audit Logs
- CSV Import

## Setup Instructions

### Database

## Create a PostgreSQL database named:

investment_db

## Run the SQL scripts inside the database/ folder in this order:

- 01_create_tables.sql
- 02_insert_sample_data.sql
- 03_create_indexes.sql
- 04_create_views.sql
- 05_reports.sql
- 06_data_validation.sql

## Backend

- cd backend
- python -m venv venv
- venv\Scripts\activate
- pip install -r requirements.txt
- python manage.py runserver

## Create a .env file inside the backend/ folder:

SECRET_KEY=your_django_secret_key
DEBUG=True
DB_NAME=investment_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=127.0.0.1
DB_PORT=1234

## Update DB_PORT based on your PostgreSQL setup.

- Frontend
- cd frontend
- npm install
- npm run dev

## Frontend URL:

http://localhost:5173/

## Backend URL:

http://127.0.0.1:8000/api/


## Future Improvements

- Authentication and role-based access
- Pagination and search filters
- Export reports to CSV
- Unit tests
- Docker setup
- Dashboard charts