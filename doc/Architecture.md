**TODO**
- Authentication
- Company selection
- Card overview
- Invoice status
- Remaining spend (limit tracking)
- Transactions list + pagination
- Card activation
- Support contact
- Navigation/meta configuration (optional)

-------------------------------

### Routes

**2.1 Authentication**
POST /auth/login

Authenticate user and return JWT.

POST /auth/refresh

Refresh access token.

POST /auth/logout

Invalidate session/token.

----------------
2.2 User & Company Context
GET /users/me

Returns:

{
  "id": "user_id",
  "name": "John Doe",
  "companies": [
    { "id": "company_ab", "name": "Company AB" }
  ],
  "activeCompanyId": "company_ab"
}

-------------------------

2.3 Card Overview (Main Card Block)
GET /companies/:companyId/cards

Returns list of cards for selected company.

GET /cards/:cardId

Card summary:

{
  "id": "card_id",
  "status": "active | inactive | blocked",
  "invoiceDue": {
    "amount": 5400,
    "currency": "SEK",
    "dueDate": "2026-03-01"
  },
  "spendingLimit": 10000,
  "remainingSpend": 5400
}

-----------------------

2.4 Invoice
GET /cards/:cardId/invoice

Returns invoice summary.

GET /cards/:cardId/invoice/history

Past invoices.