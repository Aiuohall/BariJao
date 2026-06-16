# BariJao — Safe Eid Ticket Exchange 🎟️

> A community marketplace to safely **buy and resell travel tickets** in Bangladesh.

🔗 **Live app:** https://barijao.onrender.com

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## 👋 About this project

Hi, I'm **Ratul**. I built BariJao to solve a very real problem in Bangladesh.

During Eid, millions of people travel home and tickets sell out fast. Many people end up
holding tickets they can no longer use, while others desperately need one. Today those
spare tickets are sold through untrusted Facebook groups and black-market resellers, which
is risky and full of scams.

**BariJao is a community marketplace where people can safely buy and resell their travel
tickets** — with verified accounts, private buyer–seller chat, ratings, and listings that
hide sensitive details so a ticket can't be copied.

---

## ✨ Features

- 🔍 **Search tickets** by route (from / to) and journey date.
- 🧾 **List your ticket** in seconds, with an optional photo.
- 🔒 **Privacy-first listings** — seat number, ticket photo, and seller phone are hidden
  from logged-out visitors so a ticket can't be copied or misused.
- 💬 **Private chat per conversation** — each buyer↔seller thread for each ticket is
  separate, like a real marketplace inbox.
- 👤 **User profiles** with optional profile photos, star ratings, and reviews to build trust.
- 🔐 **Secure auth** — registration and login are verified with a one-time code (OTP) sent
  to the user's email.
- 🛠️ **Admin dashboard** to manage users, tickets, and transactions.
- 🌐 **Bilingual UI** (English / বাংলা).

---

## 🔄 How it works

1. **Sign up** and verify your account with a code sent to your email.
2. **List** a spare ticket with its route, date, price, and photo.
3. **Buyers search** their route, find your ticket, and **chat** with you to confirm.
4. The **buyer pays** and marks the purchase; full details are shared securely.
5. Both sides **rate each other** afterwards to build a trustworthy community.

---

## 🧰 Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router |
| Backend | Node.js, Express, JWT auth, bcrypt, Multer |
| Database | Supabase (PostgreSQL) — falls back to local SQLite if not configured |
| Email | Brevo (OTP delivery) |
| Hosting | Render |

---

## 🚀 Run it locally

```bash
git clone https://github.com/Aiuohall/BariJao.git
cd BariJao
npm install
cp .env.example .env   # optional — defaults run on a local SQLite database
npm run dev            # open http://localhost:3000
```

For a production build: `npm run build` then `NODE_ENV=production npm start`.

### Environment variables (all optional — see `.env.example`)

| Variable | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_KEY` | Use Supabase instead of local SQLite |
| `BREVO_API_KEY`, `EMAIL_FROM` | Send OTP codes by email |
| `JWT_SECRET` | Secret used to sign login tokens |
| `VITE_GOOGLE_AI_API_KEY` | Optional AI listing-description feature |
| `PORT` | Server port (default 3000) |

---

## 📌 Status

This is a working prototype I designed, built, and deployed end-to-end. It's an ongoing
personal project — I'm continuing to improve safety, payments, and identity verification.
Feedback and contributions are welcome! 🙌

— Built by **Ratul** ([@Aiuohall](https://github.com/Aiuohall))
