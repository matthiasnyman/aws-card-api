## High‑level architecture

The mobile dashboard backend is a small, focused Node.js/TypeScript service that
exposes an HTTP API used by the mobile app and runs as an AWS Lambda behind API
Gateway.

- **Runtime**: Express 5 app wrapped with `@vendia/serverless-express` and
  deployed as a single Lambda function (`dist/lambda.handler`).
- **Data store**: DynamoDB tables for `users`, `companies`, `cards`,
  `transactions` and `invoices`, each with purpose‑built GSIs for the access
  patterns used by the screen (e.g. `cardId-createdAt-index`,
  `cardId-dueDate-index`, `companyId-index`).
- **Layers**:
  - **Routes (`src/index.ts`)**: Thin HTTP layer, maps paths to use‑cases and
    normalises responses/errors.
  - **Services (`src/services`)**: Aggregates data across repositories and
    shapes it into DTOs optimised for the mobile UI (for example
    `getCardSummary`).
  - **Repositories (`src/repositories`)**: Encapsulate DynamoDB access using
    the DocumentClient, one repository per aggregate (`cards`, `transactions`,
    `invoices`, `companies`).
  - **DTOs (`src/dto`)**: Explicit response contracts used both in the service
    layer and documentation.

This separation lets frontend and backend iterate in parallel: once a DTO and
endpoint are agreed, the frontend can mock the contract while the repositories
and infra are still being wired up.

## Collaboration model (Task 1 perspective)

To address the problems in the case description, the service is designed and
documented **API‑first**:

- **Contract‑driven design**: `doc/endpoints.md` describes every endpoint,
  request/response payload and error envelope. This is the source of truth for
  frontend developers and Product Managers, and can easily be turned into
  OpenAPI or shared examples in tools like Postman.
- **Single screen endpoint**: The main dashboard uses
  `GET /api/companies/:companyId/cards/:cardId/summary`, which returns all data
  the screen needs (company, card, invoice, spend, latest transactions). This
  minimises over‑the‑wire calls and gives a very clear contract for the mobile
  team.
- **Mockable locally**: `src/seed.ts` plus the DynamoDB schema allows anyone to
  spin up a realistic local/dev environment with one command, so the frontend
  can point to a stable demo backend long before production integration.
- **Clear error model**: All non‑2xx responses share one error envelope, which
  keeps frontend error handling simple and predictable.

### Relation to Qred's values

- **Transparency**: Contracts, error format and data model are documented in
  `doc/endpoints.md` and `infra/database.yaml`. This makes it clear to both
  product and frontend what is actually available to build on, and where the
  constraints are.
- **Innovation**: An API‑first approach and a single summary endpoint make it
  easy to generate client SDKs, spin up mock servers and run experiments in the
  mobile app without needing backend changes for every test.
- **Passion**: A focus on developer experience – a simple `npm run dev` for
  local development, a seed script that provides realistic data and clear error
  messages – shows care for colleagues and helps the team deliver value
  together faster.
