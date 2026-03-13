# To-Du API

## Project Overview

To-Du is a backend task management system built with Node.js and Express. It provides a secure, fully-featured RESTful API that allows users to register, authenticate, and manage personal tasks — complete with a priority-based email reminder system that runs automatically in the background.

---

## Features

### Authentication & Authorization
- User registration with secure password hashing (Argon2id)
- User login with JWT-based authentication
- JWT stored in HTTP-only cookies (XSS-safe)
- `SameSite: Strict` cookie policy (CSRF-safe)
- Protected routes using authentication middleware
- Role-based access control (`user` | `admin`)
- Logout support with cookie invalidation

### User Management
- Fetch authenticated user profile
- Edit user details (name, email, password)
- Password reset via 4-digit OTP sent to email (expires in 10 minutes)
- Admin-only: fetch all users

### Task Management
- Create tasks with title, description, and priority
- Fetch all personal tasks with optional filtering by status, priority, or search query
- Fetch a single task by ID
- Update task fields partially (title, body, priority) — status auto-resets to `pending` on update
- Change task status independently (`pending`, `completed`, `cancelled`)
- Delete task

### Priority System
Tasks support four priority levels which directly control reminder frequency:

| Priority | Reminders/Day | Interval  |
|----------|--------------|-----------|
| Low      | 1            | 24 hours  |
| Medium   | 3            | 8 hours   |
| High     | 6            | 4 hours   |
| Utmost   | 12           | 2 hours   |

### Email Notifications
- Email delivery via Nodemailer
- Mailtrap integration for development testing
- HTML-formatted task reminder emails
- Manual reminder trigger endpoint per task
- `nextReminderAt` field controls automated email frequency

### Background Processing
- Cron-based background job scans tasks for due reminders
- Automatic reminder emails sent based on priority interval
- Safe error handling within scheduled jobs

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
│   └── userController.js          User & auth endpoint logic
├── db/
│   ├── tasks.json                 Task data store
│   └── users.json                 User data store
├── middleware/
│   ├── asyncHandler.js            Wraps async controllers for error forwarding
│   ├── authMiddleware.js          JWT authentication — attaches req.user
│   ├── adminMiddleware.js         Role check — admin only routes
│   └── errorMiddleware.js         Global error handler
├── models/
│   ├── errorModel.js              HttpError class
│   └── sucessModel.js             HttpMessage class
├── routes/
│   ├── taskRoutes.js              Task endpoints
│   └── userRoutes.js              User & auth endpoints
├── utils/
│   ├── constants.js               PRIORITIES, TASK_STATUS constants
│   ├── cronJobs.js                Background reminder scheduler
│   ├── fileHelper.js              Read/write helpers for JSON stores
│   ├── mailer.js                  Nodemailer transport config
│   ├── reminderHelper.js          Reminder interval logic
│   ├── sendCookie.js              Cookie setter utility
│   ├── sendEmail.js               Email dispatch utility
│   └── token.js                   JWT generation utility
├── server.js                      Entry point — starts the server
├── .env                           Environment variables (never commit)
└── package.json
```

---

## Setup

### Prerequisites
- Node.js v18+
- A Mailtrap account (for email testing in development)

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

You're good to go. The server starts and the cron job initializes automatically.

---

## Environment Variables

Create a `.env` file in the project root with the following:

```env
# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRE=1d

# Email (Mailtrap — development)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_username
MAIL_PASS=your_mailtrap_password
MAIL_FROM=noreply@todo.dev
```

> Never commit your `.env` file. It is already included in `.gitignore`.

---

## Usage

### Base URL
```
http://localhost:5000
```

All endpoints are prefixed with `/api`.

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
  "role": "user",
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
**Response `200`:** Returns user data. JWT is set as an HTTP-only cookie automatically.

```json
{
  "id": "user-a1b2c3d4",
  "userName": "Nox",
  "email": "nox@example.com",
  "role": "user"
}
```

---

#### Logout
```
POST /api/users/logout
```
**Auth required.** Clears the JWT cookie.

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
  "role": "user",
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
**Response `200`:** Returns updated user object (no password field).

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
> The response is intentionally the same whether the email exists or not — this prevents email enumeration.

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

**Response `200`:** Returns array of all users (no password fields).

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
**Auth required.** All fields optional — send only what you want to update. Status always resets to `pending` on any update.

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
**Auth required.** Triggers an immediate reminder email for the specified task and resets the `nextReminderAt` timer.

**Response `200`:**
```json
{
  "message": "Reminder sent successfully."
}
```

---

## Known Issues & Limitations

- **JSON file storage** — the current persistence layer uses flat JSON files. This is not suitable for concurrent writes or production scale. A database (PostgreSQL, MongoDB) should replace it before any production deployment.
- **No rate limiting** — the forgot-password endpoint is currently unprotected against brute-force or spam requests. A rate limiter (e.g. `express-rate-limit`) should be added before going live.
- **OTP is stored in plaintext** — the reset OTP is stored directly in `users.json`. For production, OTPs should be hashed before storage.
- **No refresh token** — JWT expires in 1 day with no refresh mechanism. Users are logged out after expiry with no silent renewal.
- **Cron job runs in-process** — the reminder scheduler runs inside the Express process. For production, this should be moved to a dedicated worker or job queue (e.g. BullMQ).
- **`fetchAllTasks`** — exported from `taskController.js` but not yet wired to a route.

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
- Never commit `.env` or any secrets
- Test your endpoints with Postman or the existing test suite before submitting a PR
- Keep PRs focused — one feature or fix per PR

---

## License

This project is open source and available under the [MIT License](LICENSE).