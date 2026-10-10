# EditDesk — Video Editing Client Portal

**EditDesk** is a full-stack client portal for a freelance video editor. Clients sign up,
place video-edit orders (reels, promos, cinematic cuts, TikToks), track each order through a
production pipeline, chat with the editor on every order, and download the finished files.
The editor (admin) manages all orders, moves them through the pipeline, and posts delivery links.

Built with Node.js + Express + Mongoose on the backend and React (Vite) on the frontend.

## Features

- **Auth with roles** — signed sessions in HttpOnly cookies, CSRF protection, live server-side
  role checks, and bcrypt-hashed passwords.
- **Client**
  - Create orders: title, edit type (reel / promo / cinematic / tiktok / other), description,
    reference links, deadline.
  - Dashboard of my orders with status badges and overdue highlighting.
  - Order detail page with a per-order message thread.
  - Delivery download link appears once the editor delivers.
- **Admin (editor)**
  - Dashboard of *all* orders with status filter (Pending / In Progress / In Review / Delivered).
  - Move orders through the pipeline: Pending → In Progress → In Review → Delivered
    (invalid jumps are rejected with a 422).
  - Post messages on any order, set or change the delivery URL.
- **Messaging** — simple per-order thread (author, text, timestamp), visible to the order's
  client and the admin.

## Tech stack

| Layer    | Tech |
|----------|------|
| Backend  | Node.js, Express 4, Mongoose 8, JWT (jsonwebtoken), bcryptjs, dotenv, cors |
| Frontend | React 18, React Router 6, Axios, Vite 5 (plain JavaScript, no TypeScript) |
| Styling  | Hand-written dark cinematic CSS (`client/src/styles.css`) |
| Database | MongoDB (local `mongod` or MongoDB Atlas) |

Developed with Node **v24.20.0** and npm **10.9.4**.

## Getting started

### 1. Database

Pick one:

- **Local MongoDB** — install and start `mongod` (default URI `mongodb://127.0.0.1:27017/editdesk`).
- **MongoDB Atlas (free)** — create a free cluster at https://www.mongodb.com/atlas,
  create a database user, allow your IP, and copy the connection string. It looks like
  `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/editdesk`.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET (long random string), CLIENT_URL
# Optional local demo data only: set both SEED_*_PASSWORD variables first
npm run seed
npm run dev      # starts the API on http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev      # starts the app on http://localhost:5173
```

In dev, Vite proxies `/api` to the backend, so no extra config is needed. If the API
lives elsewhere, copy `client/.env.example` to `client/.env` and set `VITE_API_URL`.

### Demo accounts (created by `npm run seed`)

The local-only seed command uses passwords supplied through `SEED_ADMIN_PASSWORD` and
`SEED_CLIENT_PASSWORD`. It refuses to run in production and never logs those passwords.

The seed also creates three sample orders (one in each of In Progress, In Review, Delivered)
with a few messages, so both dashboards have something to show immediately.

## API overview

| Method | Endpoint                          | Auth        | Description                              |
|--------|-----------------------------------|-------------|------------------------------------------|
| POST   | /api/auth/register                | public      | Create a client account → `{ token, user }` |
| POST   | /api/auth/login                   | public      | Log in and establish a secure session     |
| GET    | /api/auth/me                      | user        | Current user                             |
| GET    | /api/orders                       | user        | List orders (own for clients; `?status=` filter for admin) |
| POST   | /api/orders                       | user        | Create an order                          |
| GET    | /api/orders/:id                   | owner/admin | Order detail                             |
| PATCH  | /api/orders/:id/status            | admin       | Move status through the pipeline         |
| PATCH  | /api/orders/:id/delivery          | admin       | Set/clear the delivery URL               |
| GET    | /api/orders/:id/messages          | owner/admin | Message thread                           |
| POST   | /api/orders/:id/messages          | owner/admin | Post a message                           |

Errors are JSON: `{ "error": "message" }` with the appropriate HTTP status code.

## Project structure

```
video-client-portal/
├── README.md
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js            # Express app, route mounting, error handling
│       ├── config/db.js        # Mongoose connection
│       ├── models/
│       │   ├── User.js         # name, email, passwordHash, role
│       │   ├── Order.js        # title, type, status, deadline, deliveryUrl, client…
│       │   └── Message.js      # order, author, text
│       ├── middleware/auth.js  # authRequired, loadUser, requireRole
│       ├── routes/
│       │   ├── auth.js         # register / login / me
│       │   ├── orders.js       # CRUD + status + delivery
│       │   └── messages.js     # per-order message thread
│       └── seed.js             # demo users, orders, messages
└── client/
    ├── package.json
    ├── vite.config.js          # dev proxy /api → localhost:5000
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx             # React entry
        ├── App.jsx              # routes
        ├── api.js               # axios instance + JWT interceptor
        ├── utils.js             # type labels, status flow, date formatting
        ├── styles.css           # dark cinematic theme
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── OrderCard.jsx
        │   ├── StatusBadge.jsx
        │   ├── MessageThread.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── ClientDashboard.jsx
            ├── AdminDashboard.jsx
            ├── NewOrder.jsx
            └── OrderDetail.jsx
```

## Notes

- `npm install` has intentionally not been run; install dependencies yourself first.
- The seed script wipes the database before seeding — only run it on a dev database.
- Never run the seed command against a shared or production database.
