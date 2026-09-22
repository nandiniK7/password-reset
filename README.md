# Password Reset App

A MERN application that implements **Register → Forgot Password → Reset Password**.

> **This project intentionally does not implement Login.** There is no login page, login route, login API, JWT, or protected dashboard. Registration goes straight to Forgot Password so the reset flow can be tested.

- Frontend (Netlify): https://passwordreset0.netlify.app
- Backend (Render): https://password-reset-1-qfps.onrender.com
- Repository: https://github.com/nandiniK7/password-reset

## Technologies

| Frontend | Backend |
| --- | --- |
| React 19, Vite, React Router, Axios, Bootstrap 5 | Node.js, Express 5, MongoDB, Mongoose, bcrypt, Nodemailer, `crypto`, CORS |

## Features

- Registration with bcrypt-hashed passwords and duplicate-email rejection (HTTP 409)
- Forgot Password with a cryptographically secure reset token (`crypto.randomBytes`)
- Only the **SHA-256 hash** of the token is stored in MongoDB; the raw token exists only in the emailed link
- Reset tokens expire after **1 hour** and are **single-use** (cleared atomically on successful reset)
- The reset page verifies the token **before** showing the form; invalid/expired links show "Invalid or expired reset link."
- Reset email sent with Nodemailer (Gmail SMTP)
- Production-safe CORS allow-list for the Netlify frontend

## Project structure

```text
password-reset-flow/
├── client/                     React + Vite frontend
│   ├── public/_redirects       Netlify SPA fallback
│   └── src/
│       ├── api.js              single source of truth for API_URL
│       ├── App.jsx             routes: /, /forgot-password, /reset-password/:token
│       ├── components/AuthCard.jsx
│       └── pages/              Register, ForgotPassword, ResetPassword
└── server/                     Express API
    ├── config/db.js            MongoDB connection
    ├── controllers/authController.js
    ├── models/User.js
    ├── routes/authRoutes.js
    ├── utils/sendEmail.js      Nodemailer helper
    ├── utils/frontendUrl.js    frontendUrl() helper (FRONTEND_URL with production fallback)
    └── server.js               app, CORS allow-list, /api/health
```

## API endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check, returns `{ "status": "ok" }` |
| POST | `/api/auth/register` | Create a user (`name`, `email`, `password`) |
| POST | `/api/auth/forgot-password` | Generate a reset token and email the link (`email`) |
| GET | `/api/auth/verify-reset-token/:token` | Check that a token is valid and unexpired |
| POST | `/api/auth/reset-password/:token` | Set a new password (`password`) and invalidate the token |

Status codes: `400` invalid input or invalid/expired token, `404` email not registered, `409` email already registered, `500` server error.

## Frontend routes

`/` (Register), `/forgot-password`, `/reset-password/:token`. Any other path redirects to `/`.

## Local setup

Requirements: Node.js 18+ and a MongoDB database (see [MongoDB setup](#mongodb-setup)).

### Backend

```bash
cd server
npm install
cp .env.example .env     # then edit .env
npm run dev              # or: npm start
```

Expected log output:

```text
MongoDB Connected
Server running on port 5000
```

For local development use these values in `server/.env`:

```env
PORT=5000
MONGO_URI=<your MongoDB connection string>
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
RETURN_RESET_LINK=true
```

### Frontend

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

On `localhost` / `127.0.0.1` the frontend automatically calls `http://localhost:5000`. Anywhere else it calls `VITE_API_URL`, falling back to `https://password-reset-1-qfps.onrender.com` if that variable is missing.

## Environment variables

### `server/.env` (never commit this file)

| Variable | Description |
| --- | --- |
| `PORT` | Port to listen on (Render provides its own; `5000` locally) |
| `MONGO_URI` | MongoDB connection string |
| `FRONTEND_URL` | Frontend base URL, used in reset links and added to the CORS allow-list. Production: `https://passwordreset0.netlify.app` |
| `NODE_ENV` | `production` on Render, `development` locally |
| `RETURN_RESET_LINK` | `true` returns the reset link in the forgot-password response (for testing without email). Any other value never exposes the link |
| `EMAIL_USER` | Gmail address that sends the email |
| `EMAIL_PASS` | Gmail **App Password** (not your normal password) |
| `EMAIL_FROM` | "From" address, usually the same as `EMAIL_USER` |

### `client/.env` (optional)

```env
VITE_API_URL=https://password-reset-1-qfps.onrender.com
```

## MongoDB setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user (username + password).
3. Under **Network Access**, allow access from your IP (or `0.0.0.0/0` so Render can connect).
4. Click **Connect → Drivers** and copy the connection string.
5. Put it in `MONGO_URI`, replacing `<password>` and adding a database name, e.g. `...mongodb.net/password-reset?retryWrites=true&w=majority`.

Alternatively, use a local MongoDB: `MONGO_URI=mongodb://127.0.0.1:27017/password-reset`.

## Gmail App Password setup

1. Turn on **2-Step Verification** for the Gmail account: https://myaccount.google.com/security
2. Open https://myaccount.google.com/apppasswords and create an app password (e.g. named "Password Reset App").
3. Copy the 16-character password into `EMAIL_PASS` (no spaces). Put the Gmail address in `EMAIL_USER` and `EMAIL_FROM`.

## Deployment

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `PORT=5000`, `MONGO_URI`, `FRONTEND_URL=https://passwordreset0.netlify.app`, `NODE_ENV=production`, `RETURN_RESET_LINK=true`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- Verify: open https://password-reset-1-qfps.onrender.com/api/health, which should return `{"status":"ok"}`. (Render free instances sleep, so the first request can take ~30–60 seconds.)

### Frontend on Netlify

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://password-reset-1-qfps.onrender.com`
- `client/public/_redirects` contains `/* /index.html 200` so direct visits to `/forgot-password` and `/reset-password/<token>` work.

### CORS

The backend allows these origins: `http://localhost:5173`, `http://127.0.0.1:5173`, `https://passwordreset0.netlify.app`, and `FRONTEND_URL`. Requests from any other browser origin are rejected. Requests with no `Origin` header (curl, health checks) are allowed.

## Testing flow

1. Open the frontend. You should see the **Register** page.
2. Register with a name, email and password. You are taken directly to **Forgot Password** (there is no login step).
3. Registering the same email again shows "An account with this email already exists."
4. Click **Send Reset Link**. The link is emailed. With `RETURN_RESET_LINK=true` it is also shown on the page.
5. Open the link (`/reset-password/<token>`). The token is verified first, then the New Password / Confirm Password form appears.
6. Submit a new password. You see "Password reset successfully."
7. Open the same link again: "Invalid or expired reset link." and no form.
8. A link older than one hour is rejected the same way.

## Security notes

- Passwords are hashed with bcrypt; plaintext passwords are never stored or returned.
- Reset tokens come from `crypto.randomBytes(32)`; only their SHA-256 hash is stored.
- Tokens expire after 1 hour and are cleared in the same atomic database update that changes the password, so they cannot be reused, even by simultaneous requests.
- No secrets are in the source code. `.env` files are git-ignored.
