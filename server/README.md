# Server (Express + Mongoose)

Quick start:

1. Copy `.env.example` → `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies:

```bash
cd server
npm install
```

3. Start in dev mode:

```bash
npm run dev
```

API endpoints (examples):

- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login, get JWT
- Protected endpoints (require `Authorization: Bearer <token>`):
  - `GET /api/invoices`
  - `POST /api/invoices`
  - `DELETE /api/invoices/:id`
