# 📦 Mini Inventory System

A full-stack inventory management web app built for a college hackathon.

**Team:** Devraj Mahur · Yash Bhardwaj · Abhay Raj

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Database | SQLite (sql.js — no installation needed) |

---

## 🚀 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or above
- Git

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Devraj0807/mini-inventry-system.git
cd mini-inventry-system
```

---

### Step 2 — Install Backend Dependencies

```bash
npm install
```

---

### Step 3 — Install Frontend Dependencies

```bash
cd inventory-frontend
npm install
cd ..
```

---

### Step 4 — Run the Backend (Terminal 1)

```bash
node src/index.js
```

> Server starts at **http://localhost:3000**
> Database is created and seeded automatically on first run.

---

### Step 5 — Run the Frontend (Terminal 2)

```bash
cd inventory-frontend
npm run dev
```

> App opens at **http://localhost:5173**

---

## ✨ Features

- 📋 **Product Management** — Add, Edit, Delete products with full validation
- 📦 **Stock In / Out** — Adjust stock with reason tracking and full audit trail
- 🔔 **Low Stock Alerts** — Notification bell in navbar shows real-time alerts
- 📊 **Dashboard / Reports** — KPI cards, bar charts, pie chart, recent transactions
- 🌙 **Dark Mode** — Toggle between light and dark theme (saved in browser)
- 💰 **Indian Rupee (₹)** — All prices in INR with Indian number formatting

---

## 📁 Project Structure

```
mini-inventory-system/
├── src/
│   ├── index.js                  # Express server entry point
│   ├── db/
│   │   ├── database.js           # sql.js SQLite wrapper
│   │   └── seed.js               # Sample product data (auto-runs on first start)
│   ├── controllers/              # Business logic
│   ├── routes/                   # API route definitions
│   └── middleware/               # Error handlers
├── inventory-frontend/
│   ├── src/
│   │   ├── App.jsx               # Navbar, routing, dark mode, notification bell
│   │   ├── pages/
│   │   │   ├── ProductsPage.jsx  # Product table with CRUD
│   │   │   └── ReportPage.jsx    # Dashboard with charts
│   │   ├── components/           # Modal, StockModal, Toast, etc.
│   │   └── api.js                # REST API client
│   └── vite.config.js            # Proxy /api → localhost:3000
├── inventory-system-specs/       # Project specification docs
└── test.js                       # Backend integration tests (15 tests)
```

---

## 🧪 Run Backend Tests

```bash
node test.js
```

All 15 integration tests should pass ✅
