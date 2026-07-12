# Investment Database System

A full-stack database-focused application for managing investors, investment accounts, deposits, withdrawals, stock orders, portfolio holdings, audit logs, SQL reports, data validation checks, and CSV transaction imports.

This project is designed to demonstrate database development skills using PostgreSQL, Django REST Framework, SQL views, reporting queries, validation scripts, and ETL processing.

## Tech Stack

- PostgreSQL
- Django
- Django REST Framework
- Python
- SQL
- React TypeScript 
- Tailwind CSS 

## Main Features

### Database Design

- Designed relational database tables for investors, accounts, stocks, transactions, orders, portfolio holdings, and audit logs
- Added primary keys, foreign keys, unique constraints, check constraints, and timestamps
- Created indexes for commonly queried fields to support performance tuning

### REST API

- Investor management
- Account management
- Stock management
- Transaction management
- Order management
- Portfolio holdings management
- Audit log tracking

### Transaction Processing

- Create deposit transactions
- Create withdrawal transactions
- Automatically update account balances
- Prevent withdrawals greater than the available account balance
- Prevent duplicate transaction reference numbers
- Create audit logs for transaction activity

### Order Processing

- Create BUY orders
- Create SELL orders
- Automatically update account balances
- Automatically update portfolio holdings
- Prevent buy orders when account balance is insufficient
- Prevent sell orders when the account does not own enough shares
- Create audit logs for order activity

### SQL Reports

- Account balance summary
- Transaction summary
- Deposit and withdrawal summary
- Portfolio value summary
- Pending orders report
- Failed transactions report

### Data Validation

- Duplicate transaction reference check
- Negative account balance check
- Pending and failed transaction check
- Pending, failed, and cancelled order check
- Accounts without transactions
- Investors without accounts

### CSV Import / ETL

- Import transaction data from CSV
- Validate each row before inserting
- Reject invalid rows with row-level error messages
- Detect invalid amount, duplicate reference number, missing account, invalid transaction type, and invalid status
- Automatically update account balances for completed imported transactions
- Create audit logs for imported transactions

## Database Tables

The system uses the following PostgreSQL tables:

```text
investors
accounts
stocks
transactions
orders
portfolio_holdings
audit_logs