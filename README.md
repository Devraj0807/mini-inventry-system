# Mini Inventory Backend

A production-quality Node.js/Express REST API implementing the **Mini Inventory System** spec.

## Stack
- **Runtime:** Node.js
- **Framework:** Express 4
- **Database:** SQLite (via `better-sqlite3` — synchronous, zero-config)
- **Validation:** Zod

## Project Structure

```
mini-inventory-backend/
├── src/
│   ├── index.js                        # App entry point & server bootstrap
│   ├── db/
│   │   ├── database.js                 # DB connection + schema init
│   │   └── seed.js                     # Sample data seed (runs on startup)
│   ├── routes/
│   │   ├── products.routes.js
│   │   ├── inventory.routes.js
│   │   └── reports.routes.js
│   ├── controllers/
│   │   ├── products.controller.js      # CRUD for products
│   │   ├── inventory.controller.js     # Stock IN/OUT movement
│   │   └── reports.controller.js      # Summary KPIs & low-stock alert
│   └── middleware/
│       └── errorHandler.js            # Global error + 404 handler
├── package.json
└── README.md
```

## Setup & Run

```bash
# Install dependencies
npm install

# Start development server (auto-restarts on save)
npm run dev

# Or start production server
npm start
```

The DB file (`inventory.db`) is created automatically in the project root on first run, and seeded with 6 sample products.

## API Endpoints

| Method | Path                       | Description                        |
|--------|----------------------------|------------------------------------|
| GET    | `/api/products`            | List products (search/filter)      |
| POST   | `/api/products`            | Create new product                 |
| GET    | `/api/products/:id`        | Get product + recent movements     |
| PUT    | `/api/products/:id`        | Update product metadata            |
| DELETE | `/api/products/:id`        | Delete product + all history       |
| POST   | `/api/inventory/movement`  | Stock IN / OUT adjustment          |
| GET    | `/api/reports/summary`     | Dashboard KPIs                     |
| GET    | `/api/reports/low-stock`   | Products at or below alert level   |

## Query Parameters for `GET /api/products`

| Param      | Values                                          |
|------------|-------------------------------------------------|
| `search`   | Any string — matches name or SKU               |
| `category` | Category name (case-insensitive)                |
| `status`   | `all` \| `in_stock` \| `low_stock` \| `out_of_stock` |

## Example Requests

```bash
# Get all low-stock products
curl http://localhost:3000/api/products?status=low_stock

# Create a product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"sku":"AUDIO-501","name":"Sony WH-1000XM5","category":"Audio","unitPrice":399,"initialQuantity":10,"minStockLevel":4}'

# Stock OUT
curl -X POST http://localhost:3000/api/inventory/movement \
  -H "Content-Type: application/json" \
  -d '{"productId":2,"type":"OUT","quantity":2,"reason":"Customer Store Sale #8812"}'

# Dashboard summary
curl http://localhost:3000/api/reports/summary
```
