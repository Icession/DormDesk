# DormDesk

**Home base for your boarding house.** A full-stack management platform for
Philippine boarding houses and dormitories — built for owners who currently run
everything through notebooks and GCash screenshots.

**Live demo:** https://YOUR-VERCEL-URL.vercel.app

| Try it as | Email | Password |
|---|---|---|
| Owner | demo.owner@dormdesk.app | demo1234 |
| Tenant | demo.tenant@dormdesk.app | demo1234 |

Or sign up fresh — email confirmation is intentionally off for frictionless demoing.

---

## The problem

Around university belts in Cebu, boarding house owners manage dozens of
bedspacers with paper ledgers: who's in which room, who paid, who sent a GCash
screenshot at 11pm that's now lost in a chat thread. Tenants, mostly students
on fixed budgets, have no visibility into what they owe or proof of what
they've paid.

DormDesk replaces that with two role-based dashboards built around one
principle: **the owner runs the property; the tenant sees their own world and
nothing else.**

## Features

**Owners** create a property and share an 8-character invite code. They manage
rooms with rates and bed capacity, approve tenant room requests, generate
monthly bills (rent auto-filled from the room rate, plus utility line items),
review payment-proof screenshots with approve/reject, track maintenance
requests through a pending → in progress → resolved workflow, and read a
stats row (occupancy, collected this month, unpaid bills, open requests)
computed by a single database call.

**Tenants** join with the invite code, browse rooms sorted by price with live
bed availability and request the one that fits their budget, see itemized
bills with running balances, record payments with GCash/bank proof uploads,
and file maintenance requests with photos.

## Architecture & key engineering decisions

### 1. Bills are not payments

A bill is what's owed (the sum of its line items). A payment is a **claim** —
"I paid, here's the screenshot" — that starts as `pending` and only counts
after the owner approves it. One bill accepts many payments, modeling real
partial payments. A Postgres trigger recomputes the bill's status
(`unpaid → partially_paid → paid`) on every payment or line-item change, so
no JavaScript ever calculates payment state.

### 2. Multi-tenant Row Level Security without recursion

Every table is protected by RLS, and every cross-table permission check lives
in a `SECURITY DEFINER` SQL function (`is_property_owner`, `owns_tenant`,
`is_my_bill`, …). This sidesteps the classic Supabase pitfall where policy A
queries table B whose policy queries table A — infinite recursion. The same
functions are reused by the Storage policies, so payment proofs and
maintenance photos in private buckets are governed by the exact same
ownership logic as the database rows, keyed on the uploader's folder path.

### 3. Never trust the client

Every constraint is enforced twice: once in the UI for experience, once in
Postgres for correctness. Example: a full room renders as disabled in the
tenant's room picker, but the `request_room` RPC re-counts occupancy at the
moment of the request — so a stale page, an edited DOM, or a raw API call all
hit the same wall. Sensitive flows that RLS can't express cleanly
(invite-code joins, room requests, dashboard stats) are `SECURITY DEFINER`
RPCs that validate inputs server-side.

### 4. Approval-gated state machines

Three flows share the same shape — tenancies (pending → active → ended),
payments (pending → approved/rejected), maintenance (pending → in progress →
resolved) — and in each one, RLS dictates *who* may move *which* transition.
A tenant can create a `pending` payment but the insert policy literally
refuses any other starting status; only the property owner can flip it.

## Stack

React 19 + Vite · Tailwind CSS v4 · Supabase (Postgres, Auth, RLS, Storage,
RPC) · Vercel

## Database

Eight tables: `profiles`, `properties`, `rooms`, `tenancies`, `bills`,
`bill_items`, `payments`, `maintenance_requests` — plus two private storage
buckets. Schema, indexes, triggers, helper functions, and all RLS policies
live in [`dormdesk_phase1_schema.sql`](./dormdesk_phase1_schema.sql).

## Running locally

```bash
git clone https://github.com/Icession/YOUR-REPO-NAME.git
cd dormdesk
npm install
```

Create a Supabase project, run the schema SQL in the SQL Editor, then create
`.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

```bash
npm run dev
```

## Roadmap

Realtime dashboard updates (Supabase Realtime), automated due-date reminders
(`pg_cron` + Edge Functions), multi-property support, payment gateway
integration, and email confirmation for production tenants.

---

Built by [Kurt (Icession)](https://github.com/Icession) — BSIT, Cebu
Institute of Technology – University.
