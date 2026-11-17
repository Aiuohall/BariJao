# BariJao — Bangladesh E-Ticketing & Safe P2P Ticket Resale 🎟️

> Bangladesh's comprehensive travel portal: Buy **Official E-Tickets** (Bus, Train, Launch, Flight) like Shohoz & BDtickets, alongside the trusted **P2P Resale Market** to buy and resell spare travel tickets.

🔗 **Live app:** https://barijao.onrender.com

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## 👋 About this project

BariJao brings the best of both worlds to Bangladeshi travelers:
1. **Official E-Ticketing System**: Direct booking for major transport operators across Bangladesh (Bus, Bangladesh Railway Train, Launch, and Domestic Airlines) with interactive seat layout selection, promo coupons, and instant verified e-ticket vouchers.
2. **P2P Second-Hand Ticket Exchange**: Bangladesh's trusted community marketplace where travelers can safely resell or buy sold-out Eid and rush tickets without black-market scams.

---

## ✨ Features

### 🚌 1. Official E-Ticketing Platform (Shohoz & BDtickets Style)
- **Multi-Modal Transport Search**: Bus (Green Line, Hanif, Shohagh, Shyamoli, Desh Travels, Ena, Saintmartin, London Express), Train (Bangladesh Railway Subarna, Cox's Bazar Express, Sonar Bangla), Launch (MV Manami, MV Parabat, MV Sundarban), and Domestic Flights (Biman Bangladesh, US-Bangla, Air Astra).
- **Interactive Graphical Seat Layout Plan**: Clickable real-bus (2x2, 2x1 luxury, sleeper), train coach, and launch cabin seat layouts with available, booked, and ladies-only indicators.
- **Boarding & Dropping Points**: Choose exact terminal counters with departure and arrival timings.
- **Bangladeshi Payment Simulator**: Support for bKash (with PIN/OTP verification flow), Nagad, Rocket, and Debit/Credit Cards.
- **Instant Verified E-Ticket Voucher**: Displays unique booking PNR (e.g. `BJ-BUS-789012`), QR code, barcode, seat breakdown, and printable PDF voucher (`window.print()`).
- **PNR / Booking Status Checker**: Search and print confirmed e-tickets anytime using PNR or passenger mobile number.

### 🤝 2. Safe P2P Ticket Resale Marketplace
- **List Spare Tickets**: Fill details in seconds with optional image upload and AI-assisted descriptions.
- **Anti-Fraud Privacy**: Seat numbers, ticket copies, and seller phone numbers are masked until purchase confirmation to prevent duplicate ticket fraud.
- **Private Buyer↔Seller Chat**: 1-on-1 negotiation and coordination threads.
- **Seller Trust Badges & Ratings**: User ratings and verified community badges.
- **Unified Dashboard**: Manage official e-ticket vouchers, resale listings, and purchases all in one place.
- **Bilingual Interface**: Full English and Bengali (বাংলা) support.

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
