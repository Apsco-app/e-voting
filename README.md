# School E‑Voting System (Offline-First)

A local network (LAN) e-voting platform for schools, designed to run reliably in computer labs with limited or no internet access. The project includes:

- **Backend API** built with Node.js, Express, and SQLite.
- **Frontend web app** built with React and Vite.
- **Separate admin and voter workflows** for election setup and ballot casting.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [1) Backend setup](#1-backend-setup)
  - [2) Frontend setup](#2-frontend-setup)
- [Environment Configuration](#environment-configuration)
- [Default Sample Data](#default-sample-data)
- [How to Access from Other Devices on the LAN](#how-to-access-from-other-devices-on-the-lan)
- [Available Scripts](#available-scripts)
- [Operational Notes](#operational-notes)
- [Troubleshooting](#troubleshooting)
- [Security Notes for Production Use](#security-notes-for-production-use)

---

## Overview

This system is intended for internal school elections where administrators need to manage candidates and monitor election status, while students cast votes once using unique voter credentials.

The backend persists data in a local SQLite database and enforces one-vote-per-student-per-post constraints at the database level.

## Core Features

- Admin and voter authentication flows.
- Election activation/deactivation workflow.
- Candidate and post management.
- Vote submission with duplicate-vote prevention.
- SQLite WAL mode enabled for better concurrency on local networks.
- Seed script to quickly initialize sample election data.

## Tech Stack

### Backend
- Node.js (>= 18)
- Express
- SQLite3
- JSON Web Tokens (JWT)
- dotenv

### Frontend
- React 18
- React Router
- Vite 5

## Project Structure

```text
/backend   Express API, database layer, routes, controllers, seeding
/frontend  React frontend application
README.md  Project documentation
```

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed
- **npm** installed (comes with Node.js)
- Two terminals (one for backend, one for frontend)

## Quick Start

### 1) Backend setup

From the repository root:

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the required values:

```env
PORT=3000
JWT_SECRET=replace-with-a-secure-random-string
ADMIN_USER=admin
ADMIN_PASS=change-this-password
```

Seed sample data (recommended for first run):

```bash
npm run seed
```

Start the backend server:

```bash
npm start
```

The backend listens on:

- `http://localhost:3000` (same machine)
- `http://<HOST_LAN_IP>:3000` (other devices on the same network)

### 2) Frontend setup

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend typically runs on:

- `http://localhost:5173` (same machine)
- `http://<HOST_LAN_IP>:5173` (other devices on the same network)

## Environment Configuration

The backend requires the following environment variables in `backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (defaults to `3000` if omitted). |
| `JWT_SECRET` | Yes | Secret used to sign authentication tokens. |
| `ADMIN_USER` | Yes | Admin login username. |
| `ADMIN_PASS` | Yes | Admin login password. |

> The server will fail to start if `JWT_SECRET`, `ADMIN_USER`, or `ADMIN_PASS` are missing.

## Default Sample Data

Running `npm run seed` in the backend creates:

- Example posts (e.g., President, Vice President, Secretary)
- Example candidates per post
- Example student records with generated voter IDs

This is helpful for demos and test runs in a lab environment.

## How to Access from Other Devices on the LAN

1. Find the host machine's IPv4 address (for example `192.168.1.25`).
2. Ensure both backend and frontend processes are running.
3. On another device connected to the same network, open:
   - Frontend: `http://192.168.1.25:5173`
   - Backend API (if needed): `http://192.168.1.25:3000`

If it does not open:

- Verify the devices are on the same subnet.
- Check OS firewall rules for ports `3000` and `5173`.
- Confirm no other process is using those ports.

## Available Scripts

### Backend (`/backend`)

- `npm start` — starts the API server
- `npm run seed` — initializes sample election data

### Frontend (`/frontend`)

- `npm run dev` — starts Vite development server
- `npm run build` — creates production build
- `npm run preview` — previews production build locally

## Operational Notes

- Votes are recorded transactionally with uniqueness constraints to block duplicate voting per post.
- Student IDs are stored with hashed lookups for authentication and integrity checks.
- SQLite is configured with WAL mode and additional indexes for better local concurrency.

## Troubleshooting

### Backend exits immediately on startup

Cause: Missing required environment variables.

Fix: Ensure `backend/.env` contains `JWT_SECRET`, `ADMIN_USER`, and `ADMIN_PASS`.

### `EADDRINUSE` port errors

Cause: Port `3000` or `5173` already in use.

Fix:

- Stop the existing process using that port, or
- Change the port configuration and restart.

### Frontend cannot reach backend from another device

Cause: LAN/firewall/network mismatch.

Fix:

- Use host LAN IP, not `localhost`.
- Open firewall for used ports.
- Verify both devices are connected to the same network.

## Security Notes for Production Use

This project is designed for controlled LAN environments (e.g., school labs). Before any wider deployment:

- Use strong admin credentials.
- Use a long, random `JWT_SECRET`.
- Restrict network access to trusted devices.
- Add HTTPS and reverse proxy hardening.
- Implement backup/restore procedures for `backend/data.sqlite`.
