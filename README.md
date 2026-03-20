<div align="center">

# 📈 FinTrack Pro

**A full-stack personal finance dashboard built for Indian markets**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

[Live Demo](#) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 📌 Overview

FinTrack Pro is a full-stack personal finance dashboard tailored for Indian users. Track your income and expenses in ₹, set monthly budgets by category, monitor live NSE/BSE stock prices in real time, and get instant alerts when your target price is hit.

> Built as a portfolio project demonstrating MERN stack, JWT authentication with refresh token rotation, real-time WebSockets, REST API design, and data visualization.

---

## ✨ Features

- 🔐 **Auth & JWT** — Register/login with bcrypt, 15-min access tokens + 7-day refresh tokens in httpOnly cookies with rotation and reuse detection
- 💸 **Transactions** — Full CRUD with pagination, type/category filters, payment mode (UPI, Cash, etc.) and MongoDB aggregation for monthly summaries
- 🎯 **Budgets** — Set per-category monthly budgets with real-time progress bars and over-budget alerts
- 📊 **Charts** — Line chart (monthly trend), Doughnut (spending by category), Bar chart (budget vs actual) — all built with Chart.js
- 📈 **Live Portfolio** — Real-time NSE/BSE stock prices via Socket.io + Yahoo Finance, with configurable above/below price alerts
- 🇮🇳 **Indian Market Ready** — INR (₹) formatting, Indian number system (lakhs/crores), NSE tickers, UPI payment modes, Indian expense categories

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Chart.js |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB Atlas, Mongoose ODM |
| Auth | JWT (access + refresh tokens), bcrypt, httpOnly cookies |
| Real-time | Socket.io + Yahoo Finance (NSE/BSE) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
fintrack-pro/
├── server/
│   ├── index.js                  # Express + Socket.io entry point
│   ├── config/db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User schema + watchlist + price alerts
│   │   ├── Transaction.js        # Income/expense records
│   │   └── Budget.js             # Monthly category budgets
│   ├── routes/
│   │   ├── auth.js               # Register, login, refresh, logout
│   │   ├── transactions.js       # CRUD + aggregation pipeline
│   │   ├── budgets.js            # Budget CRUD with actual spend join
│   │   └── portfolio.js          # Watchlist + price alerts
│   ├── middleware/auth.js        # JWT protect middleware
│   └── sockets/priceSocket.js   # NSE/BSE price polling + alert engine
└── client/
    ├── src/
    │   ├── api/axios.js          # Axios instance + auto token refresh interceptor
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Global auth state
    │   │   └── SocketContext.jsx # Live prices + alert state
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # Stats cards + charts
    │   │   ├── Transactions.jsx  # CRUD table with filters
    │   │   ├── Budgets.jsx       # Progress bars + bar chart
    │   │   └── Portfolio.jsx     # Live NSE prices + alert setup
    │   └── components/ui/
    │       ├── Layout.jsx        # Sidebar navigation
    │       └── AlertToast.jsx    # Real-time price alert toasts
    └── index.css                 # Dark finance theme
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local via Compass or cloud via Atlas)
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/pratik-pritam-rout/fintrack-pro.git
cd fintrack-pro
```

**2. Install all dependencies**
```bash
npm run install:all
```

**3. Configure environment variables**
```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in your values:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fintrack
JWT_SECRET=your_long_random_secret_here
JWT_REFRESH_SECRET=another_long_random_secret_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**4. Start the development server**
```bash
# From the root folder — starts both backend and frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> 💡 No API key needed. NSE/BSE prices are fetched free via Yahoo Finance. Outside market hours (9:15 AM – 3:30 PM IST), the app simulates realistic price movements.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login, sets tokens in httpOnly cookies |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `POST` | `/api/auth/logout` | Clear tokens |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | List transactions (paginated + filterable) |
| `POST` | `/api/transactions` | Create a transaction |
| `PUT` | `/api/transactions/:id` | Update a transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `GET` | `/api/transactions/summary` | Aggregated monthly summary |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/budgets` | List budgets with actual spend |
| `POST` | `/api/budgets` | Create or update a budget (upsert) |
| `DELETE` | `/api/budgets/:id` | Delete a budget |

### Portfolio
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/portfolio/watchlist` | Get user's watchlist |
| `POST` | `/api/portfolio/watchlist` | Add ticker to watchlist |
| `DELETE` | `/api/portfolio/watchlist/:ticker` | Remove ticker |
| `GET` | `/api/portfolio/alerts` | Get price alerts |
| `POST` | `/api/portfolio/alerts` | Create a price alert |
| `DELETE` | `/api/portfolio/alerts/:alertId` | Delete a price alert |

### WebSocket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | Client → Server | `userId` |
| `subscribe` | Client → Server | `string[]` tickers |
| `prices_bulk` | Server → Client | `PriceData[]` all prices |
| `price_update` | Server → Client | `PriceData` single ticker |
| `price_alert` | Server → User room | `AlertData` triggered alert |
| `market_status` | Server → Client | `{ open: boolean, exchange: string }` |

---

## 🌐 Deployment

| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend | [Vercel](https://vercel.com) | React app |
| Backend | [Render](https://render.com) | Express + Socket.io |
| Database | [MongoDB Atlas](https://mongodb.com/cloud/atlas) | Cloud database |

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: 5000) |




