# Gallery Backend

This is the Express/PostgreSQL backend for the Gallery application.

## Setup

1. Copy `.env.example` to `.env` and fill in your variables.
2. Run `npm install`.
3. Run `npm run dev` to start the development server.

## Stack

- Node.js & Express
- TypeScript
- PostgreSQL (pg)
- Cloudinary (for image storage)

## Development Instructions

1. **Environment Variables:** Make sure your `.env` file contains `DATABASE_URL` and `JWT_SECRET`.
2. **Migrations:** Run `npm run migrate` to initialize the database tables.
3. **Seed Admin:** Run `npm run seed:admin` to create the default admin user (`admin@example.com` / `Admin123456!`).
4. **Start Server:** Run `npm run dev` to start the backend.

## Testing Login (cURL)

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"Admin123456!\"}"
```

