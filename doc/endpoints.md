## Mobile API Endpoints

This document describes the HTTP API used to power the dashboard screen shown in Appendix 1.  
All examples assume JSON over HTTPS and a base path of `/api`.

### Conventions

- **Authentication**: Omitted for this assignment (would normally be JWT / OAuth2).
- **IDs**: All `id` fields are strings (UUIDs) matching the DynamoDB `id` attributes.
- **Timestamps**: ISO‑8601 strings in UTC unless otherwise stated.
- **Currency**: Defaults to `SEK` in examples.

---

## 1. Company & Card Context

These endpoints provide the context required to populate the company selector and card‑level dashboard.

### 1.1 `GET /api/companies`

Returns the list of companies that the authenticated user can access (for the top dropdown).

**Query parameters**

- **`limit`** (optional, default `50`): Maximum number of companies to return.
- **`cursor`** (optional): Pagination cursor for fetching more companies.

**Response 200**

```json
{
  "items": [
    {
      "id": "comp_123",
      "name": "Company AB"
    }
  ],
  "nextCursor": null
}
```

Backed by the `companies` table in DynamoDB (`${env}-companies`).

---

### 1.2 `GET /api/companies/:companyId/cards`

Returns the cards for a company. For the current screen we generally expect a **single primary card**, but this keeps the API extensible.

**Path parameters**

- **`companyId`**: The company identifier.

**Response 200**

```json
{
  "items": [
    {
      "id": "card_123",
      "companyId": "comp_123",
      "maskedNumber": "•••• •••• •••• 1234",
      "brand": "Visa",
      "status": "ACTIVE",
      "cardImageUrl": "https://cdn.example.com/cards/card_123.png"
    }
  ]
}
```

Backed by the `cards` table (`${env}-cards`) using the `companyId` GSI.

---

## 2. Dashboard Summary (single call for the screen)

The main dashboard view should be powered by a **single optimized endpoint** that aggregates invoice, limits, remaining spend and latest transactions.

### 2.1 `GET /api/companies/:companyId/cards/:cardId/summary`

Returns the complete data needed to render the dashboard for a specific card.

**Path parameters**

- **`companyId`**: The company identifier (validated against the card).
- **`cardId`**: The card identifier.

**Response 200**

```json
{
  "company": {
    "id": "comp_123",
    "name": "Company AB"
  },
  "card": {
    "id": "card_123",
    "status": "ACTIVE",
    "maskedNumber": "•••• •••• •••• 1234",
    "brand": "Visa",
    "cardImageUrl": "https://cdn.example.com/cards/card_123.png"
  },
  "invoice": {
    "id": "inv_456",
    "status": "DUE_SOON",
    "dueDate": "2024-03-31",
    "amountDue": 5400,
    "currency": "SEK"
  },
  "spend": {
    "usedAmount": 5400,
    "limitAmount": 10000,
    "currency": "SEK",
    "remainingAmount": 4600,
    "basedOn": "CARD_LIMIT"
  },
  "latestTransactions": {
    "items": [
      {
        "id": "txn_1",
        "cardId": "card_123",
        "createdAt": "2024-03-01T10:00:00Z",
        "merchant": "Merchant A",
        "description": "Transaction data",
        "amount": 1800,
        "currency": "SEK",
        "category": "GENERAL"
      },
      {
        "id": "txn_2",
        "cardId": "card_123",
        "createdAt": "2024-03-02T13:30:00Z",
        "merchant": "Merchant B",
        "description": "Transaction data",
        "amount": 2000,
        "currency": "SEK",
        "category": "GENERAL"
      },
      {
        "id": "txn_3",
        "cardId": "card_123",
        "createdAt": "2024-03-03T09:15:00Z",
        "merchant": "Merchant C",
        "description": "Transaction data",
        "amount": 1600,
        "currency": "SEK",
        "category": "GENERAL"
      }
    ],
    "totalCount": 57
  }
}
```

**Data sources**

- `company` from `${env}-companies`.
- `card` from `${env}-cards`.
- `invoice` from `${env}-invoices` (GSI on `cardId` + `dueDate` for latest open invoice).
- `spend` from aggregation of `${env}-transactions` for this card + configured limit (either on card or invoice).
- `latestTransactions` from `${env}-transactions` using the `cardId-createdAt-index` (descending).

**Errors**

- `404` if `company` or `card` not found or not related.

---

## 3. Transactions

### 3.1 `GET /api/cards/:cardId/transactions`

Paginated list of all transactions for the “54 more items in transaction view” navigation.

**Path parameters**

- **`cardId`**: The card identifier.

**Query parameters**

- **`limit`** (optional, default `20`, max `100`): Page size.
- **`cursor`** (optional): Pagination cursor (`LastEvaluatedKey` encoded from DynamoDB).
- **`from`** (optional): ISO timestamp lower bound.
- **`to`** (optional): ISO timestamp upper bound.

**Response 200**

```json
{
  "items": [
    {
      "id": "txn_1",
      "cardId": "card_123",
      "createdAt": "2024-03-01T10:00:00Z",
      "merchant": "Merchant A",
      "description": "Transaction data",
      "amount": 1800,
      "currency": "SEK",
      "category": "GENERAL"
    }
  ],
  "nextCursor": "eyJjYXJkSWQiOiAiY2FyZF8xMjMiLCAiY3JlYXRlZEF0IjogMTcwOTI4MDAwMH0="
}
```

Backed by `${env}-transactions` using the `cardId-createdAt-index`.

---

## 4. Card Actions

These endpoints support the actions reflected in the bottom buttons of the screen.

### 4.1 `POST /api/cards/:cardId/activate`

Activates a card. For this assignment we assume instant activation with minimal validation.

**Path parameters**

- **`cardId`**: The card identifier.

**Request body**

```json
{}
```

*(No body required for this simple flow; in a real system you might pass a verification token or 2FA.)*

**Response 200**

```json
{
  "card": {
    "id": "card_123",
    "status": "ACTIVE"
  }
}
```

**Errors**

- `400` if card is already active or cannot transition from current state.
- `404` if card not found.

---

## 5. Support

### 5.1 `GET /api/support/contact`

Provides contact options and metadata for “Contact Qred’s support”.

**Response 200**

```json
{
  "phone": "+46-8-123-456",
  "email": "support@example.com",
  "chatUrl": "https://example.com/support/chat",
  "openingHours": "Mon–Fri 09:00–17:00 CET"
}
```

---

## 6. Error Format

All non‑2xx responses follow a consistent error envelope:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Company not found",
    "details": null
  }
}
```

This keeps frontend error handling predictable and easy to extend.


