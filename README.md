# Cuba E-Commerce MVP Prototype

Minimal working e-commerce prototype: browse products, add to cart, checkout (mock payment), track orders by code, admin manages products and orders.

## Quick Start (Docker)

```bash
cd cuba-platform
docker compose up --build
```

Open http://localhost:3000 in your browser.

The backend auto-creates database tables and seeds 10 demo products + 1 admin user on first startup.

## Demo Credentials

- **Admin:** admin@cuba.com / admin123
- **Customer:** Register any email at /login

## Run Without Docker (Development)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15 running locally

### Backend
```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL in environment or .env
python seed.py          # Create tables + seed data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000 with proxy to :8000
```

## Tech Stack

- **Backend:** FastAPI (single monolith), SQLAlchemy async, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Infra:** Docker Compose (postgres + backend + frontend/nginx)

## Project Structure

```
cuba-platform/
├── docker-compose.yml
├── .env
├── backend/
│   ├── main.py          # All API endpoints (monolith)
│   ├── models.py        # SQLAlchemy ORM (5 tables)
│   ├── schemas.py       # Pydantic request/response models
│   ├── auth.py          # JWT auth + bcrypt
│   ├── database.py      # Async DB session
│   ├── config.py        # Env settings
│   ├── seed.py          # Demo data seeder
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.tsx      # Router + navbar
    │   ├── api.ts       # API client
    │   ├── store.ts     # Zustand (auth + cart)
    │   └── pages/       # 13 pages (customer + admin)
    ├── nginx.conf
    ├── package.json
    └── Dockerfile
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | Public | Register |
| POST | /auth/login | Public | Login |
| GET | /auth/me | JWT | Current user |
| GET | /api/v1/catalog/products | Public | List products |
| GET | /api/v1/catalog/products/:id | Public | Product detail |
| GET | /api/v1/catalog/categories | Public | Categories |
| POST | /api/v1/catalog/admin/products | Admin | Create product |
| PUT | /api/v1/catalog/admin/products/:id | Admin | Update product |
| DELETE | /api/v1/catalog/admin/products/:id | Admin | Deactivate |
| POST | /api/v1/orders/checkout | Client | Place order (mock pay) |
| GET | /api/v1/orders/mine | Client | My orders |
| GET | /api/v1/orders/:id | Client/Admin | Order detail |
| GET | /api/v1/orders/track/:code | Public | Track by code |
| GET | /api/v1/orders/admin/all | Admin | All orders |
| PUT | /api/v1/orders/admin/:id/status | Admin | Update status |
| GET | /api/v1/admin/stats | Admin | Dashboard stats |
