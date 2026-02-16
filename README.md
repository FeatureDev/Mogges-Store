# Mogges Store - E-commerce Platform

En modern serverless e-handelsbutik byggd med Cloudflare Workers och GitHub Pages.

🌐 **Live:** [mogges-store.se](https://www.mogges-store.se)
🔗 **API:** [api.mogges-store.se](https://api.mogges-store.se/api)

---

## 🏗️ Arkitektur

| Komponent | Tjänst | Teknik |
|---|---|---|
| **Frontend** | GitHub Pages | HTML, CSS, vanilla JS |
| **Backend API** | Cloudflare Workers | Hono (TypeScript) |
| **Databas** | Cloudflare D1 | SQLite |
| **AI Chatbot** | Cloudflare Workers AI | Llama 3.1 8B |
| **Domän** | Cloudflare DNS | mogges-store.se |

---

## 📁 Projektstruktur

```
Node_android_project/
├── docs/                    ← Frontend → GitHub Pages (mogges-store.se)
│   ├── index.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   ├── about.html
│   ├── login.html
│   ├── admin.html
│   ├── css/
│   │   ├── index.css
│   │   ├── products.css
│   │   ├── checkout.css
│   │   ├── admin.css
│   │   ├── about.css
│   │   └── chat.css
│   ├── js/
│   │   ├── config.js
│   │   ├── products.js
│   │   ├── cart-common.js
│   │   ├── checkout.js
│   │   ├── login.js
│   │   ├── admin.js
│   │   ├── about.js
│   │   └── chat.js
│   └── picture/
│
├── mogges-store-api/        ← Backend → Cloudflare Workers (api.mogges-store.se)
│   ├── src/
│   │   └── index.ts        # Hela API:n (Hono)
│   ├── wrangler.jsonc       # Cloudflare Workers config
│   ├── package.json
│   └── tsconfig.json
│
├── config/                  ← SQL-scheman (referens)
│   ├── schema.sql
│   ├── seed-orders.sql
│   └── seed-users.sql
│
├── .gitignore
├── package.json
└── README.md
```

---

## ✨ Features

- 🛍️ **Produktkatalog** med kategorier, sök och prisfilter
- 🛒 **Varukorg** med localStorage + serversynk för inloggade
- 💳 **Checkout** med Swish QR-kod
- 🤖 **AI Chatbot "Mogge"** — shoppingassistent med produktnavigering
- 🔐 **JWT-autentisering** med rollsystem (master/admin/employee/user)
- 👨‍💼 **Admin Panel** — produkter, användare, ordrar
- 📱 **Responsive Design** för mobil och desktop
- 🚀 **Serverless** — ingen server att underhålla

---

## 🤖 Chatbot "Mogge"

AI-driven shoppingassistent som kan:
- Svara på frågor om produkter, frakt och returer
- Navigera till produkter: `"visa skor"`, `"sol"`, `"kappa"`
- Filtrera på pris: `"under 500"`, `">1000"`, `"500+"`
- Minns konversationen mellan sidbyten (sessionStorage)
- Visar snabbknappar: Nyheter, Frakt, Tips, Retur

---

## 🔐 Rollsystem

| Roll | Behörighet |
|---|---|
| **master** | Allt + hantera admins |
| **admin** | Produkter, användare, ordrar |
| **employee** | Visa ordrar |
| **user** | Handla, varukorg |

---

## 🚀 Deploy

### Backend (Cloudflare Workers)

```bash
cd mogges-store-api
npm install
npx wrangler deploy
```

### Frontend (GitHub Pages)

Push till `main` → GitHub Pages deployas automatiskt från `/docs`.

### Databas (Cloudflare D1)

```bash
# Skapa schema
npx wrangler d1 execute mogges-store-db --remote --file=../config/schema.sql

# Seed data
npx wrangler d1 execute mogges-store-db --remote --file=../config/seed-users.sql
```

---

## 🔧 Lokal Utveckling

```bash
# Backend
cd mogges-store-api
npm install
npx wrangler dev

# Frontend — öppna docs/ med Live Server (port 5500)
```

Ändra `docs/js/config.js` till `MODE: 'local'` för lokal utveckling.

---

## 📡 API Endpoints

| Metod | Endpoint | Auth | Beskrivning |
|---|---|---|---|
| GET | `/api/products` | — | Alla produkter |
| POST | `/api/login` | — | Logga in |
| POST | `/api/register` | — | Registrera konto |
| GET | `/api/check-auth` | JWT | Kolla inloggning |
| GET | `/api/cart` | JWT | Hämta varukorg |
| POST | `/api/cart` | JWT | Uppdatera varukorg |
| POST | `/api/cart/sync` | JWT | Synka lokal varukorg |
| DELETE | `/api/cart/:id` | JWT | Ta bort vara |
| GET | `/api/orders` | employee+ | Alla ordrar |
| PUT | `/api/orders/:id/status` | admin+ | Ändra orderstatus |
| POST | `/api/products` | admin+ | Skapa produkt |
| PUT | `/api/products/:id` | admin+ | Uppdatera produkt |
| DELETE | `/api/products/:id` | admin+ | Ta bort produkt |
| GET | `/api/users` | admin+ | Alla användare |
| POST | `/api/admin/create-user` | admin+ | Skapa användare |
| PUT | `/api/admin/update-role` | master | Ändra roll |
| DELETE | `/api/admin/delete-user/:id` | master | Ta bort användare |
| POST | `/api/chat` | — | AI chatbot |

---

## 📜 License

ISC

## 👨‍💻 Author

Mogges Store Development Team
