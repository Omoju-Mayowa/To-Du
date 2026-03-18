# To-Du API

## Project Overview

To-Du is a backend task management system built with Node.js and Express. It provides a secure, fully-featured RESTful API that allows users to register, authenticate, and manage personal tasks — complete with a priority-based email reminder system that won't let you forget that thing you've been putting off since January. It uses a local JSON file to store users and tasks data, because sometimes simplicity is a flex.

---

## Features

### Authentication & Authorization
- User registration with secure password hashing (Argon2id — because MD5 is a cry for help)
- User login with JWT-based authentication
- Access token (15 minutes) + Refresh token (7 days) — yes, we upgraded. You're welcome.
- Both tokens stored in HTTP-only cookies (XSS can't touch this)
- `SameSite: Strict` cookie policy (CSRF tried it. CSRF lost.)
- Auth middleware that silently rotates your access token when it expires — no interruptions, no drama
- Refresh token stored in the DB so we can actually revoke it (revolutionary concept)
- Logout support that nukes both cookies AND the DB record. Clean sweep.

### User Management
- Fetch authenticated user profile
- Edit user details (name, email, password)
- Password reset via 4-digit OTP sent to email (expires in 10 minutes — tick tock)
- Admin-only: fetch all users (power move)

### Task Management
- Create tasks with title, description, and priority
- Fetch all personal tasks with optional filtering by status, priority, or search query
- Fetch a single task by ID
- Update task fields partially (title, body, priority) — status auto-resets to `pending` on update, because apparently you're not done yet
- Change task status independently (`pending`, `completed`, `cancelled`)
- Delete task (for when you decide the task was a bad idea all along)

### Priority System
Tasks support four priority levels which directly control how aggressively the API guilt-trips you:

| Priority | Reminders/Day | Interval  |
|----------|--------------|-----------|
| Low      | 1            | 24 hours  |
| Medium   | 3            | 8 hours   |
| High     | 6            | 4 hours   |
| Utmost   | 12           | 2 hours   |

> Set a task to `utmost` if you truly hate yourself.

### Email Notifications
- Email delivery via Nodemailer
- Mailtrap integration for development testing
- HTML-formatted task reminder emails (we put in the effort so you'd feel bad ignoring them)
- Manual reminder trigger endpoint per task
- `nextReminderAt` field controls automated email frequency

### Background Processing
- Cron-based background job scans tasks for due reminders
- Automatic reminder emails sent based on priority interval
- Safe error handling within scheduled jobs (it won't crash, it'll just silently judge you)

### Validation & Error Handling
- Centralized error handling via custom `HttpError`
- Standardized success responses via `HttpMessage`
- Field-level validation on all inputs
- Priority and status validation against predefined constants

### Persistence
- JSON file-based storage for users and tasks
- Read/write helper utilities for consistent data handling

---

## Project Structure

```
.
├── controllers/
│   ├── taskController.js          Task endpoint logic
│   └── userController.js          User & auth endpoint logic (login, logout, refresh — all the drama)
├── db/
│   ├── tasks.json                 Task data store
│   └── users.json                 User data store (refresh tokens live here too now)
├── middleware/
│   ├── asyncHandler.js            Wraps async controllers for error forwarding
│   ├── authMiddleware.js          JWT auth — checks access token, silently refreshes if expired
│   └── errorMiddleware.js         Global error handler
├── models/
│   ├── errorModel.js              HttpError class
│   └── sucessModel.js             HttpMessage class
├── routes/
│   ├── taskRoutes.js              Task endpoints
│   └── userRoutes.js              User & auth endpoints
├── utils/
│   ├── constants.js               PRIORITIES, TASK_STATUS constants
│   ├── cronJobs.js                Background reminder scheduler (the nagging engine)
│   ├── fileHelper.js              Read/write helpers for JSON stores
│   ├── mailer.js                  Nodemailer transport config
│   ├── reminderHelper.js          Reminder interval logic
│   └── sendEmail.js               Email dispatch utility
├── server.js                      Entry point — starts the server
├── .env                           Environment variables (commit this and it's over for you)
└── package.json
```

---

## Setup

### Prerequisites
- Node.js v18+
- A Mailtrap account (for email testing in development)
- The will to actually finish your tasks (optional but recommended)

### Clone the Repo
```sh
git clone https://github.com/Omoju-Mayowa/To-Du
cd To-Du
```

### Install Dependencies
```sh
npm install
```

### Configure Environment Variables
Create a `.env` file in the root directory. See [Environment Variables](#environment-variables) below for the full reference.

### Start the Server
```sh
npm start
```

You're good to go. The server starts, the cron job initializes automatically, and the guilt trips begin.

---

## Environment Variables

Create a `.env` file in the project root with the following:

```env
# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_strong_random_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here        # new — don't skip this
JWT_REFRESH_EXPIRE=7d
JWT_EXPIRE=15m

# Email (Mailtrap — development)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_username
MAIL_PASS=your_mailtrap_password
MAIL_FROM=noreply@todo.dev
```

> Never commit your `.env` file. It is already in `.gitignore`. If you still commit it, that's a personal problem.

---

## Usage

### Base URL
```
http://localhost:5000
```

All endpoints are prefixed with `/api`.

---

### Authentication Flow

Here's the big picture now that refresh tokens exist:

1. **Login** → receive access token (15m) + refresh token (7d), both as httpOnly cookies
2. **Make requests** → auth middleware validates your access token automatically
3. **Access token expires** → middleware detects this, silently validates your refresh token, issues a new access token and continues your request. You won't feel a thing.
4. **Refresh token expires** → you're getting logged out. Log back in. Skill issue.
5. **Logout** → both cookies cleared, refresh token deleted from DB. Truly gone.

---

### User Endpoints

#### Register
```
POST /api/users/register
```
**Body:**
```json
{
  "userName": "Nox",
  "email": "nox@example.com",
  "password": "securepassword"
}
```
**Response `201`:**
```json
{
  "id": "user-a1b2c3d4",
  "userName": "Nox",
  "email": "nox@example.com",
  "createdAt": "2026-03-13T00:00:00.000Z"
}
```

---

#### Login
```
POST /api/users/login
```
**Body:**
```json
{
  "email": "nox@example.com",
  "password": "securepassword"
}
```
**Response `200`:** Returns user data. Access token and refresh token are set as HTTP-only cookies automatically. No token in the response body — we're not animals.

```json
{
  "id": "user-a1b2c3d4",
  "userName": "Nox",
  "email": "nox@example.com"
}
```

---

#### Logout
```
POST /api/users/logout
```
**Auth required.** Clears both cookies and deletes the refresh token from the database.

**Response `200`:**
```json
{
  "message": "Logged out successfully."
}
```

---

#### Get Current User
```
GET /api/users/me
```
**Auth required.**

**Response `200`:**
```json
{
  "id": "user-a1b2c3d4",
  "userName": "Nox",
  "email": "nox@example.com",
  "createdAt": "2026-03-13T00:00:00.000Z"
}
```

---

#### Edit User
```
PATCH /api/users/edit-me
```
**Auth required.** All fields are optional — send only what you want to update.

**Body:**
```json
{
  "userName": "NoxUpdated",
  "email": "new@example.com",
  "password": "newpassword"
}
```
**Response `200`:** Returns updated user object (no password, no tokens — just the clean stuff).

---

#### Forgot Password
```
POST /api/users/forgot-password
```
Sends a 4-digit OTP to the provided email. OTP expires in 10 minutes.

**Body:**
```json
{
  "email": "nox@example.com"
}
```
**Response `200`:**
```json
{
  "message": "If that email exists, an OTP has been sent."
}
```
> The response is intentionally identical whether the email exists or not — we don't help hackers enumerate accounts.

---

#### Reset Password
```
POST /api/users/reset-password
```
**Body:**
```json
{
  "email": "nox@example.com",
  "otp": "4729",
  "newPassword": "brandnewpassword"
}
```
**Response `200`:**
```json
{
  "message": "Password reset successfully."
}
```

---

#### Get All Users *(Admin only)*
```
GET /api/users/
```
**Auth + Admin required.**

**Response `200`:** Returns array of all users (no passwords, no tokens — nothing spicy).

---

### Task Endpoints

#### Create Task
```
POST /api/tasks/
```
**Auth required.**

**Body:**
```json
{
  "title": "Finish project",
  "body": "Complete the To-Du API before deadline",
  "priority": "high"
}
```
Valid priorities: `low`, `medium`, `high`, `utmost`

**Response `200`:**
```json
{
  "id": "task-e9f8d7c6",
  "title": "Finish project",
  "body": "Complete the To-Du API before deadline",
  "priority": "high",
  "status": "pending",
  "userID": "user-a1b2c3d4",
  "createdAt": "2026-03-13T00:00:00.000Z",
  "nextReminderAt": "2026-03-13T04:00:00.000Z"
}
```

---

#### Fetch My Tasks
```
GET /api/tasks/
```
**Auth required.** Returns only tasks belonging to the authenticated user.

**Optional query params:**

| Param    | Description                        | Example              |
|----------|------------------------------------|----------------------|
| status   | Filter by status                   | `?status=pending`    |
| priority | Filter by priority                 | `?priority=high`     |
| search   | Search by title keyword            | `?search=project`    |

**Response `200`:** Array of task objects.

---

#### Fetch Single Task
```
GET /api/tasks/:id
```
**Auth required.** Returns the task if it belongs to the authenticated user.

**Response `200`:** Single task object.

---

#### Update Task
```
PATCH /api/tasks/:id
```
**Auth required.** All fields optional. Status always resets to `pending` on any update — the API refuses to let you pretend you're done.

**Body:**
```json
{
  "title": "Updated title",
  "priority": "utmost"
}
```
**Response `200`:** Updated task object.

---

#### Change Task Status
```
PATCH /api/tasks/:id/status
```
**Auth required.**

**Body:**
```json
{
  "status": "completed"
}
```
Valid statuses: `pending`, `completed`, `cancelled`

**Response `200`:**
```json
{
  "message": "Task marked as completed.",
  "...task fields"
}
```

---

#### Delete Task
```
DELETE /api/tasks/:id
```
**Auth required.**

**Response `200`:**
```json
{
  "message": "Task deleted successfully."
}
```

---

#### Send Manual Reminder
```
POST /api/tasks/:id/reminder
```
**Auth required.** Triggers an immediate reminder email and resets the `nextReminderAt` timer. For when you want to be yelled at right now.

**Response `200`:**
```json
{
  "message": "Reminder sent successfully."
}
```

---

## Known Issues & Limitations

- **JSON file storage** — flat JSON files are not built for scale or concurrent writes. Replace with a real database (PostgreSQL, MongoDB) before anything near production.
- **No rate limiting on forgot-password** — this endpoint is currently unguarded. A determined attacker (or a very confused user) could spam it freely. Add `express-rate-limit` before going live.
- **OTP stored in plaintext** — the reset OTP sits raw in `users.json`. Hash it before production. Please.
- **Cron job runs in-process** — the reminder scheduler lives inside the Express process. For production, move it to a dedicated worker or job queue (BullMQ, etc.).
- **`fetchAllTasks`** — exported from `taskController.js` but not yet wired to a route. It exists. It waits.

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: description of change"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`

### Guidelines
- Follow the existing code style — async/await, `HttpError`/`HttpMessage` for all responses
- Never commit `.env` or any secrets. Ever. We mean it.
- Test your endpoints with Postman before submitting a PR
- Keep PRs focused — one feature or fix per PR. We're not reviewing a novel.

---

## License

This project is open source and available under the [MIT License](LICENSE).
