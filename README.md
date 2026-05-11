# School E-Voting (Offline-First)

A local LAN-ready school e-voting system with separate admin and voting interfaces. The backend uses Node.js, Express, and SQLite; the frontend uses React with Vite.

## Backend

1. Open a terminal in `c:\Users\User\Desktop\e-voting\backend`
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Seed example data:
   ```powershell
   npm run seed
   ```
4. Start server:
   ```powershell
   npm start
   ```

The backend will listen on `http://0.0.0.0:3000`. From other devices on the LAN use the host machine IP, e.g. `http://192.168.x.x:3000`.

## Frontend

1. Open a new terminal in `c:\Users\User\Desktop\e-voting\frontend`
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the UI:
   ```powershell
   npm run dev
   ```

The frontend will run on `http://0.0.0.0:5173`. Access it from another LAN device via the host IP and port `5173`.

## Admin login

- Username: `admin`
- Password: `password123`

> The backend defaults to `ADMIN_USER=admin`, `ADMIN_PASS=password123`, and a local `JWT_SECRET` when those environment variables are not set.

## Notes

- Students are imported with voter IDs like `S4-A8F3K`.
- Votes are stored in a transaction and student voting is blocked at the database level.
- The backend is configured for SQLite WAL mode and indexes key fields for concurrency.

## File structure

- `/backend` — Express server, controllers, routes, SQLite database.
- `/frontend` — React app, pages, styles, API services.
In computer lab get ip address:5173
