# AfriArt Marketplace 🌍

**Connecting African artisans with local buyers & the world.**

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-MVP-orange)

## Overview

AfriArt is a hybrid mobile marketplace designed to sell authentic African artefacts (masks, statues, textiles, jewelry, tools) to **both local African users** and **international buyers** — solving the problem that most platforms serve only one audience poorly.

### The Problem We Solve
- Locals struggle to find verified artefacts and pay with mobile money.
- Foreigners face shipping uncertainty, fake products, and no cultural authentication.

### Our Solution
- **Local mode**: Mobile money payments, local courier, COD option, regional languages.
- **Foreign mode**: Credit card, international shipping + duty estimator, authenticity badges, escrow protection.

---

## Key Features

| Feature | Local | International |
|---------|-------|----------------|
| Currency | GHS, NGN, KES, ZAR, XAF | USD, EUR, GBP |
| Payment | M-Pesa, MoMo, Airtel Money, COD | Stripe, PayPal, Credit Card |
| Shipping | Local courier, pickup points | DHL/FedEx + customs docs |
| Authentication | Phone number / National ID | Passport / Escrow |
| Map view | Find nearby artefacts | ❌ |

### Common Features (Both Modes)
- Artefact listing with origin tribe, age, material, certification
- Seller verification & reviews
- Order tracking (real-time)
- Dispute resolution
- WhatsApp sharing

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Flutter (iOS + Android) |
| Backend | Node.js + Express |
| Database | PostgreSQL, Redis |
| Payments (Local) | Paystack, Flutterwave |
| Payments (Global) | Stripe, PayPal |
| Shipping APIs | Sendy, DHL, FedEx |
| Hosting | AWS (Cape Town region) |

---

## Project Structure





A collaborative event ticketing application that allows users to book tickets for various events. The app provides features for event organizers to list events, manage bookings, and ensure a seamless experience for attendees.



🌍 Vision for Your App

Instead of:

“A site to buy tickets”

Make it:

“A digital home for events, creators, fans, and communities.”

That changes everything.

🔥 Features That Make It a Community Hub
👤 User Profiles

Let users create accounts with:

Profile pictures
Bios
Favorite events
Follow system

Example:

Sean follows DJ Kryptic and Afro Fest Nairobi
💬 Event Discussions

Add comment sections under every event.

People can:

Ask questions
Share excitement
Organize meetups
Review events

Example:

“Who else is going from Nairobi CBD?”
❤️ Follow Creators & Organizers

Allow users to:

Follow artists
Follow event organizers
Get notifications for new events

This builds returning users.

📸 Media Sharing

Let people upload:

Event photos
Short videos
Memories from events

Like a mini social platform.

🔔 Notifications

Notify users when:

Tickets are almost sold out
Favorite artist posts event
Friends attend event
New local event launches
🎵 Build Around Culture

Since you're into videography and creativity, you can focus on:

Music events
Street culture
Campus events
Film screenings
Local creators

Your app can become:

“The home of youth events in Kenya.”

💰 Ways Community Hubs Grow
1. Event Promotion

Organizers pay to feature events.

2. Creator Partnerships

Artists use your app to reach fans.

3. Ads & Sponsorships

Brands sponsor trending events.

4. Premium Tickets

VIP access, backstage passes, early access.

🚀 Smart Features to Add
🗺️ Nearby Events

Use location to show:

Events near Nairobi
🏆 Gamification

Give badges:

Top attendee
Verified organizer
Super fan
📈 Trending Page

Show:

Most popular events
Fastest selling tickets
Most followed creators
🎥 Creator Uploads

Allow:

Event trailers
Promo videos
Highlight reels

Perfect for your videography skills.

🛠️ Tech Features You’ll Need
Backend
Authentication
Notifications
Database relationships
Real-time chat
Frontend
Feed system
Profile pages
Responsive UI
Search & filters
💡 Best Community Strategy

Start small.

First Goal

Build:

Event listings
Booking system
User accounts
Then Add
Comments
Follows
Notifications
Media uploads
🔥 Your Advantage

Most ticket apps in Kenya focus only on selling.

You can focus on:

Community
Youth culture
Creators
Experiences
Content

That makes your platform different.

🎯 Big Picture

Your app could evolve into:

Event marketplace
Creator platform
Entertainment network
Local culture ecosystem

# 📂 Project Structure

```bash
TICKET-MARKET-PLACE/
│
├── client/
│   ├── pages/
│   │   ├── EventDetails.jsx
│   │
│   ├── components/
│   └── App.jsx
│
├── server/
│   ├── modules/
│   │   ├── Event.jsx
│   │   └── home.jsx
│   │
│   ├── routes/
│   └── server.js
│
├── package.json
└── README.md
```

---

# 👨‍💻 My Contribution

This project was mainly developed independently as part of a learning and practical development experience.

## My Responsibilities Included:
- Designing the frontend UI
- Building event pages
- Developing booking interfaces
- Creating reusable React components
- Structuring project folders
- Connecting frontend and backend logic
- Managing GitHub repository and version control

## Specific Files I Worked On

### Event Frontend
```bash
server/modules/Event.jsx
server/modules/home.jsx
```

### Booking Frontend
```bash
client/pages/EventDetails.jsx
```

---

# ⚡ Challenges Faced

## Problem
Working individually on a project that was originally intended for a team created challenges in:
- Managing workload
- Debugging frontend issues
- Structuring components properly
- Connecting backend logic efficiently

## Solution
To solve this:
- Improved project organization
- Practiced component-based architecture
- Used GitHub for version tracking
- Focused on responsive UI development
- Continuously tested features during development

---

# 📸 Future Improvements

- User authentication system
- Online payment integration
- Admin dashboard
- Ticket QR code generation
- Email notifications
- Search and filtering system
- Event analytics dashboard

---

